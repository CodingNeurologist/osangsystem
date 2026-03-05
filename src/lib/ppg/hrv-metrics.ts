import type { RRInterval, HRVTimeDomain, HRVFrequencyDomain, HRVInterpretation } from './types'

// ============================================================
// 시간 영역 HRV 지표 계산
// ============================================================

/**
 * 유효한 RR 인터벌로부터 시간 영역 HRV 지표를 계산한다.
 *
 * - Mean HR = 60000 / mean(NN)
 * - SDNN = sqrt( Σ(NN_i - mean)² / (N-1) )
 * - RMSSD = sqrt( Σ(NN_{i+1} - NN_i)² / (N-1) )
 * - pNN50 = 100 × count(|ΔNN| > 50ms) / (N-1)
 */
export function computeTimeDomainHRV(rrIntervals: RRInterval[]): HRVTimeDomain {
  const valid = rrIntervals.filter(r => r.isValid)
  const nn = valid.map(r => r.interval)

  if (nn.length < 3) {
    return {
      meanHR: 0,
      sdnn: 0,
      rmssd: 0,
      pnn50: 0,
      minHR: 0,
      maxHR: 0,
      nnCount: nn.length,
    }
  }

  // Mean NN
  const sum = nn.reduce((a, b) => a + b, 0)
  const meanNN = sum / nn.length

  // SDNN
  let sdnnSum = 0
  for (const interval of nn) {
    const diff = interval - meanNN
    sdnnSum += diff * diff
  }
  const sdnn = Math.sqrt(sdnnSum / (nn.length - 1))

  // RMSSD & pNN50
  let rmssdSum = 0
  let nn50Count = 0
  for (let i = 1; i < nn.length; i++) {
    const diff = nn[i] - nn[i - 1]
    rmssdSum += diff * diff
    if (Math.abs(diff) > 50) nn50Count++
  }
  const rmssd = Math.sqrt(rmssdSum / (nn.length - 1))
  const pnn50 = (nn50Count / (nn.length - 1)) * 100

  // HR
  const meanHR = 60000 / meanNN
  const maxNN = Math.max(...nn)
  const minNN = Math.min(...nn)
  const minHR = 60000 / maxNN
  const maxHR = 60000 / minNN

  return {
    meanHR: Math.round(meanHR * 10) / 10,
    sdnn: Math.round(sdnn * 10) / 10,
    rmssd: Math.round(rmssd * 10) / 10,
    pnn50: Math.round(pnn50 * 10) / 10,
    minHR: Math.round(minHR),
    maxHR: Math.round(maxHR),
    nnCount: nn.length,
  }
}

// ============================================================
// 주파수 영역 HRV 지표 (Lomb-Scargle Periodogram)
// ============================================================

/**
 * Lomb-Scargle periodogram으로 주파수 영역 HRV 지표를 계산한다.
 * RR 인터벌의 비균일 샘플링을 자연스럽게 처리한다.
 *
 * LF: 0.04–0.15 Hz (교감+부교감)
 * HF: 0.15–0.40 Hz (부교감/호흡)
 *
 * 120비트 미만이면 null 반환.
 */
export function computeFrequencyDomainHRV(
  rrIntervals: RRInterval[],
): HRVFrequencyDomain | null {
  const valid = rrIntervals.filter(r => r.isValid)
  if (valid.length < 120) return null

  // 누적 시간 (초) 및 인터벌 (초) 시계열 생성
  const times: number[] = []
  const values: number[] = []
  let cumTime = 0

  for (const rr of valid) {
    cumTime += rr.interval / 1000
    times.push(cumTime)
    values.push(rr.interval / 1000)
  }

  // 평균 제거
  const meanVal = values.reduce((a, b) => a + b, 0) / values.length
  const centered = values.map(v => v - meanVal)

  // 테스트 주파수: 0.01 ~ 0.50 Hz (0.005 Hz 간격)
  const freqs: number[] = []
  for (let f = 0.01; f <= 0.50; f += 0.005) {
    freqs.push(f)
  }

  // Lomb-Scargle 각 주파수별 파워 계산
  const power = lombScargle(times, centered, freqs)

  // 대역별 파워 적분 (사다리꼴)
  let lfPower = 0
  let hfPower = 0

  for (let i = 1; i < freqs.length; i++) {
    const df = freqs[i] - freqs[i - 1]
    const avgP = (power[i] + power[i - 1]) / 2

    if (freqs[i] >= 0.04 && freqs[i] <= 0.15) {
      lfPower += avgP * df
    }
    if (freqs[i] >= 0.15 && freqs[i] <= 0.40) {
      hfPower += avgP * df
    }
  }

  const totalPower = lfPower + hfPower
  const lfHfRatio = hfPower > 0 ? lfPower / hfPower : 0

  return {
    lfPower: Math.round(lfPower * 1000) / 1000,
    hfPower: Math.round(hfPower * 1000) / 1000,
    lfHfRatio: Math.round(lfHfRatio * 100) / 100,
    totalPower: Math.round(totalPower * 1000) / 1000,
  }
}

/**
 * Lomb-Scargle periodogram 구현.
 * 비균일 샘플링 시계열에 대한 스펙트럼 추정.
 */
function lombScargle(
  times: number[],
  values: number[],
  freqs: number[],
): Float64Array {
  const n = times.length
  const power = new Float64Array(freqs.length)

  // 분산
  let variance = 0
  for (const v of values) variance += v * v
  variance /= n

  if (variance < 1e-15) return power

  for (let fi = 0; fi < freqs.length; fi++) {
    const omega = 2 * Math.PI * freqs[fi]

    // tau 계산
    let sin2Sum = 0, cos2Sum = 0
    for (let i = 0; i < n; i++) {
      sin2Sum += Math.sin(2 * omega * times[i])
      cos2Sum += Math.cos(2 * omega * times[i])
    }
    const tau = Math.atan2(sin2Sum, cos2Sum) / (2 * omega)

    // 파워 계산
    let cosSum = 0, sinSum = 0
    let cos2 = 0, sin2 = 0
    for (let i = 0; i < n; i++) {
      const phase = omega * (times[i] - tau)
      const c = Math.cos(phase)
      const s = Math.sin(phase)
      cosSum += values[i] * c
      sinSum += values[i] * s
      cos2 += c * c
      sin2 += s * s
    }

    if (cos2 > 1e-10 && sin2 > 1e-10) {
      power[fi] = (1 / (2 * variance)) * (
        (cosSum * cosSum) / cos2 + (sinSum * sinSum) / sin2
      )
    }
  }

  return power
}

// ============================================================
// HRV 해석
// ============================================================

/**
 * RMSSD 기반 HRV 해석.
 * 일반 참고 범위 (연령/성별 미보정):
 *   ≥40ms: 양호 / 20–40ms: 보통 / <20ms: 낮음
 */
export function interpretHRV(timeDomain: HRVTimeDomain): HRVInterpretation {
  if (timeDomain.rmssd >= 40) {
    return {
      level: 'good',
      title: '자율신경 균형 양호',
      description: '부교감 신경 활동이 활발한 상태입니다. 스트레스 회복 능력이 좋은 편입니다.',
      suggestion: '현재 컨디션을 유지하면서 규칙적인 호흡 운동을 병행해 보세요.',
    }
  }
  if (timeDomain.rmssd >= 20) {
    return {
      level: 'normal',
      title: '자율신경 활동 보통',
      description: '일반적인 범위의 자율신경 활동을 보이고 있습니다.',
      suggestion: '호흡 운동이나 명상으로 부교감 신경을 더 활성화해 보세요.',
    }
  }
  return {
    level: 'low',
    title: '자율신경 활동 낮음',
    description: '부교감 신경 활동이 다소 낮은 편입니다. 피로나 스트레스가 누적된 상태일 수 있습니다.',
    suggestion: '4-7-8 호흡이나 미주신경 마사지를 시도해 보세요. 지속되면 전문의 상담을 권장합니다.',
  }
}

/**
 * 신뢰도 점수 계산.
 */
export function computeConfidence(
  validBeatCount: number,
  cleanSignalRatio: number,
  measurementDuration: number,
): { score: number; label: '높음' | '보통' | '낮음' } {
  // 비트 수 기반 (최소 40, 최적 80+)
  const beatScore = Math.min(1, validBeatCount / 80)
  // 깨끗한 신호 비율
  const cleanScore = cleanSignalRatio
  // 측정 시간 (최소 60초, 최적 90초+)
  const durationScore = Math.min(1, measurementDuration / 90)

  const score = Math.round((beatScore * 0.4 + cleanScore * 0.35 + durationScore * 0.25) * 100)

  let label: '높음' | '보통' | '낮음'
  if (score >= 75) label = '높음'
  else if (score >= 50) label = '보통'
  else label = '낮음'

  return { score, label }
}
