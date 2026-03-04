import type { SupabaseClient } from '@supabase/supabase-js'

export interface WeeklyReport {
  period: { start: string; end: string }
  checkinStats: {
    count: number
    avgTotal: number
    avgBody: number
    avgMood: number
    avgEnergy: number
    avgStress: number
    trend: 'improving' | 'stable' | 'declining' | 'insufficient'
  }
  topSymptoms: Array<{ symptom: string; count: number }>
  activityStats: Array<{ type: string; count: number; totalDuration: number }>
  distressChange: { avgPre: number; avgPost: number } | null
  surveyScores: Array<{ type: string; score: number; date: string }>
}

export interface CorrelationInsight {
  message: string
  type: 'positive' | 'neutral' | 'info'
}

/**
 * 주간/월간 웰니스 리포트 데이터 수집
 */
export async function getWellnessReport(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<WeeklyReport> {
  const [
    { data: checkins },
    { data: prevCheckins },
    { data: sessions },
    { data: surveys },
  ] = await Promise.all([
    supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('check_date', startDate)
      .lte('check_date', endDate)
      .order('check_date', { ascending: true }),
    // 이전 기간 체크인 (비교용)
    supabase
      .from('daily_checkins')
      .select('body_score, mood_score, energy_score, stress_score')
      .eq('user_id', userId)
      .lt('check_date', startDate)
      .gte('check_date', getPrevPeriodStart(startDate, endDate))
      .order('check_date', { ascending: true }),
    supabase
      .from('reset_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${startDate}T00:00:00+09:00`)
      .lte('created_at', `${endDate}T23:59:59+09:00`),
    supabase
      .from('survey_responses')
      .select('survey_type, total_score, created_at')
      .eq('user_id', userId)
      .gte('created_at', `${startDate}T00:00:00+09:00`)
      .lte('created_at', `${endDate}T23:59:59+09:00`),
  ])

  const checkinList = checkins ?? []
  const prevList = prevCheckins ?? []
  const sessionList = sessions ?? []

  // 체크인 평균
  const count = checkinList.length
  const avgTotal = count > 0
    ? checkinList.reduce((s, c) => s + c.body_score + c.mood_score + c.energy_score + c.stress_score, 0) / count
    : 0
  const avgBody = count > 0 ? checkinList.reduce((s, c) => s + c.body_score, 0) / count : 0
  const avgMood = count > 0 ? checkinList.reduce((s, c) => s + c.mood_score, 0) / count : 0
  const avgEnergy = count > 0 ? checkinList.reduce((s, c) => s + c.energy_score, 0) / count : 0
  const avgStress = count > 0 ? checkinList.reduce((s, c) => s + c.stress_score, 0) / count : 0

  // 추세 판단
  const prevAvgTotal = prevList.length > 0
    ? prevList.reduce((s, c) => s + c.body_score + c.mood_score + c.energy_score + c.stress_score, 0) / prevList.length
    : 0
  let trend: WeeklyReport['checkinStats']['trend'] = 'insufficient'
  if (count >= 3 && prevList.length >= 3) {
    const diff = avgTotal - prevAvgTotal
    if (diff >= 1.5) trend = 'improving'
    else if (diff <= -1.5) trend = 'declining'
    else trend = 'stable'
  }

  // 증상 빈도
  const symptomCount: Record<string, number> = {}
  checkinList.forEach((c) => {
    const symptoms = (c.symptoms as string[]) ?? []
    symptoms.forEach((s) => {
      symptomCount[s] = (symptomCount[s] ?? 0) + 1
    })
  })
  const topSymptoms = Object.entries(symptomCount)
    .map(([symptom, cnt]) => ({ symptom, count: cnt }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // 활동 통계
  const activityMap: Record<string, { count: number; totalDuration: number }> = {}
  sessionList.forEach((s) => {
    const key = s.activity_type as string
    if (!activityMap[key]) activityMap[key] = { count: 0, totalDuration: 0 }
    activityMap[key].count += 1
    activityMap[key].totalDuration += (s.duration_sec as number) ?? 0
  })
  const activityStats = Object.entries(activityMap).map(([type, stats]) => ({
    type,
    ...stats,
  }))

  // 디스트레스 변화
  const sessionsWithDistress = sessionList.filter(
    (s) => s.pre_distress != null && s.post_distress != null
  )
  const distressChange = sessionsWithDistress.length > 0
    ? {
        avgPre: sessionsWithDistress.reduce((s, x) => s + (x.pre_distress as number), 0) / sessionsWithDistress.length,
        avgPost: sessionsWithDistress.reduce((s, x) => s + (x.post_distress as number), 0) / sessionsWithDistress.length,
      }
    : null

  // 설문 점수
  const surveyScores = (surveys ?? []).map((s) => ({
    type: s.survey_type as string,
    score: s.total_score as number,
    date: (s.created_at as string).split('T')[0],
  }))

  return {
    period: { start: startDate, end: endDate },
    checkinStats: {
      count,
      avgTotal: round(avgTotal),
      avgBody: round(avgBody),
      avgMood: round(avgMood),
      avgEnergy: round(avgEnergy),
      avgStress: round(avgStress),
      trend,
    },
    topSymptoms,
    activityStats,
    distressChange: distressChange
      ? { avgPre: round(distressChange.avgPre), avgPost: round(distressChange.avgPost) }
      : null,
    surveyScores,
  }
}

/**
 * 활동-증상 상관 인사이트 생성
 */
export async function getCorrelationInsights(
  supabase: SupabaseClient,
  userId: string
): Promise<CorrelationInsight[]> {
  const insights: CorrelationInsight[] = []

  // 최근 30일 데이터
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const [{ data: checkins }, { data: sessions }] = await Promise.all([
    supabase
      .from('daily_checkins')
      .select('check_date, body_score, mood_score, energy_score, stress_score')
      .eq('user_id', userId)
      .gte('check_date', thirtyDaysAgo)
      .lte('check_date', today),
    supabase
      .from('reset_sessions')
      .select('activity_type, created_at, pre_distress, post_distress')
      .eq('user_id', userId)
      .gte('created_at', `${thirtyDaysAgo}T00:00:00+09:00`),
  ])

  const checkinList = checkins ?? []
  const sessionList = sessions ?? []

  if (checkinList.length < 7) {
    insights.push({
      message: '아직 데이터가 부족합니다. 1주 이상 체크인을 하면 인사이트를 확인할 수 있습니다.',
      type: 'info',
    })
    return insights
  }

  // 활동 유형별 날짜 매핑
  const activityDates: Record<string, Set<string>> = {}
  sessionList.forEach((s) => {
    const date = (s.created_at as string).split('T')[0]
    const type = s.activity_type as string
    if (!activityDates[type]) activityDates[type] = new Set()
    activityDates[type].add(date)
  })

  // 체크인 점수를 날짜별 매핑
  const checkinMap = new Map<string, number>()
  checkinList.forEach((c) => {
    const total = c.body_score + c.mood_score + c.energy_score + c.stress_score
    checkinMap.set(c.check_date, total)
  })

  // 각 활동 유형별: 한 날 vs 안 한 날 체크인 평균 비교
  const ACTIVITY_LABELS: Record<string, string> = {
    breathing: '호흡 운동',
    somatic: '소마틱 운동',
    meditation: '명상',
    journal: '감사일기',
  }

  for (const [type, dates] of Object.entries(activityDates)) {
    if (dates.size < 3 || !ACTIVITY_LABELS[type]) continue

    const withActivity: number[] = []
    const withoutActivity: number[] = []

    checkinMap.forEach((score, date) => {
      if (dates.has(date)) {
        withActivity.push(score)
      } else {
        withoutActivity.push(score)
      }
    })

    if (withActivity.length >= 3 && withoutActivity.length >= 3) {
      const avgWith = withActivity.reduce((s, v) => s + v, 0) / withActivity.length
      const avgWithout = withoutActivity.reduce((s, v) => s + v, 0) / withoutActivity.length
      const diff = round(avgWith - avgWithout)

      if (diff >= 1) {
        insights.push({
          message: `${ACTIVITY_LABELS[type]}을(를) 한 날은 컨디션 점수가 평균 ${diff}점 더 높았습니다.`,
          type: 'positive',
        })
      } else if (diff <= -1) {
        insights.push({
          message: `${ACTIVITY_LABELS[type]}을(를) 한 날의 컨디션 점수가 평균 ${Math.abs(diff)}점 낮았습니다. 컨디션이 좋지 않은 날 더 자주 사용하셨을 수 있습니다.`,
          type: 'neutral',
        })
      }
    }
  }

  // 디스트레스 변화 인사이트
  const withDistress = sessionList.filter(
    (s) => s.pre_distress != null && s.post_distress != null
  )
  if (withDistress.length >= 5) {
    const avgChange = withDistress.reduce(
      (s, x) => s + ((x.pre_distress as number) - (x.post_distress as number)),
      0
    ) / withDistress.length
    if (avgChange > 0.5) {
      insights.push({
        message: `활동 후 불편함이 평균 ${round(avgChange)}점 감소했습니다.`,
        type: 'positive',
      })
    }
  }

  // 스트레스 차원 특이점
  const avgStress = checkinList.reduce((s, c) => s + c.stress_score, 0) / checkinList.length
  const avgMood = checkinList.reduce((s, c) => s + c.mood_score, 0) / checkinList.length
  if (avgStress < 2.5) {
    insights.push({
      message: '스트레스 점수가 지속적으로 낮습니다. 이완 활동이 도움이 될 수 있습니다.',
      type: 'info',
    })
  }
  if (avgMood < 2.5) {
    insights.push({
      message: '기분 점수가 낮은 편입니다. 감사일기 작성이 기분 향상에 도움이 될 수 있습니다.',
      type: 'info',
    })
  }

  if (insights.length === 0) {
    insights.push({
      message: '데이터를 더 쌓으면 유의미한 패턴을 발견할 수 있습니다.',
      type: 'info',
    })
  }

  return insights
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

function getPrevPeriodStart(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const diff = e.getTime() - s.getTime()
  return new Date(s.getTime() - diff).toISOString().split('T')[0]
}
