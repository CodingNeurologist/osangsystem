import type { RRInterval, SignalQuality } from './types'

// ============================================================
// 신호 품질 인덱스 (SQI) 계산
// ============================================================

/**
 * Goertzel 알고리즘: 단일 주파수 DFT 진폭 계산.
 * 소수의 주파수 빈만 필요할 때 FFT 대신 사용.
 *
 * k = round(N × f / fs)
 * ω = 2π·k/N
 * coeff = 2·cos(ω)
 */
export function goertzel(signal: Float64Array, targetFreq: number, sampleRate: number): number {
  const N = signal.length
  if (N === 0) return 0

  const k = Math.round(N * targetFreq / sampleRate)
  const omega = (2 * Math.PI * k) / N
  const coeff = 2 * Math.cos(omega)

  let s1 = 0
  let s2 = 0
  for (let i = 0; i < N; i++) {
    const s0 = signal[i] + coeff * s1 - s2
    s2 = s1
    s1 = s0
  }

  return s1 * s1 + s2 * s2 - coeff * s1 * s2
}

/**
 * SQI 계산 (0–100).
 *
 * 3개 요소의 가중 평균:
 * 1. 피크 일관성 (40%): RR 인터벌 변동계수 기반
 * 2. 스펙트럼 순도 (30%): Goertzel 지배 주파수 비율
 * 3. 파형 형태 (30%): 템플릿 상관계수 평균
 */
export function computeSQI(
  rrIntervals: RRInterval[],
  signalBuffer: Float64Array,
  sampleRate: number,
  templateCorrelations: number[],
): SignalQuality {
  // 1. 피크 일관성 (RR 인터벌 변동계수)
  const peakConsistency = computePeakConsistency(rrIntervals)

  // 2. 스펙트럼 순도
  const spectralPurity = computeSpectralPurity(signalBuffer, sampleRate)

  // 3. 파형 형태 점수
  const morphologyScore = computeMorphologyScore(templateCorrelations)

  // 가중 평균
  const score = Math.round(
    (peakConsistency * 0.4 + spectralPurity * 0.3 + morphologyScore * 0.3) * 100,
  )

  let label: '양호' | '보통' | '불량'
  if (score >= 80) label = '양호'
  else if (score >= 60) label = '보통'
  else label = '불량'

  return {
    score: Math.max(0, Math.min(100, score)),
    label,
    peakConsistency,
    spectralPurity,
    morphologyScore,
  }
}

/** RR 인터벌 변동계수 기반 일관성 (0–1) */
function computePeakConsistency(rrIntervals: RRInterval[]): number {
  const valid = rrIntervals.filter(r => r.isValid)
  if (valid.length < 3) return 0

  const intervals = valid.map(r => r.interval)
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length

  if (mean < 1) return 0

  let sumSq = 0
  for (const v of intervals) {
    const diff = v - mean
    sumSq += diff * diff
  }
  const cv = Math.sqrt(sumSq / (intervals.length - 1)) / mean

  // CV < 0.1 → 우수, > 0.5 → 매우 불량
  return Math.max(0, Math.min(1, 1 - 2 * cv))
}

/** Goertzel 기반 스펙트럼 순도 (0–1) */
function computeSpectralPurity(signal: Float64Array, sampleRate: number): number {
  if (signal.length < 64) return 0.5

  // 심박 주파수 범위 (0.5–4.0 Hz) 내 에너지 분포 확인
  const testFreqs = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.5, 4.0]
  const powers: number[] = []

  let totalPower = 0
  for (const f of testFreqs) {
    const p = goertzel(signal, f, sampleRate)
    powers.push(p)
    totalPower += p
  }

  if (totalPower < 1e-10) return 0

  // 지배 주파수의 파워 비율
  const maxPower = Math.max(...powers)
  return maxPower / totalPower
}

/** 템플릿 상관계수 평균 기반 형태 점수 (0–1) */
function computeMorphologyScore(correlations: number[]): number {
  if (correlations.length === 0) return 0.5 // 데이터 부족 시 중립값

  const recent = correlations.slice(-10) // 최근 10비트
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length
  return Math.max(0, Math.min(1, mean))
}
