import type { RRInterval } from './types'

// ============================================================
// RR 인터벌 아티팩트 제거 + 이소성 박동 감지
// ============================================================

/**
 * 중앙값 계산.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * MAD (Median Absolute Deviation) — 아웃라이어에 강건한 산포도.
 * σ ≈ 1.4826 × MAD (정규분포 가정 시)
 */
function mad(values: number[]): number {
  const med = median(values)
  const deviations = values.map(v => Math.abs(v - med))
  return median(deviations)
}

// ============================================================
// 1단계: MAD 기반 강건 필터 (반복 적용)
// ============================================================

/**
 * 중앙값 ± k × MAD 범위 밖의 인터벌을 무효화.
 * MAD는 아웃라이어가 50% 미만이면 오염되지 않으므로
 * VPC가 많아도 안전하다.
 *
 * k=3.0 → 정규분포 기준 약 99.7% 범위 (보수적)
 * 반복 적용하면 점점 정밀해짐.
 */
function filterByMAD(
  rrIntervals: RRInterval[],
  k: number,
): { result: RRInterval[]; removedIndices: number[] } {
  const result = rrIntervals.map(rr => ({ ...rr }))
  const removedIndices: number[] = []

  const validValues = result.filter(r => r.isValid).map(r => r.interval)
  if (validValues.length < 5) return { result, removedIndices }

  const med = median(validValues)
  const madVal = mad(validValues)

  // MAD가 매우 작으면 (거의 같은 값) 비율 기반 폴백
  const threshold = madVal > 0
    ? Math.max(k * 1.4826 * madVal, med * 0.15)  // 최소 15% 허용
    : med * 0.25

  const lower = med - threshold
  const upper = med + threshold

  for (let i = 0; i < result.length; i++) {
    if (!result[i].isValid) continue
    if (result[i].interval < lower || result[i].interval > upper) {
      result[i].isValid = false
      removedIndices.push(i)
    }
  }

  return { result, removedIndices }
}

// ============================================================
// 2단계: 고립 스파이크 감지
// ============================================================

/**
 * 양쪽 이웃이 비슷한데 현재값만 튀는 패턴.
 * 이웃이 무효여도 유효한 가장 가까운 이웃을 찾아 비교.
 */
function detectIsolatedSpikes(
  rrIntervals: RRInterval[],
  spikeThreshold: number,
): { result: RRInterval[]; spikeIndices: number[] } {
  const result = rrIntervals.map(rr => ({ ...rr }))
  const spikeIndices: number[] = []

  for (let i = 0; i < result.length; i++) {
    if (!result[i].isValid) continue

    // 왼쪽에서 가장 가까운 유효 이웃 찾기
    let prevIdx = -1
    for (let j = i - 1; j >= 0; j--) {
      if (result[j].isValid) { prevIdx = j; break }
    }

    // 오른쪽에서 가장 가까운 유효 이웃 찾기
    let nextIdx = -1
    for (let j = i + 1; j < result.length; j++) {
      if (result[j].isValid) { nextIdx = j; break }
    }

    // 양쪽 이웃이 없으면 스킵
    if (prevIdx === -1 || nextIdx === -1) continue

    const prev = result[prevIdx].interval
    const next = result[nextIdx].interval
    const curr = result[i].interval

    // 양쪽 이웃이 서로 비슷한지 (±25%)
    const neighborDiff = Math.abs(prev - next) / Math.min(prev, next)
    if (neighborDiff > 0.25) continue

    // 이웃 평균 대비 현재값 편차
    const neighborAvg = (prev + next) / 2
    const deviation = Math.abs(curr - neighborAvg) / neighborAvg

    if (deviation > spikeThreshold) {
      result[i].isValid = false
      spikeIndices.push(i)
    }
  }

  return { result, spikeIndices }
}

// ============================================================
// 3단계: 연속 급변 감지
// ============================================================

/**
 * 인접한 두 인터벌의 비율이 급격하게 변하는 경우.
 * 전역 중앙값을 기준으로 어느 쪽이 이탈인지 판별.
 */
function detectConsecutiveEctopic(
  rrIntervals: RRInterval[],
  ratioThreshold: number,
  globalMedian: number,
): { result: RRInterval[]; pairIndices: number[] } {
  const result = rrIntervals.map(rr => ({ ...rr }))
  const pairIndices: number[] = []

  for (let i = 1; i < result.length; i++) {
    if (!result[i].isValid || !result[i - 1].isValid) continue

    const ratio = result[i].interval / result[i - 1].interval

    if (ratio > (1 + ratioThreshold) || ratio < 1 / (1 + ratioThreshold)) {
      // 전역 중앙값과 비교해서 어느 쪽이 이탈인지 판별
      const prevDev = Math.abs(result[i - 1].interval - globalMedian) / globalMedian
      const currDev = Math.abs(result[i].interval - globalMedian) / globalMedian

      if (prevDev > ratioThreshold * 0.8) {
        result[i - 1].isValid = false
        if (!pairIndices.includes(i - 1)) pairIndices.push(i - 1)
      }
      if (currDev > ratioThreshold * 0.8) {
        result[i].isValid = false
        if (!pairIndices.includes(i)) pairIndices.push(i)
      }
    }
  }

  return { result, pairIndices }
}

// ============================================================
// 4단계: NN 경계 인터벌 제외
// ============================================================

/**
 * 이소성 비트 직전/직후 인터벌은 NN이 아니므로 제외.
 */
function excludeNNBoundaries(
  rrIntervals: RRInterval[],
  ectopicIndices: Set<number>,
): RRInterval[] {
  const result = rrIntervals.map(rr => ({ ...rr }))

  for (const idx of ectopicIndices) {
    if (idx > 0 && result[idx - 1].isValid && !ectopicIndices.has(idx - 1)) {
      result[idx - 1].isValid = false
    }
    if (idx < result.length - 1 && result[idx + 1].isValid && !ectopicIndices.has(idx + 1)) {
      result[idx + 1].isValid = false
    }
  }

  return result
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
  ectopicCount: number,
  validNNCount: number,
): ArrhythmiaAnalysis {
  const ectopicRatio = totalIntervals > 0 ? ectopicCount / totalIntervals : 0

  if (ectopicRatio >= 0.20) {
    return {
      ectopicRatio,
      ectopicCount,
      totalCount: totalIntervals,
      validNNCount,
      burden: 'excessive',
      hrvMeasurable: false,
      message: '비정상 리듬이 다수 감지되어 HRV를 정확하게 측정하기 어렵습니다. 반복적으로 나타나면 전문의 상담을 권장합니다.',
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
      message: `비정상 박동이 일부 감지되었습니다 (${ectopicCount}회, ${Math.round(ectopicRatio * 100)}%). 정상 리듬 구간만으로 HRV를 분석하였습니다.`,
    }
  }

  return {
    ectopicRatio,
    ectopicCount,
    totalCount: totalIntervals,
    validNNCount,
    burden: 'normal',
    hrvMeasurable: validNNCount >= 10,
    message: ectopicCount > 0
      ? `이소성 박동 ${ectopicCount}회 감지, 정상 범위입니다.`
      : '',
  }
}

// ============================================================
// 전체 파이프라인
// ============================================================

/**
 * RR 아티팩트 제거 + 부정맥 분석 파이프라인.
 *
 * 1. MAD 기반 강건 필터 (k=3.0) — 극단 아웃라이어 제거
 * 2. MAD 재적용 (k=2.5) — 1차 제거 후 정밀 필터
 * 3. 고립 스파이크 감지 (이웃 대비 20%)
 * 4. 연속 급변 감지 (비율 >25%)
 * 5. NN 경계 인터벌 제외
 * 6. 최종 MAD 검증 (k=2.0)
 * 7. 부정맥 부담도 분석
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

  // 모든 단계에서 제거된 인덱스를 추적
  const allRemovedIndices = new Set<number>()

  // 1. MAD 기반 1차 필터 (k=3.0, 보수적)
  let { result: cleaned, removedIndices: removed1 } = filterByMAD(rrIntervals, 3.0)
  removed1.forEach(i => allRemovedIndices.add(i))

  // 2. MAD 2차 필터 (k=2.5, 정밀)
  const { result: cleaned2, removedIndices: removed2 } = filterByMAD(cleaned, 2.5)
  cleaned = cleaned2
  removed2.forEach(i => allRemovedIndices.add(i))

  // 3. 고립 스파이크 감지 (20% 편차)
  const { result: spikeResult, spikeIndices } = detectIsolatedSpikes(cleaned, 0.20)
  cleaned = spikeResult
  spikeIndices.forEach(i => allRemovedIndices.add(i))

  // 전역 중앙값 계산 (현재 유효한 인터벌 기준)
  const validForMedian = cleaned.filter(r => r.isValid).map(r => r.interval)
  const globalMed = median(validForMedian)

  // 4. 연속 급변 감지 (25% 비율 변화)
  const { result: pairResult, pairIndices } = detectConsecutiveEctopic(cleaned, 0.25, globalMed)
  cleaned = pairResult
  pairIndices.forEach(i => allRemovedIndices.add(i))

  // 5. NN 경계 인터벌 제외
  cleaned = excludeNNBoundaries(cleaned, allRemovedIndices)

  // 6. 최종 MAD 검증 (k=2.0, 엄격)
  const { result: finalResult, removedIndices: removedFinal } = filterByMAD(cleaned, 2.0)
  cleaned = finalResult
  removedFinal.forEach(i => allRemovedIndices.add(i))

  // 7. 부정맥 분석
  const finalValid = cleaned.filter(r => r.isValid).length
  const ectopicCount = allRemovedIndices.size
  const arrhythmia = analyzeArrhythmia(totalCount, ectopicCount, finalValid)

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

  const medianRR = median(valid.map(r => r.interval))
  const medianHR = Math.round(60000 / medianRR)

  return {
    validCount,
    totalCount,
    rejectionRate: totalCount > 0 ? (totalCount - validCount) / totalCount : 0,
    medianRR,
    medianHR,
  }
}
