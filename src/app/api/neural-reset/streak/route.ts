import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: badges } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })

  // 오늘 활동 기록 수
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { count: todaySessionCount } = await supabase
    .from('reset_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', `${today}T00:00:00+09:00`)
    .lte('created_at', `${today}T23:59:59+09:00`)

  const { count: todayCheckinCount } = await supabase
    .from('daily_checkins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('check_date', today)

  return NextResponse.json({
    streak: streak ?? { current_streak: 0, longest_streak: 0 },
    badges: badges ?? [],
    todayActive: (todaySessionCount ?? 0) + (todayCheckinCount ?? 0) > 0,
  })
}
