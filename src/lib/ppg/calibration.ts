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
  if (avgRed > 220) {
    return {
      isValid: false,
      baselineAmplitude: 0,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: avgRed,
      peakFrequency: 0,
      message: '카메라가 과포화되었습니다. 손가락 압력을 조금 줄여주세요.',
    }
  }

  if (avgRed < 30) {
    return {
      isValid: false,
      baselineAmplitude: 0,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: avgRed,
      peakFrequency: 0,
      message: '신호가 감지되지 않습니다. 후면 카메라 위에 손가락을 올려주세요.',
    }
  }

  // 2. AC 비율 (변동성) 확인
  let sumSq = 0
  for (const s of samples) {
    const diff = s - avgRed
    sumSq += diff * diff
  }
  const std = Math.sqrt(sumSq / (samples.length - 1))
  const acRatio = std / avgRed

  if (acRatio < 0.0005) {
    return {
      isValid: false,
      baselineAmplitude: 0,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: avgRed,
      peakFrequency: 0,
      message: '맥박 신호가 약합니다. 손가락이 카메라를 완전히 덮도록 해주세요.',
    }
  }

  if (acRatio > 0.08) {
    return {
      isValid: false,
      baselineAmplitude: 0,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: avgRed,
      peakFrequency: 0,
      message: '움직임이 감지됩니다. 손가락을 움직이지 말고 가만히 놓아주세요.',
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

  if (spectralRatio < 0.15 || peakFreq < 0.5) {
    return {
      isValid: false,
      baselineAmplitude: std,
      redGain: 1,
      noiseFloor: 0,
      avgRedIntensity: avgRed,
      peakFrequency: peakFreq,
      message: '명확한 맥박이 감지되지 않습니다. 손가락 위치를 조정해 주세요.',
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
