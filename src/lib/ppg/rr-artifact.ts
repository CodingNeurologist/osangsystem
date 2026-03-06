import type { RRInterval } from './types'

// ============================================================
// RR 인터벌 아티팩트 제거 및 보정
// ============================================================

/**
 * 중앙값 기반 이소성 박동(ectopic beat) 필터.
 *
 * 각 RR 인터벌을 주변 인터벌의 중앙값과 비교하여
 * 비정상적으로 크거나 작은 간격을 무효화한다.
 *
 * 알고리즘 (Karlsson et al. 2012 변형):
 * 1. 슬라이딩 윈도우 중앙값 계산 (window=5)
 * 2. |RR_i - median| / median > threshold 이면 이소성
 * 3. 이소성 인터벌을 중앙값으로 대체 (보간)
 *
 * threshold = 0.20 (20%) — 학술 표준은 0.20~0.25
 */
export function filterEctopicBeats(
  rrIntervals: RRInterval[],
  threshold: number = 0.20,
  windowSize: number = 5,
): RRInterval[] {
  if (rrIntervals.length < windowSize) return rrIntervals

  const result: RRInterval[] = []
  const halfW = Math.floor(windowSize / 2)

  for (let i = 0; i < rrIntervals.length; i++) {
    const rr = rrIntervals[i]

    // 윈도우 범위
    const start = Math.max(0, i - halfW)
    const end = Math.min(rrIntervals.length - 1, i + halfW)

    // 윈도우 내 유효 인터벌 수집
    const windowValues: number[] = []
    for (let j = start; j <= end; j++) {
      if (rrIntervals[j].isValid) {
        windowValues.push(rrIntervals[j].interval)
      }
    }

    if (windowValues.length < 3) {
      result.push(rr)
      continue
    }

    // 중앙값
    windowValues.sort((a, b) => a - b)
    const median = windowValues[Math.floor(windowValues.length / 2)]

    // 이소성 판정
    const deviation = Math.abs(rr.interval - median) / median

    if (deviation > threshold) {
      // 이소성 박동 → 무효화
      result.push({ ...rr, isValid: false })
    } else {
      result.push(rr)
    }
  }

  return result
}

/**
 * 연속 이소성 감지: 연속 2개 이상의 비정상 인터벌 → 모두 무효화.
 * 이는 움직임 아티팩트로 인한 연쇄 오류를 방지한다.
 */
export function filterConsecutiveArtifacts(
  rrIntervals: RRInterval[],
  maxConsecutiveInvalid: number = 3,
): RRInterval[] {
  const result = [...rrIntervals]
  let consecutiveInvalid = 0
  let invalidStart = -1

  for (let i = 0; i < result.length; i++) {
    if (!result[i].isValid) {
      if (consecutiveInvalid === 0) invalidStart = i
      consecutiveInvalid++
    } else {
      // 연속 무효가 끝남
      if (consecutiveInvalid >= maxConsecutiveInvalid && invalidStart >= 0) {
        // 앞뒤 각 1개도 무효화 (경계 효과)
        const extStart = Math.max(0, invalidStart - 1)
        const extEnd = Math.min(result.length - 1, i)
        for (let j = extStart; j <= extEnd; j++) {
          result[j] = { ...result[j], isValid: false }
        }
      }
      consecutiveInvalid = 0
      invalidStart = -1
    }
  }

  return result
}

/**
 * 생리학적 범위 필터: 극단적 RR 값 제거.
 * - HR < 40 BPM (RR > 1500ms) 또는 HR > 180 BPM (RR < 333ms) → 무효
 * - 연속 인터벌 비율 > 1.5 또는 < 0.67 → 무효 (급격한 변화)
 */
export function filterPhysiologicalRange(
  rrIntervals: RRInterval[],
): RRInterval[] {
  const result: RRInterval[] = []

  for (let i = 0; i < rrIntervals.length; i++) {
    const rr = rrIntervals[i]

    if (!rr.isValid) {
      result.push(rr)
      continue
    }

    // 절대 범위 (40–180 BPM)
    if (rr.interval < 333 || rr.interval > 1500) {
      result.push({ ...rr, isValid: false })
      continue
    }

    // 연속 비율 체크
    if (i > 0 && result[i - 1].isValid) {
      const ratio = rr.interval / result[i - 1].interval
      if (ratio > 1.5 || ratio < 0.67) {
        result.push({ ...rr, isValid: false })
        continue
      }
    }

    result.push(rr)
  }

  return result
}

/**
 * 전체 RR 아티팩트 제거 파이프라인.
 *
 * 순서:
 * 1. 생리학적 범위 필터
 * 2. 이소성 박동 필터 (중앙값 기반)
 * 3. 연속 아티팩트 필터
 *
 * @returns 정제된 RR 인터벌 배열
 */
export function cleanRRIntervals(rrIntervals: RRInterval[]): RRInterval[] {
  if (rrIntervals.length < 5) return rrIntervals

  let cleaned = filterPhysiologicalRange(rrIntervals)
  cleaned = filterEctopicBeats(cleaned, 0.20, 5)
  cleaned = filterConsecutiveArtifacts(cleaned, 3)

  return cleaned
}

/**
 * 유효 인터벌만 추출 + 통계 요약.
 */
export function getRRStats(rrIntervals: RRInterval[]): {
  validCount: number
  totalCount: number
  rejectionRate: number
  medianRR: number
  medianHR: number
} {
  const valid = rrIntervals.filter(r => r.isValid)
  const totalCount = rrIntervals.length
  const validCount = valid.length

  if (validCount === 0) {
    return { validCount: 0, totalCount, rejectionRate: 1, medianRR: 0, medianHR: 0 }
  }

  const sorted = valid.map(r => r.interval).sort((a, b) => a - b)
  const medianRR = sorted[Math.floor(sorted.length / 2)]
  const medianHR = Math.round(60000 / medianRR)

  return {
    validCount,
    totalCount,
    rejectionRate: totalCount > 0 ? (totalCount - validCount) / totalCount : 0,
    medianRR,
    medianHR,
  }
}
