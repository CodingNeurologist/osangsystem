import type { BiquadCoefficients, BiquadState } from './types'
import { CircularBuffer } from './circular-buffer'

// ============================================================
// Butterworth IIR 디지털 필터
// ============================================================

/**
 * 2차 Butterworth 저역통과 필터 계수 (양선형 변환).
 *
 * H(s) = 1 / (s² + √2·s + 1) 에서
 * s = (2/T)·(z-1)/(z+1) 치환 후:
 *
 * K = tan(π·fc/fs)
 * norm = 1 / (1 + √2·K + K²)
 * b0 = K²·norm, b1 = 2·b0, b2 = b0
 * a1 = 2·(K² - 1)·norm, a2 = (1 - √2·K + K²)·norm
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
 *
 * b0 = norm, b1 = -2·norm, b2 = norm
 * a1 = 2·(K² - 1)·norm, a2 = (1 - √2·K + K²)·norm
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
 * y[n] = b0·x[n] + b1·x[n-1] + b2·x[n-2] - a1·y[n-1] - a2·y[n-2]
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
 * PPG 신호용 기본값: 0.5–4.0 Hz (30–240 BPM)
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
