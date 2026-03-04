import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NeuralResetDashboard from '@/components/neural-reset/NeuralResetDashboard'

export const metadata: Metadata = {
  title: '뉴럴리셋 | 오상케어',
  description: '자율신경계 안정화를 위한 매일의 자기 관리 허브',
}

export default async function NeuralResetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // 무드 캘린더용: 이번 달 1일
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // 병렬 조회
  const [
    { data: todayCheckin },
    { data: recentCheckins },
    { data: streak },
    { data: todaySessions },
    { data: badges },
    { data: journalMoods },
  ] = await Promise.all([
    supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('check_date', today)
      .maybeSingle(),
    supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('check_date', weekAgo)
      .order('check_date', { ascending: true }),
    supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('reset_sessions')
      .select('activity_type')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00+09:00`)
      .lte('created_at', `${today}T23:59:59+09:00`),
    supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', user.id),
    supabase
      .from('journal_entries')
      .select('created_at, mood')
      .eq('user_id', user.id)
      .not('mood', 'is', null)
      .gte('created_at', `${monthStart}T00:00:00+09:00`)
      .order('created_at', { ascending: true }),
  ])

  const todayActivityTypes = [...new Set((todaySessions ?? []).map((s) => s.activity_type))]
  const hasTodayCheckin = !!todayCheckin
  const todayActive = hasTodayCheckin || (todaySessions ?? []).length > 0

  // 무드 엔트리: journal_entries의 created_at에서 날짜 추출
  const moodEntries = (journalMoods ?? [])
    .filter((j): j is { created_at: string; mood: number } => j.mood !== null)
    .map((j) => ({
      date: new Date(j.created_at).toISOString().split('T')[0],
      mood: j.mood,
    }))

  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto">
      <NeuralResetDashboard
        todayCheckin={todayCheckin}
        recentCheckins={recentCheckins ?? []}
        streak={streak ?? { current_streak: 0, longest_streak: 0 }}
        todayActive={todayActive}
        todayActivityTypes={todayActivityTypes}
        badgeCount={(badges ?? []).length}
        moodEntries={moodEntries}
      />
    </div>
  )
}
