// ============================================================
// 설문 채점 로직
// ============================================================

import type {
  Questionnaire,
  SeverityLevel,
  AssessmentSeverity,
  Compass31Result,
  Compass31DomainScore,
} from '@/types'

// ============================================================
// 공통 유틸
// ============================================================

export function getSeverityLevel(
  score: number,
  severityLevels: Questionnaire['severity_levels']
): SeverityLevel | AssessmentSeverity {
  const level = severityLevels.find(
    (sl) => score >= sl.min && score <= sl.max
  )
  return level?.level ?? 'normal'
}

// ============================================================
// PHQ-9 / GAD-7 채점 (단순 합산)
// ============================================================

export function calcSumScore(
  responses: Record<string, number>,
  questionnaire: Questionnaire
): {
  total_score: number
  severity_level: SeverityLevel
  crisis_flag: boolean
} {
  const reverseItems = new Set(questionnaire.scoring.reverse_items ?? [])
  const maxPerItem = 3

  let total = 0
  for (const item of questionnaire.items) {
    const rawValue = responses[item.id] ?? 0
    const value = reverseItems.has(item.id)
      ? maxPerItem - rawValue
      : rawValue
    total += value
  }

  const level = getSeverityLevel(
    total,
    questionnaire.severity_levels
  ) as SeverityLevel

  const crisisFlag =
    questionnaire.safety_protocol != null &&
    total >= questionnaire.safety_protocol.trigger_score

  return {
    total_score: total,
    severity_level: level,
    crisis_flag: crisisFlag,
  }
}

// ============================================================
// ASRS 채점 (스크리닝 방식 — 1~6번 문항 컷오프 기준)
// ============================================================

export function calcAsrsScore(
  responses: Record<string, number>,
  questionnaire: Questionnaire
): {
  total_score: number
  severity_level: SeverityLevel
  crisis_flag: boolean
  is_positive: boolean
  positive_count: number
} {
  // 전체 합산 점수
  let total = 0
  for (const item of questionnaire.items) {
    total += responses[item.id] ?? 0
  }

  // 스크리닝 양성 판정 (1~6번 항목별 컷오프)
  const cutoffs = questionnaire.scoring.screening_cutoffs
  const screeningItems = questionnaire.scoring.screening_items ?? []
  const threshold = questionnaire.scoring.screening_threshold ?? 4

  let positiveCount = 0
  if (cutoffs) {
    for (const itemId of screeningItems) {
      const value = responses[itemId] ?? 0
      const cutoff = cutoffs[itemId] ?? 2
      if (value >= cutoff) positiveCount++
    }
  }

  const isPositive = positiveCount >= threshold
  const level: SeverityLevel = isPositive ? 'moderate' : 'normal'

  return {
    total_score: total,
    severity_level: level,
    crisis_flag: false,
    is_positive: isPositive,
    positive_count: positiveCount,
  }
}

// ============================================================
// COMPASS-31 채점 (도메인별 가중치)
// ============================================================

export function calcCompass31Score(
  responses: Record<string, number>,
  questionnaire: Questionnaire
): Compass31Result {
  const domains = questionnaire.scoring.domains ?? []
  const domainDetails: Compass31DomainScore[] = []
  let totalWeightedScore = 0

  for (const domain of domains) {
    // 도메인 원점수 합산
    let rawScore = 0
    for (const itemId of domain.items) {
      rawScore += responses[itemId] ?? 0
    }

    // 도메인 내 비율 (0~1)
    const ratio = domain.max_raw_score > 0 ? rawScore / domain.max_raw_score : 0

    // 가중치 적용 점수
    const weightedScore = ratio * domain.weight

    domainDetails.push({
      id: domain.id,
      name: domain.name,
      raw_score: rawScore,
      weighted_score: Math.round(weightedScore * 100) / 100,
      max_weighted_score: domain.weight,
    })

    totalWeightedScore += weightedScore
  }

  const totalScore = Math.round(totalWeightedScore * 100) / 100

  const severityLevel = getSeverityLevel(
    totalScore,
    questionnaire.severity_levels
  ) as AssessmentSeverity

  const severityLabel =
    questionnaire.severity_levels.find((sl) => sl.level === severityLevel)?.label ?? '알 수 없음'

  const domainScoresMap: Record<string, number> = {}
  for (const detail of domainDetails) {
    domainScoresMap[detail.id] = detail.weighted_score
  }

  return {
    total_score: totalScore,
    domain_scores: domainScoresMap,
    domain_details: domainDetails,
    severity_level: severityLevel,
    severity_label: severityLabel,
  }
}
