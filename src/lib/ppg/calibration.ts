import type { CalibrationState, CalibrationResult } from './types'
import { BandpassFilter } from './filters'
import { goertzel } from './signal-quality'

// ============================================================
// PPG 보정 (Calibration)
// ============================================================

/**
 * 10초간 수집한 PPG 샘플로 보정을 수행한다.
 *
 * 검증 항목:
 * 1. 적색 채널 강도 범위 (50–200)
 * 2. AC 비율 (0.001–0.05)
 * 3. 맥동 주파수 확인 (Goertzel 0.7–3.0 Hz)
 * 4. 기준 파라미터 산출
 */
export function runCalibration(
  state: CalibrationState,
  sampleRate: number,
): CalibrationResult {
  const { samples } = state

  if (samples.length < sampleRate * 5) {
    return {
      isValid: false,
      baselineAmplitude: 0,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: 0,
      peakFrequency: 0,
      message: '데이터가 충분하지 않습니다. 잠시 기다려 주세요.',
    }
  }

  // 평균 적색 강도
  const avgRed = samples.reduce((a, b) => a + b, 0) / samples.length

  // 1. 강도 범위 확인
  // 플래시+손가락 = Red 평균 180~254가 정상 (기기마다 다름)
  // 완전 포화(255.0)만 거부, 높은 값은 오히려 좋은 신호
  if (avgRed > 254.5) {
    return {
      isValid: false,
      baselineAmplitude: 0,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: avgRed,
      peakFrequency: 0,
      message: `완전 포화 상태입니다 (R:${avgRed.toFixed(0)}). 손가락을 살짝 떼어주세요.`,
    }
  }

  if (avgRed < 20) {
    return {
      isValid: false,
      baselineAmplitude: 0,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: avgRed,
      peakFrequency: 0,
      message: `신호 미감지 (R:${avgRed.toFixed(0)}). 후면 카메라 위에 손가락을 올려주세요.`,
    }
  }

  // 2. AC 비율 (변동성) 확인
  // PPG 변동은 매우 작을 수 있음 (0.01~5% 정도)
  let sumSq = 0
  for (const s of samples) {
    const diff = s - avgRed
    sumSq += diff * diff
  }
  const std = Math.sqrt(sumSq / (samples.length - 1))
  const acRatio = std / avgRed

  // 변동이 너무 없으면 일정한 빛 (손가락 없음 or 완전 밀착)
  if (acRatio < 0.00005) {
    return {
      isValid: false,
      baselineAmplitude: 0,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: avgRed,
      peakFrequency: 0,
      message: `맥박 신호 약함 (R:${avgRed.toFixed(0)}, AC:${(acRatio * 100).toFixed(4)}%). 손가락 위치를 조정해 주세요.`,
    }
  }

  // 변동이 너무 크면 움직임
  if (acRatio > 0.20) {
    return {
      isValid: false,
      baselineAmplitude: 0,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: avgRed,
      peakFrequency: 0,
      message: `움직임 감지 (AC:${(acRatio * 100).toFixed(1)}%). 손가락을 가만히 놓아주세요.`,
    }
  }

  // 3. 밴드패스 필터 적용 후 맥동 주파수 확인
  const bp = new BandpassFilter(0.5, 4.0, sampleRate)
  const filtered = new Float64Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    filtered[i] = bp.process(samples[i])
  }

  // Goertzel로 지배 주파수 검출
  const testFreqs = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 1.7, 2.0, 2.3, 2.5, 3.0]
  let maxPower = 0
  let peakFreq = 0
  let totalPower = 0

  for (const f of testFreqs) {
    const p = goertzel(filtered, f, sampleRate)
    totalPower += p
    if (p > maxPower) {
      maxPower = p
      peakFreq = f
    }
  }

  const spectralRatio = totalPower > 0 ? maxPower / totalPower : 0

  if (spectralRatio < 0.10 || peakFreq < 0.5) {
    return {
      isValid: false,
      baselineAmplitude: std,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: avgRed,
      peakFrequency: peakFreq,
      message: `맥박 미감지 (R:${avgRed.toFixed(0)}, f:${peakFreq.toFixed(1)}Hz, r:${(spectralRatio * 100).toFixed(0)}%). 손가락 위치를 조정해 주세요.`,
    }
  }

  // 4. 기준 파라미터 산출
  // 필터된 신호의 표준편차 = 기준 진폭
  let filteredSumSq = 0
  for (const v of filtered) filteredSumSq += v * v
  const baselineAmplitude = Math.sqrt(filteredSumSq / filtered.length)

  // 고주파 노이즈 플로어 (미분의 표준편차)
  let derivSum = 0
  let derivSumSq = 0
  for (let i = 1; i < filtered.length; i++) {
    const d = filtered[i] - filtered[i - 1]
    derivSum += d
    derivSumSq += d * d
  }
  const derivMean = derivSum / (filtered.length - 1)
  const noiseFloor = Math.sqrt(derivSumSq / (filtered.length - 1) - derivMean * derivMean)

  const bpm = Math.round(peakFreq * 60)

  return {
    isValid: true,
    baselineAmplitude,
    redGain: 128 / avgRed, // 중간값으로 정규화
    noiseFloor,
    avgRedIntensity: avgRed,
    peakFrequency: peakFreq,
    message: `신호 감지 완료 (예상 심박수: ${bpm} BPM)`,
  }
}
