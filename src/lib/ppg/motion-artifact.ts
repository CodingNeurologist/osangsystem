import { CircularBuffer } from './circular-buffer'

// ============================================================
// 다중 기준 움직임 아티팩트 감지
// ============================================================

/**
 * 다중 기준 움직임 아티팩트 감지기.
 *
 * 기존 단순 분산 ×3 방식에서 4가지 독립 기준으로 강화:
 *
 * 1. 슬라이딩 윈도우 분산 (기준 ×2.5)
 * 2. 급격한 진폭 변화 (미분 기반)
 * 3. Red/Green 상관 손실 (움직임 시 상관 증가)
 * 4. 가속도계 (DeviceMotionEvent)
 *
 * 어느 하나라도 트리거되면 아티팩트로 판정.
 */
export class MotionArtifactDetector {
  private baselineVariance: number = 0
  private baselineDeriv: number = 0
  private rawBuffer: CircularBuffer
  private derivBuffer: CircularBuffer
  private greenBuffer: CircularBuffer
  private prevRaw: number = 0
  private accelMagnitude: number = 0
  private motionHandler: ((event: DeviceMotionEvent) => void) | null = null
  private artifactCount: number = 0
  private totalSamples: number = 0
  private initialized: boolean = false

  // 아티팩트 상태 추적 (연속 감지용)
  private consecutiveArtifactFrames: number = 0
  private readonly ARTIFACT_HOLDOFF: number = 5 // 아티팩트 후 5프레임 추가 무효화

  constructor(private windowSize: number = 30) {
    this.rawBuffer = new CircularBuffer(windowSize)
    this.derivBuffer = new CircularBuffer(windowSize)
    this.greenBuffer = new CircularBuffer(windowSize)
  }

  /** 가속도계 리스너 등록 */
  initAccelerometer(): void {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return

    this.motionHandler = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity
      if (accel) {
        const magnitude = Math.sqrt(
          (accel.x ?? 0) ** 2 +
          (accel.y ?? 0) ** 2 +
          (accel.z ?? 0) ** 2,
        )
        this.accelMagnitude = Math.abs(magnitude - 9.81)
      }
    }

    window.addEventListener('devicemotion', this.motionHandler)
  }

  /** 보정 단계에서 기준값 설정 */
  setBaseline(variance: number, derivStd: number): void {
    this.baselineVariance = variance
    this.baselineDeriv = derivStd
    this.initialized = true
  }

  /** 하위 호환: 기존 setBaselineVariance 메서드 */
  setBaselineVariance(variance: number): void {
    this.baselineVariance = variance
    // 미분 기준은 분산의 sqrt로 근사
    this.baselineDeriv = Math.sqrt(variance) * 0.3
    this.initialized = true
  }

  /**
   * 샘플 추가 및 아티팩트 여부 판단.
   *
   * @param rawRed Red 채널 raw 값
   * @param rawGreen Green 채널 raw 값 (선택)
   * @returns true = 아티팩트, false = 정상
   */
  processSample(rawRed: number, rawGreen?: number): boolean {
    this.rawBuffer.push(rawRed)
    this.totalSamples++

    if (rawGreen !== undefined) {
      this.greenBuffer.push(rawGreen)
    }

    // 미분 (1차 차분)
    const deriv = rawRed - this.prevRaw
    this.derivBuffer.push(Math.abs(deriv))
    this.prevRaw = rawRed

    if (this.rawBuffer.length < this.windowSize || !this.initialized) {
      return false
    }

    // ── 기준 1: 분산 기반 ──
    const variance = this.rawBuffer.varianceLastN(this.windowSize)
    const varianceArtifact = this.baselineVariance > 0 &&
      variance > this.baselineVariance * 2.5

    // ── 기준 2: 급격한 진폭 변화 (미분 기반) ──
    const recentDerivMean = this.derivBuffer.meanLastN(this.windowSize)
    const derivArtifact = this.baselineDeriv > 0 &&
      recentDerivMean > this.baselineDeriv * 3.0

    // ── 기준 3: 가속도 기반 ──
    const motionArtifact = this.accelMagnitude > 1.2

    // ── 기준 4: Red-Green 상관 (움직임 시 둘 다 같이 변함) ──
    let rgCorrelationArtifact = false
    if (rawGreen !== undefined && this.greenBuffer.length >= this.windowSize) {
      const rgCorr = this.computeRGCorrelation()
      // 정상 PPG: Red와 Green은 반상관 또는 약한 상관
      // 움직임: 둘 다 같은 방향으로 크게 변함 → 강한 양의 상관
      rgCorrelationArtifact = rgCorr > 0.7
    }

    const isArtifact = varianceArtifact || derivArtifact ||
      motionArtifact || rgCorrelationArtifact

    if (isArtifact) {
      this.artifactCount++
      this.consecutiveArtifactFrames = this.ARTIFACT_HOLDOFF
    } else if (this.consecutiveArtifactFrames > 0) {
      // 홀드오프: 아티팩트 직후 수 프레임도 무효 (잔여 진동)
      this.consecutiveArtifactFrames--
      this.artifactCount++
      return true
    }

    return isArtifact
  }

  /** Red-Green 채널 Pearson 상관계수 */
  private computeRGCorrelation(): number {
    const n = Math.min(this.rawBuffer.length, this.greenBuffer.length, this.windowSize)
    if (n < 5) return 0

    let sumR = 0, sumG = 0
    for (let i = 0; i < n; i++) {
      sumR += this.rawBuffer.get(this.rawBuffer.length - n + i)
      sumG += this.greenBuffer.get(this.greenBuffer.length - n + i)
    }
    const meanR = sumR / n
    const meanG = sumG / n

    let num = 0, denomR = 0, denomG = 0
    for (let i = 0; i < n; i++) {
      const dR = this.rawBuffer.get(this.rawBuffer.length - n + i) - meanR
      const dG = this.greenBuffer.get(this.greenBuffer.length - n + i) - meanG
      num += dR * dG
      denomR += dR * dR
      denomG += dG * dG
    }

    const denom = Math.sqrt(denomR * denomG)
    if (denom < 1e-10) return 0
    return num / denom
  }

  /** 아티팩트 비율 (0-1) */
  getArtifactRatio(): number {
    if (this.totalSamples === 0) return 0
    return this.artifactCount / this.totalSamples
  }

  /** 깨끗한 신호 비율 (0-1) */
  getCleanRatio(): number {
    return 1 - this.getArtifactRatio()
  }

  cleanup(): void {
    if (this.motionHandler && typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.motionHandler)
      this.motionHandler = null
    }
  }

  reset(): void {
    this.rawBuffer.clear()
    this.derivBuffer.clear()
    this.greenBuffer.clear()
    this.prevRaw = 0
    this.artifactCount = 0
    this.totalSamples = 0
    this.accelMagnitude = 0
    this.consecutiveArtifactFrames = 0
  }
}
