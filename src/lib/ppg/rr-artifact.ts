import type { RRInterval } from './types'

// ============================================================
// RR 인터벌 이소성 박동 감지 및 부정맥 분석
// ============================================================
//
// 핵심 원리:
// VPC(심실 조기수축) 시 RR 인터벌 패턴:
//   ...950, 950, [2000], 950, 950...   ← 보상 휴지기 (피크 검출기가 VPC beat을 놓친 경우)
//   ...950, [600, 1400], 950...         ← 커플링 + 보상 (VPC beat이 검출된 경우)
//
// 두 경우 모두 주변 정상 인터벌 대비 급격한 편차를 보인다.
// "isolated spike" (고립 스파이크) 감지가 가장 효과적.
//

/**
 * 전역 중앙값(Global Median) 계산.
 */
function computeMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/**
 * 1단계: 전역 중앙값 기반 1차 필터.
 *
 * 전체 RR 인터벌의 중앙값을 구한 후,
 * 중앙값에서 ±35% 벗어나는 인터벌을 무효화.
 *
 * 이 단계에서 극단적 아웃라이어를 먼저 제거해야
 * 이후 로컬 분석의 정확도가 높아진다.
 */
function filterByGlobalMedian(
  rrIntervals: RRInterval[],
  threshold: number = 0.35,
): RRInterval[] {
  const validValues = rrIntervals.filter(r => r.isValid).map(r => r.interval)
  if (validValues.length < 3) return rrIntervals

  const median = computeMedian(validValues)

  return rrIntervals.map(rr => {
    if (!rr.isValid) return rr

    const deviation = Math.abs(rr.interval - median) / median
    if (deviation > threshold) {
      return { ...rr, isValid: false }
    }
    return rr
  })
}

/**
 * 2단계: 고립 스파이크 감지 (Isolated Spike Detection).
 *
 * VPC의 핵심 패턴: 하나의 인터벌만 주변보다 크게 튀어나옴.
 *
 * 각 인터벌 i에 대해:
 * - 양쪽 이웃(i-1, i+1)이 모두 유효하고
 * - 양쪽 이웃이 서로 비슷하고 (±20%)
 * - 현재 값이 양쪽 이웃의 평균에서 >25% 벗어나면
 * → 이소성 박동(VPC)으로 판정
 *
 * 이 방법은 중앙값 윈도우 방식보다 훨씬 정확하다:
 * - 단일 스파이크를 정확히 잡아냄
 * - 정상적인 점진적 HR 변화는 보존
 * - VPC 빈도에 영향받지 않음
 */
function detectIsolatedSpikes(
  rrIntervals: RRInterval[],
  spikeThreshold: number = 0.25,
  neighborSimilarity: number = 0.20,
): { result: RRInterval[]; spikeIndices: number[] } {
  const result = rrIntervals.map(rr => ({ ...rr }))
  const spikeIndices: number[] = []

  for (let i = 1; i < result.length - 1; i++) {
    if (!result[i].isValid) continue

    const prev = result[i - 1]
    const next = result[i + 1]

    // 양쪽 이웃이 유효해야 함
    if (!prev.isValid || !next.isValid) continue

    // 양쪽 이웃이 서로 비슷한지 확인
    const neighborRatio = Math.abs(prev.interval - next.interval) / Math.min(prev.interval, next.interval)
    if (neighborRatio > neighborSimilarity) continue

    // 이웃 평균 대비 현재값의 편차
    const neighborAvg = (prev.interval + next.interval) / 2
    const deviation = (result[i].interval - neighborAvg) / neighborAvg

    // 양방향 스파이크 감지 (위쪽: 보상 휴지기, 아래쪽: 커플링 인터벌)
    if (Math.abs(deviation) > spikeThreshold) {
      result[i].isValid = false
      spikeIndices.push(i)
    }
  }

  return { result, spikeIndices }
}

/**
 * 3단계: 연속 이소성 감지.
 *
 * 연속 2개 이상 비정상 인터벌 (VPC 커플링+보상 쌍):
 * ...950, [600, 1400], 950...
 *
 * 연속된 인터벌 중 하나가 짧고 하나가 긴 패턴.
 */
function detectConsecutiveEctopic(
  rrIntervals: RRInterval[],
  ratioThreshold: number = 0.30,
): { result: RRInterval[]; pairIndices: number[] } {
  const result = rrIntervals.map(rr => ({ ...rr }))
  const pairIndices: number[] = []

  for (let i = 1; i < result.length; i++) {
    if (!result[i].isValid || !result[i - 1].isValid) continue

    const ratio = result[i].interval / result[i - 1].interval

    // 급격한 변화: >1.3x 또는 <0.77x (30% 이상 변화)
    if (ratio > (1 + ratioThreshold) || ratio < 1 / (1 + ratioThreshold)) {
      // 앞 인터벌과 뒤 인터벌 모두 확인
      // 이전이 정상이고 현재가 비정상인지, 아니면 둘 다 비정상인지 판단

      // 전전 인터벌이 있으면 기준으로 사용
      if (i >= 2 && result[i - 2].isValid) {
        const baseInterval = result[i - 2].interval
        const prevDev = Math.abs(result[i - 1].interval - baseInterval) / baseInterval
        const currDev = Math.abs(result[i].interval - baseInterval) / baseInterval

        // 이전이 기준에서 크게 벗어나면 → 이전이 ectopic
        if (prevDev > ratioThreshold) {
          result[i - 1].isValid = false
          if (!pairIndices.includes(i - 1)) pairIndices.push(i - 1)
        }
        // 현재가 기준에서 크게 벗어나면 → 현재가 ectopic
        if (currDev > ratioThreshold) {
          result[i].isValid = false
          if (!pairIndices.includes(i)) pairIndices.push(i)
        }
      } else {
        // 기준 없으면 둘 다 의심
        result[i - 1].isValid = false
        result[i].isValid = false
        if (!pairIndices.includes(i - 1)) pairIndices.push(i - 1)
        if (!pairIndices.includes(i)) pairIndices.push(i)
      }
    }
  }

  return { result, pairIndices }
}

/**
 * 4단계: NN 경계 인터벌 제외.
 *
 * ESC/NASPE 가이드라인: HRV는 NN(Normal-to-Normal) 인터벌만 사용.
 * 이소성 비트 직전/직후 인터벌은 "정상→이소성" 또는 "이소성→정상"
 * 경계이므로 NN이 아님 → 제외.
 */
function excludeNNBoundaries(
  rrIntervals: RRInterval[],
  ectopicIndices: number[],
): RRInterval[] {
  const result = rrIntervals.map(rr => ({ ...rr }))
  const exclusionSet = new Set(ectopicIndices)

  for (const idx of ectopicIndices) {
    // 직전 인터벌 (아직 유효하면)
    if (idx > 0 && result[idx - 1].isValid && !exclusionSet.has(idx - 1)) {
      result[idx - 1].isValid = false
      exclusionSet.add(idx - 1)
    }
    // 직후 인터벌
    if (idx < result.length - 1 && result[idx + 1].isValid && !exclusionSet.has(idx + 1)) {
      result[idx + 1].isValid = false
      exclusionSet.add(idx + 1)
    }
  }

  return result
}

/**
 * 5단계: 최종 검증 — 정제 후 중앙값 재확인.
 *
 * 모든 필터를 거친 후에도 유효한 인터벌 중
 * 새 중앙값에서 >25% 벗어나는 것이 있으면 추가 제거.
 */
function finalMedianValidation(
  rrIntervals: RRInterval[],
  threshold: number = 0.25,
): RRInterval[] {
  const validValues = rrIntervals.filter(r => r.isValid).map(r => r.interval)
  if (validValues.length < 3) return rrIntervals

  const median = computeMedian(validValues)

  return rrIntervals.map(rr => {
    if (!rr.isValid) return rr

    const deviation = Math.abs(rr.interval - median) / median
    if (deviation > threshold) {
      return { ...rr, isValid: false }
    }
    return rr
  })
}

// ============================================================
// 부정맥 분석
// ============================================================

export interface ArrhythmiaAnalysis {
  ectopicRatio: number
  ectopicCount: number
  totalCount: number
  validNNCount: number
  burden: 'normal' | 'borderline' | 'excessive'
  hrvMeasurable: boolean
  message: string
}

function analyzeArrhythmia(
  totalIntervals: number,
  ectopicIndices: number[],
  validNNCount: number,
): ArrhythmiaAnalysis {
  const ectopicCount = ectopicIndices.length
  const ectopicRatio = totalIntervals > 0 ? ectopicCount / totalIntervals : 0

  if (ectopicRatio >= 0.20) {
    return {
      ectopicRatio,
      ectopicCount,
      totalCount: totalIntervals,
      validNNCount,
      burden: 'excessive',
      hrvMeasurable: false,
      message: '비정상 리듬(부정맥 의심)이 다수 감지되어 HRV를 정확하게 측정하기 어렵습니다. 부정맥이 의심되는 경우 전문의 상담을 권장합니다.',
    }
  }

  if (ectopicRatio >= 0.05) {
    return {
      ectopicRatio,
      ectopicCount,
      totalCount: totalIntervals,
      validNNCount,
      burden: 'borderline',
      hrvMeasurable: validNNCount >= 20,
      message: `비정상 박동이 일부 감지되었습니다 (${Math.round(ectopicRatio * 100)}%). 정상 리듬 구간만으로 HRV를 분석하였습니다.`,
    }
  }

  return {
    ectopicRatio,
    ectopicCount,
    totalCount: totalIntervals,
    validNNCount,
    burden: 'normal',
    hrvMeasurable: validNNCount >= 10,
    message: '',
  }
}

// ============================================================
// 전체 파이프라인
// ============================================================

/**
 * 전체 RR 아티팩트 제거 + 부정맥 분석 파이프라인.
 *
 * 순서:
 * 1. 전역 중앙값 기반 극단값 제거 (±35%)
 * 2. 고립 스파이크 감지 (양쪽 이웃 대비 ±25%)
 * 3. 연속 이소성 감지 (급격 비율 변화 >30%)
 * 4. NN 경계 인터벌 제외
 * 5. 최종 중앙값 재검증 (±25%)
 * 6. 부정맥 부담도 분석
 */
export function cleanRRIntervalsWithArrhythmia(
  rrIntervals: RRInterval[],
): { cleaned: RRInterval[]; arrhythmia: ArrhythmiaAnalysis } {
  const totalCount = rrIntervals.length

  if (totalCount < 5) {
    return {
      cleaned: rrIntervals,
      arrhythmia: {
        ectopicRatio: 0,
        ectopicCount: 0,
        totalCount,
        validNNCount: rrIntervals.filter(r => r.isValid).length,
        burden: 'normal',
        hrvMeasurable: false,
        message: '',
      },
    }
  }

  // 1. 전역 중앙값 기반 극단값 제거
  let cleaned = filterByGlobalMedian(rrIntervals, 0.35)

  // 2. 고립 스파이크 감지
  const { result: spikeResult, spikeIndices } = detectIsolatedSpikes(cleaned, 0.25, 0.20)
  cleaned = spikeResult

  // 3. 연속 이소성 감지
  const { result: pairResult, pairIndices } = detectConsecutiveEctopic(cleaned, 0.30)
  cleaned = pairResult

  // 전체 이소성 인덱스 취합
  const allEctopicIndices = [...new Set([...spikeIndices, ...pairIndices])]

  // 4. NN 경계 인터벌 제외
  cleaned = excludeNNBoundaries(cleaned, allEctopicIndices)

  // 5. 최종 중앙값 재검증
  cleaned = finalMedianValidation(cleaned, 0.25)

  // 6. 부정맥 분석
  // 전체 이소성 수 = 원래 무효화된 수 (경계 제외 포함)
  const finalValid = cleaned.filter(r => r.isValid).length
  const totalInvalidated = totalCount - finalValid
  const arrhythmia = analyzeArrhythmia(totalCount, allEctopicIndices, finalValid)

  return { cleaned, arrhythmia }
}

/** 하위 호환용 래퍼 */
export function cleanRRIntervals(rrIntervals: RRInterval[]): RRInterval[] {
  const { cleaned } = cleanRRIntervalsWithArrhythmia(rrIntervals)
  return cleaned
}

/**
 * 유효 인터벌 통계 요약.
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

  const medianRR = computeMedian(valid.map(r => r.interval))
  const medianHR = Math.round(60000 / medianRR)

  return {
    validCount,
    totalCount,
    rejectionRate: totalCount > 0 ? (totalCount - validCount) / totalCount : 0,
    medianRR,
    medianHR,
  }
}
