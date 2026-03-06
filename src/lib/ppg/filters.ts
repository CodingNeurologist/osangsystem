import type { BiquadCoefficients, BiquadState } from './types'
import { CircularBuffer } from './circular-buffer'

// ============================================================
// Butterworth IIR 디지털 필터
// ============================================================

/**
 * 2차 Butterworth 저역통과 필터 계수 (양선형 변환).
 */
export function butterworthLowpass(fc: number, fs: number): BiquadCoefficients {
  const K = Math.tan(Math.PI * fc / fs)
  const K2 = K * K
  const sqrt2K = Math.SQRT2 * K
  const norm = 1 / (1 + sqrt2K + K2)

  return {
    b0: K2 * norm,
    b1: 2 * K2 * norm,
    b2: K2 * norm,
    a1: 2 * (K2 - 1) * norm,
    a2: (1 - sqrt2K + K2) * norm,
  }
}

/**
 * 2차 Butterworth 고역통과 필터 계수 (양선형 변환).
 */
export function butterworthHighpass(fc: number, fs: number): BiquadCoefficients {
  const K = Math.tan(Math.PI * fc / fs)
  const K2 = K * K
  const sqrt2K = Math.SQRT2 * K
  const norm = 1 / (1 + sqrt2K + K2)

  return {
    b0: norm,
    b1: -2 * norm,
    b2: norm,
    a1: 2 * (K2 - 1) * norm,
    a2: (1 - sqrt2K + K2) * norm,
  }
}

/**
 * 2차 IIR Biquad 필터 (Direct Form I).
 * y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
 */
export class BiquadFilter {
  private state: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 }

  constructor(private coeffs: BiquadCoefficients) {}

  process(x: number): number {
    const { b0, b1, b2, a1, a2 } = this.coeffs
    const { x1, x2, y1, y2 } = this.state

    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2

    this.state = { x1: x, x2: x1, y1: y, y2: y1 }
    return y
  }

  reset(): void {
    this.state = { x1: 0, x2: 0, y1: 0, y2: 0 }
  }
}

/**
 * 밴드패스 필터: 고역통과 + 저역통과 캐스케이드.
 * PPG 신호용 기본값: 0.5-4.0 Hz (30-240 BPM)
 */
export class BandpassFilter {
  private hp: BiquadFilter
  private lp: BiquadFilter

  constructor(fLow: number, fHigh: number, sampleRate: number) {
    this.hp = new BiquadFilter(butterworthHighpass(fLow, sampleRate))
    this.lp = new BiquadFilter(butterworthLowpass(fHigh, sampleRate))
  }

  process(sample: number): number {
    return this.lp.process(this.hp.process(sample))
  }

  reset(): void {
    this.hp.reset()
    this.lp.reset()
  }
}

/**
 * 4차 Butterworth 밴드패스 필터 (2단 캐스케이드 biquad).
 *
 * 2차보다 2배 급한 롤오프(-40dB/decade)로
 * 저주파 모션 아티팩트와 고주파 노이즈를 더 효과적으로 제거.
 *
 * PPG 최적 대역: 0.7-3.5 Hz (42-210 BPM)
 * 기존 0.5-4.0보다 좁혀서 노이즈 감소.
 */
export class BandpassFilter4thOrder {
  private hp1: BiquadFilter
  private hp2: BiquadFilter
  private lp1: BiquadFilter
  private lp2: BiquadFilter

  constructor(fLow: number = 0.7, fHigh: number = 3.5, sampleRate: number = 30) {
    // 4차 = 2차 × 2 캐스케이드
    // 각 단의 Q 값을 조정하여 Butterworth 특성 유지
    // 4차 Butterworth의 극 각도: pi/8, 3pi/8
    const q1 = 1 / (2 * Math.cos(Math.PI / 8))  // 0.541
    const q2 = 1 / (2 * Math.cos(3 * Math.PI / 8)) // 1.307

    this.hp1 = new BiquadFilter(butterworthHighpassQ(fLow, sampleRate, q1))
    this.hp2 = new BiquadFilter(butterworthHighpassQ(fLow, sampleRate, q2))
    this.lp1 = new BiquadFilter(butterworthLowpassQ(fHigh, sampleRate, q1))
    this.lp2 = new BiquadFilter(butterworthLowpassQ(fHigh, sampleRate, q2))
  }

  process(sample: number): number {
    let y = this.hp1.process(sample)
    y = this.hp2.process(y)
    y = this.lp1.process(y)
    y = this.lp2.process(y)
    return y
  }

  reset(): void {
    this.hp1.reset()
    this.hp2.reset()
    this.lp1.reset()
    this.lp2.reset()
  }
}

/**
 * Q 파라미터를 지정할 수 있는 2차 Butterworth LPF.
 * 4차 필터의 캐스케이드 단에서 각 단의 Q값이 다르므로 필요.
 */
function butterworthLowpassQ(fc: number, fs: number, Q: number): BiquadCoefficients {
  const K = Math.tan(Math.PI * fc / fs)
  const K2 = K * K
  const norm = 1 / (1 + K / Q + K2)

  return {
    b0: K2 * norm,
    b1: 2 * K2 * norm,
    b2: K2 * norm,
    a1: 2 * (K2 - 1) * norm,
    a2: (1 - K / Q + K2) * norm,
  }
}

/**
 * Q 파라미터를 지정할 수 있는 2차 Butterworth HPF.
 */
function butterworthHighpassQ(fc: number, fs: number, Q: number): BiquadCoefficients {
  const K = Math.tan(Math.PI * fc / fs)
  const K2 = K * K
  const norm = 1 / (1 + K / Q + K2)

  return {
    b0: norm,
    b1: -2 * norm,
    b2: norm,
    a1: 2 * (K2 - 1) * norm,
    a2: (1 - K / Q + K2) * norm,
  }
}

// ============================================================
// 기저선 제거 (이동평균)
// ============================================================

/**
 * 이동평균 기저선 제거기.
 * output = raw - movingAverage(raw)
 * 기본 윈도우 300샘플 (30fps에서 10초)
 */
export class BaselineRemover {
  private buffer: CircularBuffer

  constructor(windowSize: number = 300) {
    this.buffer = new CircularBuffer(windowSize)
  }

  process(sample: number): number {
    this.buffer.push(sample)
    const baseline = this.buffer.meanLastN(this.buffer.length)
    return sample - baseline
  }

  reset(): void {
    this.buffer.clear()
  }
}

// ============================================================
// 적응형 노이즈 캔슬러 (Adaptive Noise Canceller)
// ============================================================

/**
 * NLMS (Normalized Least Mean Squares) 적응형 노이즈 캔슬러.
 *
 * Green 채널을 노이즈 레퍼런스로 사용하여 Red 채널에서
 * 움직임 아티팩트를 실시간 제거한다.
 *
 * 원리:
 * - Red 채널 = PPG 신호 + 움직임 노이즈
 * - Green 채널 = 움직임 노이즈 (PPG 성분 거의 없음)
 * - NLMS가 Green→Red 전달함수를 학습하여 노이즈 추정
 * - clean = Red - 추정노이즈
 *
 * 참고: Ram et al. (2012) "A Novel Approach for Motion Artifact
 * Reduction in PPG Signals Based on AS-LMS Adaptive Filter"
 */
export class AdaptiveNoiseCanceller {
  private weights: Float64Array
  private noiseBuffer: Float64Array
  private filterLength: number
  private mu: number // 학습률
  private head: number = 0
  private filled: boolean = false

  /**
   * @param filterLength 적응 필터 길이 (탭 수). 8~16이 PPG에 적합.
   * @param mu 학습률. 0.01~0.1 범위. 작을수록 안정적, 클수록 빠른 추적.
   */
  constructor(filterLength: number = 12, mu: number = 0.05) {
    this.filterLength = filterLength
    this.mu = mu
    this.weights = new Float64Array(filterLength)
    this.noiseBuffer = new Float64Array(filterLength)
  }

  /**
   * 한 샘플 처리.
   * @param primarySignal Red 채널 (PPG + 노이즈)
   * @param noiseReference Green 채널 (노이즈 레퍼런스)
   * @returns 노이즈가 제거된 신호
   */
  process(primarySignal: number, noiseReference: number): number {
    // 노이즈 버퍼 업데이트 (링 버퍼)
    this.noiseBuffer[this.head] = noiseReference
    this.head = (this.head + 1) % this.filterLength
    if (this.head === 0) this.filled = true

    if (!this.filled) return primarySignal

    // FIR 출력 (노이즈 추정)
    let noiseEstimate = 0
    for (let i = 0; i < this.filterLength; i++) {
      const idx = (this.head - 1 - i + this.filterLength) % this.filterLength
      noiseEstimate += this.weights[i] * this.noiseBuffer[idx]
    }

    // 오차 = primary - noiseEstimate (이것이 깨끗한 신호)
    const error = primarySignal - noiseEstimate

    // NLMS 가중치 업데이트
    // w[n+1] = w[n] + mu * error * x[n] / (x'x + epsilon)
    let normSq = 0
    for (let i = 0; i < this.filterLength; i++) {
      normSq += this.noiseBuffer[i] * this.noiseBuffer[i]
    }

    const epsilon = 1e-6
    const stepSize = this.mu / (normSq + epsilon)

    for (let i = 0; i < this.filterLength; i++) {
      const idx = (this.head - 1 - i + this.filterLength) % this.filterLength
      this.weights[i] += stepSize * error * this.noiseBuffer[idx]
    }

    return error
  }

  reset(): void {
    this.weights.fill(0)
    this.noiseBuffer.fill(0)
    this.head = 0
    this.filled = false
  }
}
