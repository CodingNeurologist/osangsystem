import type { RRInterval } from './types'

// ============================================================
// RR 인터벌 아티팩트 제거 및 부정맥 분석
// ============================================================

/**
 * VPC(심실 조기수축) / 이소성 박동 감지.
 *
 * VPC 패턴:
 * - 짧은 커플링 인터벌 (정상의 ~60-80%) → VPC beat
 * - 뒤따르는 보상 휴지기 (정상의 ~120-160%)
 * - 즉, "짧음-긺" 패턴이 연속으로 나타남
 *
 * 감지 시 VPC beat 자체 + 앞뒤 인터벌(커플링 + 보상)을 모두 무효화.
 * HRV는 정상 동성 리듬(sinus rhythm)의 NN 인터벌만으로 계산해야 정확하다.
 *
 * 참고: Task Force of ESC/NASPE (1996) HRV 가이드라인
 *       "NN intervals" = Normal-to-Normal (이소성 제외)
 */
export function detectAndExcludeEctopicBeats(
  rrIntervals: RRInterval[],
  threshold: number = 0.20,
  windowSize: number = 7,
): { cleaned: RRInterval[]; ectopicIndices: number[] } {
  if (rrIntervals.length < windowSize) {
    return { cleaned: rrIntervals, ectopicIndices: [] }
  }

  const result = rrIntervals.map(rr => ({ ...rr }))
  const ectopicIndices: number[] = []
  const halfW = Math.floor(windowSize / 2)

  // 1단계: 중앙값 기반 이소성 감지
  for (let i = 0; i < result.length; i++) {
    if (!result[i].isValid) continue

    const start = Math.max(0, i - halfW)
    const end = Math.min(result.length - 1, i + halfW)

    const windowValues: number[] = []
    for (let j = start; j <= end; j++) {
      if (rrIntervals[j].isValid) {
        windowValues.push(rrIntervals[j].interval)
      }
    }
    if (windowValues.length < 3) continue

    windowValues.sort((a, b) => a - b)
    const median = windowValues[Math.floor(windowValues.length / 2)]
    const deviation = Math.abs(result[i].interval - median) / median

    if (deviation > threshold) {
      ectopicIndices.push(i)
      result[i].isValid = false
    }
  }

  // 2단계: VPC 패턴 감지 (짧음-긺 쌍)
  // 이미 감지된 이소성 주변의 "커플링-보상" 패턴도 찾아냄
  for (let i = 1; i < result.length - 1; i++) {
    if (!rrIntervals[i].isValid) continue

    const prev = rrIntervals[i - 1]
    const curr = rrIntervals[i]
    const next = rrIntervals[i + 1]

    if (!prev.isValid || !next.isValid) continue

    // 현재가 짧고 다음이 긴 패턴 (VPC + 보상 휴지기)
    const prevCurrRatio = curr.interval / prev.interval
    const currNextRatio = next.interval / curr.interval

    if (prevCurrRatio < 0.75 && currNextRatio > 1.3) {
      // VPC 패턴: 커플링 인터벌(짧음) + 보상 인터벌(긺) 모두 제외
      if (!ectopicIndices.includes(i)) ectopicIndices.push(i)
      if (!ectopicIndices.includes(i + 1)) ectopicIndices.push(i + 1)
      result[i].isValid = false
      result[i + 1].isValid = false
    }

    // 반대 패턴: 이전이 짧고 현재가 긴 (이미 처리된 것의 보상)
    if (prevCurrRatio > 1.3 && i >= 2) {
      const prevPrev = rrIntervals[i - 2]
      if (prevPrev.isValid) {
        const ppRatio = prev.interval / prevPrev.interval
        if (ppRatio < 0.75) {
          if (!ectopicIndices.includes(i)) ectopicIndices.push(i)
          result[i].isValid = false
        }
      }
    }
  }

  // 3단계: 이소성 비트 주변 경계 인터벌 무효화
  // 이소성 비트 직전/직후 인터벌은 정상-이소성 경계이므로
  // NN(Normal-to-Normal)이 아님 → 제외
  const neighborExclusion = new Set<number>()
  for (const idx of ectopicIndices) {
    // 앞쪽 인터벌 (정상→이소성 전환)
    if (idx > 0 && result[idx - 1].isValid) {
      neighborExclusion.add(idx - 1)
    }
    // 뒤쪽 인터벌 (이소성→정상 전환)
    if (idx < result.length - 1 && result[idx + 1].isValid) {
      neighborExclusion.add(idx + 1)
    }
  }

  for (const idx of neighborExclusion) {
    if (!ectopicIndices.includes(idx)) {
      ectopicIndices.push(idx)
    }
    result[idx].isValid = false
  }

  ectopicIndices.sort((a, b) => a - b)

  return { cleaned: result, ectopicIndices }
}

/**
 * 연속 아티팩트 필터: 연속 3개 이상 무효 시 앞뒤도 무효화.
 */
export function filterConsecutiveArtifacts(
  rrIntervals: RRInterval[],
  maxConsecutiveInvalid: number = 3,
): RRInterval[] {
  const result = rrIntervals.map(rr => ({ ...rr }))
  let consecutiveInvalid = 0
  let invalidStart = -1

  for (let i = 0; i < result.length; i++) {
    if (!result[i].isValid) {
      if (consecutiveInvalid === 0) invalidStart = i
      consecutiveInvalid++
    } else {
      if (consecutiveInvalid >= maxConsecutiveInvalid && invalidStart >= 0) {
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

  // 끝부분 처리
  if (consecutiveInvalid >= maxConsecutiveInvalid && invalidStart >= 0) {
    const extStart = Math.max(0, invalidStart - 1)
    for (let j = extStart; j < result.length; j++) {
      result[j] = { ...result[j], isValid: false }
    }
  }

  return result
}

/**
 * 생리학적 범위 필터.
 * - HR < 40 BPM (RR > 1500ms) 또는 HR > 180 BPM (RR < 333ms) → 무효
 * - 연속 인터벌 비율 > 1.5 또는 < 0.67 → 무효
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

    if (rr.interval < 333 || rr.interval > 1500) {
      result.push({ ...rr, isValid: false })
      continue
    }

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
 * 부정맥 부담도(Arrhythmia Burden) 분석.
 *
 * 이소성 비트 비율에 따라 HRV 측정 가능 여부를 판단한다.
 *
 * 기준 (ESC/NASPE 가이드라인 기반):
 * - ectopicRatio < 5%: 정상 — HRV 정상 측정 가능
 * - 5% ≤ ectopicRatio < 20%: 경계 — 정상 리듬만으로 HRV 측정 (주의 표시)
 * - ectopicRatio ≥ 20%: 측정 불가 — 비정상 리듬이 너무 많아 HRV 신뢰 불가
 */
export interface ArrhythmiaAnalysis {
  /** 전체 인터벌 대비 이소성 비율 (0-1) */
  ectopicRatio: number
  /** 이소성으로 감지된 인터벌 수 */
  ectopicCount: number
  /** 전체 인터벌 수 */
  totalCount: number
  /** 이소성 제외 후 남은 유효 NN 인터벌 수 */
  validNNCount: number
  /** 부정맥 부담 수준 */
  burden: 'normal' | 'borderline' | 'excessive'
  /** HRV 측정 가능 여부 */
  hrvMeasurable: boolean
  /** 사용자 메시지 */
  message: string
}

export function analyzeArrhythmia(
  rrIntervals: RRInterval[],
  ectopicIndices: number[],
): ArrhythmiaAnalysis {
  const totalCount = rrIntervals.length
  const ectopicCount = ectopicIndices.length
  const ectopicRatio = totalCount > 0 ? ectopicCount / totalCount : 0
  const validNNCount = rrIntervals.filter(r => r.isValid).length

  if (ectopicRatio >= 0.20) {
    return {
      ectopicRatio,
      ectopicCount,
      totalCount,
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
      totalCount,
      validNNCount,
      burden: 'borderline',
      hrvMeasurable: validNNCount >= 20,
      message: `비정상 박동이 일부 감지되었습니다 (${Math.round(ectopicRatio * 100)}%). 정상 리듬 구간만으로 HRV를 분석하였습니다.`,
    }
  }

  return {
    ectopicRatio,
    ectopicCount,
    totalCount,
    validNNCount,
    burden: 'normal',
    hrvMeasurable: validNNCount >= 10,
    message: '',
  }
}

/**
 * 전체 RR 아티팩트 제거 + 부정맥 분석 파이프라인.
 *
 * 순서:
 * 1. 생리학적 범위 필터
 * 2. VPC/이소성 감지 + 주변 인터벌 제외
 * 3. 연속 아티팩트 필터
 * 4. 부정맥 부담도 분석
 */
export function cleanRRIntervalsWithArrhythmia(
  rrIntervals: RRInterval[],
): { cleaned: RRInterval[]; arrhythmia: ArrhythmiaAnalysis } {
  if (rrIntervals.length < 5) {
    return {
      cleaned: rrIntervals,
      arrhythmia: {
        ectopicRatio: 0,
        ectopicCount: 0,
        totalCount: rrIntervals.length,
        validNNCount: rrIntervals.filter(r => r.isValid).length,
        burden: 'normal',
        hrvMeasurable: false,
        message: '',
      },
    }
  }

  // 1. 생리학적 범위
  const rangeFiltered = filterPhysiologicalRange(rrIntervals)

  // 2. VPC/이소성 감지 + 주변 제외
  const { cleaned: ectopicFiltered, ectopicIndices } = detectAndExcludeEctopicBeats(rangeFiltered, 0.20, 7)

  // 3. 연속 아티팩트
  const cleaned = filterConsecutiveArtifacts(ectopicFiltered, 3)

  // 4. 부정맥 분석
  const arrhythmia = analyzeArrhythmia(cleaned, ectopicIndices)

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
