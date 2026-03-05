import { CircularBuffer } from './circular-buffer'

// ============================================================
// 움직임 아티팩트 감지
// ============================================================

/**
 * 슬라이딩 윈도우 분산 + 가속도계 기반 움직임 감지.
 *
 * - 분산이 기준값 × 3 초과 시 아티팩트
 * - 가속도 변화량 > 1.5 m/s² 시 아티팩트
 */
export class MotionArtifactDetector {
  private baselineVariance: number = 0
  private rawBuffer: CircularBuffer
  private accelMagnitude: number = 0
  private motionHandler: ((event: DeviceMotionEvent) => void) | null = null
  private artifactCount: number = 0
  private totalSamples: number = 0

  constructor(private windowSize: number = 30) {
    this.rawBuffer = new CircularBuffer(windowSize)
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
        // 중력(9.81) 기준 차이값
        this.accelMagnitude = Math.abs(magnitude - 9.81)
      }
    }

    window.addEventListener('devicemotion', this.motionHandler)
  }

  /** 보정 단계에서 기준 분산 설정 */
  setBaselineVariance(variance: number): void {
    this.baselineVariance = variance
  }

  /** 샘플 추가 및 아티팩트 여부 판단 */
  processSample(rawValue: number): boolean {
    this.rawBuffer.push(rawValue)
    this.totalSamples++

    if (this.rawBuffer.length < this.windowSize) return false

    const variance = this.rawBuffer.varianceLastN(this.windowSize)

    // 분산 기반 감지
    const varianceArtifact = this.baselineVariance > 0 &&
      variance > this.baselineVariance * 3

    // 가속도 기반 감지
    const motionArtifact = this.accelMagnitude > 1.5

    const isArtifact = varianceArtifact || motionArtifact
    if (isArtifact) this.artifactCount++

    return isArtifact
  }

  /** 아티팩트 비율 (0–1) */
  getArtifactRatio(): number {
    if (this.totalSamples === 0) return 0
    return this.artifactCount / this.totalSamples
  }

  /** 깨끗한 신호 비율 (0–1) */
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
    this.artifactCount = 0
    this.totalSamples = 0
    this.accelMagnitude = 0
  }
}
