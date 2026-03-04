import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 활동 완료 후 배지 조건 검사 및 신규 배지 부여
 * 반환: 새로 획득한 배지 ID 배열
 */
export async function checkAndAwardBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const newBadges: string[] = []

  // 이미 획득한 배지 조회
  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)

  const earned = new Set((existingBadges ?? []).map((b) => b.badge_id))

  // 1. 첫 걸음: 첫 번째 활동 (reset_sessions가 1개 이상)
  if (!earned.has('first-step')) {
    const { count } = await supabase
      .from('reset_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count && count >= 1) {
      newBadges.push('first-step')
    }
  }

  // 2-4. 스트릭 배지
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single()

  if (streak) {
    const maxStreak = Math.max(streak.current_streak, streak.longest_streak)
    if (!earned.has('streak-3') && maxStreak >= 3) newBadges.push('streak-3')
    if (!earned.has('streak-7') && maxStreak >= 7) newBadges.push('streak-7')
    if (!earned.has('streak-30') && maxStreak >= 30) newBadges.push('streak-30')
  }

  // 5. 호흡 마스터: 호흡 세션 20회
  if (!earned.has('breathing-master')) {
    const { count } = await supabase
      .from('reset_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'breathing')
      .eq('completed', true)
    if (count && count >= 20) {
      newBadges.push('breathing-master')
    }
  }

  // 6. 일기 작가: 감사일기 10회
  if (!earned.has('journal-writer')) {
    const { count } = await supabase
      .from('reset_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'journal')
      .eq('completed', true)
    if (count && count >= 10) {
      newBadges.push('journal-writer')
    }
  }

  // 7. 전인 관리: 같은 날 체크인+호흡+일기 모두 완료
  if (!earned.has('holistic-care')) {
    const today = new Date()
    const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000)
    const todayStr = kst.toISOString().split('T')[0]
    const startOfDay = `${todayStr}T00:00:00+09:00`
    const endOfDay = `${todayStr}T23:59:59+09:00`

    // 체크인 확인
    const { count: checkinCount } = await supabase
      .from('daily_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('check_date', todayStr)

    // 오늘 호흡 세션 확인
    const { count: breathingCount } = await supabase
      .from('reset_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'breathing')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)

    // 오늘 일기 세션 확인
    const { count: journalCount } = await supabase
      .from('reset_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'journal')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)

    if (checkinCount && checkinCount >= 1 && breathingCount && breathingCount >= 1 && journalCount && journalCount >= 1) {
      newBadges.push('holistic-care')
    }
  }

  // 8. 개선 확인: 최근 주간 평균 체크인 점수가 이전 주 대비 3점+ 향상
  if (!earned.has('improvement')) {
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const todayStr = now.toISOString().split('T')[0]

    const [{ data: thisWeek }, { data: lastWeek }] = await Promise.all([
      supabase
        .from('daily_checkins')
        .select('body_score, mood_score, energy_score, stress_score')
        .eq('user_id', userId)
        .gte('check_date', weekAgo)
        .lte('check_date', todayStr),
      supabase
        .from('daily_checkins')
        .select('body_score, mood_score, energy_score, stress_score')
        .eq('user_id', userId)
        .gte('check_date', twoWeeksAgo)
        .lt('check_date', weekAgo),
    ])

    if (thisWeek && thisWeek.length >= 3 && lastWeek && lastWeek.length >= 3) {
      const avgThis = thisWeek.reduce((s, c) => s + c.body_score + c.mood_score + c.energy_score + c.stress_score, 0) / thisWeek.length
      const avgLast = lastWeek.reduce((s, c) => s + c.body_score + c.mood_score + c.energy_score + c.stress_score, 0) / lastWeek.length
      if (avgThis - avgLast >= 3) {
        newBadges.push('improvement')
      }
    }
  }

  // 새 배지 일괄 INSERT
  if (newBadges.length > 0) {
    const rows = newBadges.map((badgeId) => ({
      user_id: userId,
      badge_id: badgeId,
    }))
    await supabase.from('user_badges').insert(rows)
  }

  return newBadges
}
