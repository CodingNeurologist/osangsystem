import type { DetectedPeak, PeakDetectorConfig } from './types'
import { CircularBuffer } from './circular-buffer'

/**
 * 적응형 PPG 피크 검출기 (Pan-Tompkins 변형).
 *
 * 알고리즘:
 * 1. 1차 미분 → 제곱 → 이동적분 (5샘플)
 * 2. 적응 임계값 = mean + k × std (윈도우 60샘플)
 * 3. 불응기 (9샘플 ≈ 300ms at 30fps)
 * 4. 원신호 역추적으로 실제 수축기 피크 위치 결정
 * 5. 5비트 이후 템플릿 매칭 검증 (Pearson r > threshold)
 */
export class AdaptivePeakDetector {
  private config: PeakDetectorConfig
  // 미분 → 제곱 → 적분 파이프라인
  private prevFiltered: number = 0
  private integrationWindow: CircularBuffer
  private integratedBuffer: CircularBuffer
  // 적응 임계값 추적
  private lastPeakSampleIndex: number = -Infinity
  // 템플릿 매칭
  private templateSum: Float64Array | null = null
  private templateCount: number = 0
  private readonly TEMPLATE_HALF_WIDTH = 10 // 피크 좌우 10샘플 (총 21샘플)
  // 결과
  private peaks: DetectedPeak[] = []
  // 최근 템플릿 상관계수 (SQI용)
  private recentCorrelations: number[] = []

  constructor(config?: Partial<PeakDetectorConfig>) {
    this.config = {
      minPeakDistance: 9,
      adaptiveWindowSize: 60,
      thresholdMultiplier: 0.6,
      refractoryPeriod: 9,
      templateCorrelationMin: 0.6,
      ...config,
    }
    this.integrationWindow = new CircularBuffer(5)
    this.integratedBuffer = new CircularBuffer(this.config.adaptiveWindowSize)
  }

  /**
   * 한 샘플 처리. 피크 감지 시 DetectedPeak 반환, 아니면 null.
   */
  processSample(
    filteredValue: number,
    filteredBuffer: CircularBuffer,
    sampleIndex: number,
    timestamp: number,
  ): DetectedPeak | null {
    // 1. 미분
    const derivative = filteredValue - this.prevFiltered
    this.prevFiltered = filteredValue

    // 2. 제곱
    const squared = derivative * derivative

    // 3. 이동적분 (5샘플)
    this.integrationWindow.push(squared)
    const integrated = this.integrationWindow.meanLastN(
      Math.min(5, this.integrationWindow.length),
    )
    this.integratedBuffer.push(integrated)

    // 충분한 데이터 없으면 스킵
    if (this.integratedBuffer.length < 20) return null

    // 4. 적응 임계값
    const windowSize = Math.min(this.config.adaptiveWindowSize, this.integratedBuffer.length)
    const mean = this.integratedBuffer.meanLastN(windowSize)
    const std = this.integratedBuffer.stdLastN(windowSize)
    const threshold = mean + this.config.thresholdMultiplier * std

    // 5. 피크 후보 검사
    // 현재 적분값이 임계값 초과 + 이전 2샘플보다 큰 국소 최대
    const current = this.integratedBuffer.get(this.integratedBuffer.length - 1)
    const prev1 = this.integratedBuffer.get(this.integratedBuffer.length - 2)
    const prev2 = this.integratedBuffer.get(this.integratedBuffer.length - 3)

    const isAboveThreshold = current > threshold
    // 적분신호에서 하강 시작점 감지 (prev1이 극대)
    const isLocalMax = prev1 > prev2 && prev1 >= current

    if (!isAboveThreshold || !isLocalMax) return null

    // 6. 불응기 확인
    if (sampleIndex - this.lastPeakSampleIndex < this.config.refractoryPeriod) return null

    // 7. 원 필터 신호에서 실제 피크 역추적 (최근 8샘플 중 최대)
    const searchBack = 8
    let bestIdx = sampleIndex
    let bestVal = -Infinity
    for (let i = 0; i < searchBack; i++) {
      const idx = filteredBuffer.length - 1 - i
      if (idx < 0) break
      const val = filteredBuffer.get(idx)
      if (val > bestVal) {
        bestVal = val
        bestIdx = sampleIndex - i
      }
    }

    // 8. 템플릿 매칭 검증
    let isValid = true
    const halfW = this.TEMPLATE_HALF_WIDTH

    if (this.templateCount >= 5) {
      // 현재 파형 추출
      const waveform = this.extractWaveform(filteredBuffer, halfW)
      if (waveform) {
        const template = this.getTemplate()
        const corr = this.pearsonCorrelation(waveform, template)
        this.recentCorrelations.push(corr)
        if (this.recentCorrelations.length > 20) this.recentCorrelations.shift()

        if (corr < this.config.templateCorrelationMin) {
          isValid = false
        }
      }
    }

    const peak: DetectedPeak = {
      index: bestIdx,
      timestamp,
      amplitude: bestVal,
      isValid,
    }

    if (isValid) {
      this.lastPeakSampleIndex = sampleIndex
      this.peaks.push(peak)
      // 템플릿 업데이트
      this.updateTemplate(filteredBuffer, halfW)
    }

    return peak
  }

  /** 유효한 피크 목록 */
  getAcceptedPeaks(): DetectedPeak[] {
    return this.peaks
  }

  /** 최근 템플릿 상관계수 (SQI 계산용) */
  getRecentCorrelations(): number[] {
    return this.recentCorrelations
  }

  /** 현재 피크 위치에서 파형 추출 */
  private extractWaveform(buffer: CircularBuffer, halfWidth: number): Float64Array | null {
    const center = buffer.length - 1
    if (center - halfWidth < 0) return null

    const waveform = new Float64Array(halfWidth * 2 + 1)
    for (let i = -halfWidth; i <= halfWidth; i++) {
      waveform[i + halfWidth] = buffer.get(center + i)
    }
    return waveform
  }

  /** 평균 템플릿 반환 */
  private getTemplate(): Float64Array {
    const len = this.TEMPLATE_HALF_WIDTH * 2 + 1
    const template = new Float64Array(len)
    if (this.templateSum && this.templateCount > 0) {
      for (let i = 0; i < len; i++) {
        template[i] = this.templateSum[i] / this.templateCount
      }
    }
    return template
  }

  /** 러닝 평균 템플릿 업데이트 */
  private updateTemplate(buffer: CircularBuffer, halfWidth: number): void {
    const waveform = this.extractWaveform(buffer, halfWidth)
    if (!waveform) return

    const len = halfWidth * 2 + 1
    if (!this.templateSum) {
      this.templateSum = new Float64Array(len)
    }
    for (let i = 0; i < len; i++) {
      this.templateSum[i] += waveform[i]
    }
    this.templateCount++

    // 오래된 템플릿 페이드 아웃 (최근 20비트에 가중)
    if (this.templateCount > 20) {
      const decay = 20 / this.templateCount
      for (let i = 0; i < len; i++) {
        this.templateSum[i] *= decay
      }
      this.templateCount = 20
    }
  }

  /** Pearson 상관계수 */
  private pearsonCorrelation(a: Float64Array, b: Float64Array): number {
    const n = Math.min(a.length, b.length)
    if (n < 3) return 0

    let sumA = 0, sumB = 0
    for (let i = 0; i < n; i++) { sumA += a[i]; sumB += b[i] }
    const meanA = sumA / n
    const meanB = sumB / n

    let num = 0, denomA = 0, denomB = 0
    for (let i = 0; i < n; i++) {
      const dA = a[i] - meanA
      const dB = b[i] - meanB
      num += dA * dB
      denomA += dA * dA
      denomB += dB * dB
    }

    const denom = Math.sqrt(denomA * denomB)
    if (denom < 1e-10) return 0
    return num / denom
  }

  reset(): void {
    this.prevFiltered = 0
    this.integrationWindow.clear()
    this.integratedBuffer.clear()
    this.lastPeakSampleIndex = -Infinity
    this.templateSum = null
    this.templateCount = 0
    this.peaks = []
    this.recentCorrelations = []
  }
}
