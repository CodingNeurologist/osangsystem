import type { DetectedPeak, PeakDetectorConfig } from './types'
import { CircularBuffer } from './circular-buffer'

/**
 * 적응형 PPG 피크 검출기 (Pan-Tompkins 변형 + 강화된 아티팩트 내성).
 *
 * v2 개선사항:
 * - 적응 임계값 multiplier 상향 (0.6 → 0.8)
 * - 불응기 증가 (9 → 12 샘플 = ~400ms at 30fps)
 * - 이동적분 윈도우 확대 (5 → 7 샘플)
 * - 진폭 일관성 체크 추가
 * - 더 넓은 역추적 윈도우 (8 → 12)
 * - 이전 RR 기반 예측적 불응기
 */
export class AdaptivePeakDetector {
  private config: PeakDetectorConfig
  // 미분 → 제곱 → 적분 파이프라인
  private prevFiltered: number = 0
  private integrationWindow: CircularBuffer
  private integratedBuffer: CircularBuffer
  // 적응 임계값 추적
  private lastPeakSampleIndex: number = -Infinity
  private lastPeakTimestamp: number = 0
  // 템플릿 매칭
  private templateSum: Float64Array | null = null
  private templateCount: number = 0
  private readonly TEMPLATE_HALF_WIDTH = 10
  // 결과
  private peaks: DetectedPeak[] = []
  // 최근 템플릿 상관계수 (SQI용)
  private recentCorrelations: number[] = []
  // 최근 유효 RR 인터벌 (예측적 불응기용)
  private recentRR: number[] = []
  // 최근 피크 진폭 (진폭 일관성 체크용)
  private recentAmplitudes: CircularBuffer

  constructor(config?: Partial<PeakDetectorConfig>) {
    this.config = {
      minPeakDistance: 12,          // ~400ms at 30fps (150 BPM max)
      adaptiveWindowSize: 90,       // 3초 윈도우 (더 안정적)
      thresholdMultiplier: 0.8,     // 더 높은 임계 (노이즈 내성 강화)
      refractoryPeriod: 12,         // 12샘플 (~400ms)
      templateCorrelationMin: 0.55, // 약간 관대하게 (초기 수렴 허용)
      ...config,
    }
    this.integrationWindow = new CircularBuffer(7)
    this.integratedBuffer = new CircularBuffer(this.config.adaptiveWindowSize)
    this.recentAmplitudes = new CircularBuffer(20)
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

    // 3. 이동적분 (7샘플)
    this.integrationWindow.push(squared)
    const integrated = this.integrationWindow.meanLastN(
      Math.min(7, this.integrationWindow.length),
    )
    this.integratedBuffer.push(integrated)

    // 충분한 데이터 없으면 스킵
    if (this.integratedBuffer.length < 30) return null

    // 4. 적응 임계값
    const windowSize = Math.min(this.config.adaptiveWindowSize, this.integratedBuffer.length)
    const mean = this.integratedBuffer.meanLastN(windowSize)
    const std = this.integratedBuffer.stdLastN(windowSize)
    const threshold = mean + this.config.thresholdMultiplier * std

    // 5. 피크 후보 검사 (3-포인트 국소 최대)
    const current = this.integratedBuffer.get(this.integratedBuffer.length - 1)
    const prev1 = this.integratedBuffer.get(this.integratedBuffer.length - 2)
    const prev2 = this.integratedBuffer.get(this.integratedBuffer.length - 3)

    const isAboveThreshold = prev1 > threshold
    const isLocalMax = prev1 > prev2 && prev1 >= current

    if (!isAboveThreshold || !isLocalMax) return null

    // 6. 불응기 확인 (고정 + 예측적)
    const adaptiveRefractory = this.getAdaptiveRefractory()
    if (sampleIndex - this.lastPeakSampleIndex < adaptiveRefractory) return null

    // 7. 원 필터 신호에서 실제 피크 역추적 (최근 12샘플 중 최대)
    const searchBack = 12
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

    // 8. 진폭 일관성 체크
    if (this.recentAmplitudes.length >= 5) {
      const medianAmp = this.getMedianAmplitude()
      if (medianAmp > 0) {
        const ampRatio = bestVal / medianAmp
        // 진폭이 중앙값의 0.3배 미만이거나 3배 이상이면 거부
        if (ampRatio < 0.3 || ampRatio > 3.0) {
          return null
        }
      }
    }

    // 9. 템플릿 매칭 검증
    let isValid = true
    const halfW = this.TEMPLATE_HALF_WIDTH

    if (this.templateCount >= 5) {
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
      // RR 인터벌 기록
      if (this.lastPeakTimestamp > 0) {
        const rr = timestamp - this.lastPeakTimestamp
        if (rr > 300 && rr < 2000) {
          this.recentRR.push(rr)
          if (this.recentRR.length > 10) this.recentRR.shift()
        }
      }

      this.lastPeakSampleIndex = sampleIndex
      this.lastPeakTimestamp = timestamp
      this.peaks.push(peak)
      this.recentAmplitudes.push(bestVal)

      // 템플릿 업데이트
      this.updateTemplate(filteredBuffer, halfW)
    }

    return peak
  }

  /**
   * 예측적 불응기: 최근 RR 인터벌 중앙값의 40% (최소 기본값).
   * 심박이 안정적이면 정확한 불응기 설정 가능.
   */
  private getAdaptiveRefractory(): number {
    if (this.recentRR.length < 3) return this.config.refractoryPeriod

    const sorted = [...this.recentRR].sort((a, b) => a - b)
    const medianRR = sorted[Math.floor(sorted.length / 2)]
    // 중앙값 RR의 40%를 불응기로 (ms → 샘플 수)
    // 30fps 기준: 800ms median → 800*0.4/33.3 = ~9.6 샘플
    const adaptiveSamples = Math.floor(medianRR * 0.4 / 33.3)
    return Math.max(this.config.refractoryPeriod, adaptiveSamples)
  }

  /** 최근 진폭의 중앙값 */
  private getMedianAmplitude(): number {
    const n = this.recentAmplitudes.length
    if (n === 0) return 0
    const values: number[] = []
    for (let i = 0; i < n; i++) {
      values.push(this.recentAmplitudes.get(i))
    }
    values.sort((a, b) => a - b)
    return values[Math.floor(values.length / 2)]
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

  /** 지수 가중 이동 평균 템플릿 업데이트 */
  private updateTemplate(buffer: CircularBuffer, halfWidth: number): void {
    const waveform = this.extractWaveform(buffer, halfWidth)
    if (!waveform) return

    const len = halfWidth * 2 + 1
    if (!this.templateSum) {
      this.templateSum = new Float64Array(len)
    }

    // 지수 이동 평균 (alpha = 0.15)
    const alpha = 0.15
    if (this.templateCount === 0) {
      // 첫 번째 템플릿
      for (let i = 0; i < len; i++) {
        this.templateSum[i] = waveform[i]
      }
    } else {
      for (let i = 0; i < len; i++) {
        this.templateSum[i] = (1 - alpha) * this.templateSum[i] + alpha * waveform[i] * this.templateCount
      }
    }
    this.templateCount++

    // 노멀라이즈
    if (this.templateCount > 15) {
      const decay = 15 / this.templateCount
      for (let i = 0; i < len; i++) {
        this.templateSum[i] *= decay
      }
      this.templateCount = 15
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
    this.lastPeakTimestamp = 0
    this.templateSum = null
    this.templateCount = 0
    this.peaks = []
    this.recentCorrelations = []
    this.recentRR = []
    this.recentAmplitudes.clear()
  }
}
