// ============================================================
// COMPASS-31 채점 유틸리티 (spec 기반)
// ============================================================

import type {
  Survey,
  SurveyQuestion,
  SurveyAnswers,
  ScoringRule,
  StressCheckCategory,
  StressCheckCategoryScore,
  StressCheckScoreResult,
  StressCheckSeverity,
} from '@/types'

// ----------------------------------------------------------
// 1. 조건부 문항 필터링 — showIf 평가
// ----------------------------------------------------------
export function getVisibleQuestions(
  questions: SurveyQuestion[],
  answers: SurveyAnswers
): SurveyQuestion[] {
  return questions.filter((q) => {
    if (!q.showIf) return true
    const depAnswer = answers[q.showIf.questionId]
    if (depAnswer === undefined || depAnswer === null) return false
    if (q.showIf.equals !== undefined) return String(depAnswer) === q.showIf.equals
    if (q.showIf.notEquals !== undefined) return String(depAnswer) !== q.showIf.notEquals
    return true
  })
}

// ----------------------------------------------------------
// 2. cleanAnswers — visible 문항의 답변만 남김
// ----------------------------------------------------------
export function cleanAnswers(
  questions: SurveyQuestion[],
  answers: SurveyAnswers
): SurveyAnswers {
  const visible = getVisibleQuestions(questions, answers)
  const visibleIds = new Set(visible.map((q) => q.id))
  const cleaned: SurveyAnswers = {}
  for (const [key, value] of Object.entries(answers)) {
    if (visibleIds.has(key)) {
      cleaned[key] = value
    }
  }
  return cleaned
}

// ----------------------------------------------------------
// 3. 개별 문항 점수 산출
// ----------------------------------------------------------
function getQuestionScore(q: SurveyQuestion, answer: string | string[] | number): number {
  // multiple 타입: 선택 개수 = 점수
  if (q.type === 'multiple' && Array.isArray(answer)) {
    return answer.length
  }

  // single 타입: options에서 인덱스 찾아 optionScores 매핑
  if (q.type === 'single' && typeof answer === 'string') {
    if (!q.options || !q.optionScores) return 0
    const idx = q.options.indexOf(answer)
    if (idx >= 0 && idx < q.optionScores.length) {
      return q.optionScores[idx]
    }
  }

  return 0
}

// ----------------------------------------------------------
// 4. 가중치 기반 채점 (COMPASS-31)
// ----------------------------------------------------------
export interface WeightedScoreResult {
  totalScore: number
  severity: ScoringRule['severity'] | undefined
  interpretation: string | undefined
  domainScores: Record<string, number>
  domainRawScores: Record<string, number>
}

export function calculateWeightedScore(
  survey: Survey,
  answers: SurveyAnswers
): WeightedScoreResult {
  // 영역별 Raw Score 합산
  const domainRawScores: Record<string, number> = {}

  for (const q of survey.questions) {
    if (!q.domain) continue
    const answer = answers[q.id]
    if (answer === undefined || answer === null || answer === '') continue

    if (!domainRawScores[q.domain]) domainRawScores[q.domain] = 0
    domainRawScores[q.domain] += getQuestionScore(q, answer)
  }

  // 영역별 Weighted Score 산출
  const domainScores: Record<string, number> = {}
  let totalScore = 0

  if (survey.domainWeights) {
    for (const [domain, weight] of Object.entries(survey.domainWeights)) {
      const raw = domainRawScores[domain] || 0
      const weighted = Math.round(raw * weight * 100) / 100
      domainScores[domain] = weighted
      totalScore += weighted
    }
  }

  totalScore = Math.round(totalScore * 100) / 100

  // severity 판정 (소수점 기준)
  const matchedRule = survey.scoringRules?.find(
    (r) => totalScore >= r.minScore && totalScore <= r.maxScore
  )

  return {
    totalScore,
    severity: matchedRule?.severity,
    interpretation: matchedRule?.interpretation,
    domainScores,
    domainRawScores,
  }
}

// ----------------------------------------------------------
// 5. 단순 합산 채점 (PHQ-9, GAD-7 등 호환용)
// ----------------------------------------------------------
export function calculateSimpleScore(
  survey: Survey,
  answers: SurveyAnswers
): { totalScore: number; severity: ScoringRule['severity'] | undefined } {
  let totalScore = 0

  for (const q of survey.questions) {
    const answer = answers[q.id]
    if (answer === undefined || answer === null || answer === '') continue
    totalScore += getQuestionScore(q, answer)
  }

  const matchedRule = survey.scoringRules?.find(
    (r) => totalScore >= r.minScore && totalScore <= r.maxScore
  )

  return { totalScore, severity: matchedRule?.severity }
}

// ----------------------------------------------------------
// 6. 통합 채점 엔트리포인트
// ----------------------------------------------------------
export function calculateSurveyScore(
  survey: Survey,
  answers: SurveyAnswers
): WeightedScoreResult {
  // 숨겨진 문항의 답변 제거
  const cleaned = cleanAnswers(survey.questions, answers)

  if (survey.scoringType === 'weighted') {
    return calculateWeightedScore(survey, cleaned)
  }

  // simple 채점 fallback
  const simple = calculateSimpleScore(survey, cleaned)
  return {
    totalScore: simple.totalScore,
    severity: simple.severity,
    interpretation: survey.scoringRules?.find(
      (r) => simple.totalScore >= r.minScore && simple.totalScore <= r.maxScore
    )?.interpretation,
    domainScores: {},
    domainRawScores: {},
  }
}

// ----------------------------------------------------------
// 7. 스트레스 자가체크 채점
// ----------------------------------------------------------

export function calculateStressCheckScore(
  checkedItems: Record<string, boolean>,
  lifestyleAnswers: Record<string, string | number>,
  categories: StressCheckCategory[],
  severityLevels: Array<{
    min: number
    max: number
    level: StressCheckSeverity
    label: string
    interpretation: string
  }>
): StressCheckScoreResult {
  const categoryScores: StressCheckCategoryScore[] = []
  let totalWeighted = 0
  let totalWeightSum = 0

  for (const category of categories) {
    const total = category.items.length
    let checked = 0

    for (const item of category.items) {
      if (checkedItems[item.id]) {
        checked++
      }
    }

    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0
    const weightedScore = (checked / Math.max(total, 1)) * category.weight

    categoryScores.push({
      categoryId: category.id,
      categoryName: category.name,
      checked,
      total,
      percentage,
      weightedScore: Math.round(weightedScore * 100) / 100,
    })

    totalWeighted += weightedScore
    totalWeightSum += category.weight
  }

  // 0-100 스케일로 정규화
  const overallScore =
    totalWeightSum > 0
      ? Math.round((totalWeighted / totalWeightSum) * 100 * 100) / 100
      : 0

  // 중증도 판정
  const matched = severityLevels.find(
    (s) => overallScore >= s.min && overallScore <= s.max
  )

  // 상위 우려 카테고리 (percentage 내림차순, 0% 제외)
  const topConcerns = [...categoryScores]
    .filter((c) => c.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)
    .map((c) => c.categoryName)

  return {
    categoryScores,
    overallScore,
    severity: matched?.level ?? 'normal',
    severityLabel: matched?.label ?? '정상',
    topConcerns,
    lifestyleData: lifestyleAnswers,
  }
}
