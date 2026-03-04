import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateStreak } from '@/lib/neural-reset/streaks'
import { checkAndAwardBadges } from '@/lib/neural-reset/badges-check'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { body_score, mood_score, energy_score, stress_score, symptoms } = body

    // 검증
    const scores = [body_score, mood_score, energy_score, stress_score]
    if (scores.some((s) => typeof s !== 'number' || s < 1 || s > 5)) {
      return NextResponse.json({ error: '점수는 1-5 사이여야 합니다.' }, { status: 400 })
    }

    const { data, error } = await supabase.from('daily_checkins').upsert(
      {
        user_id: user.id,
        check_date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0],
        body_score,
        mood_score,
        energy_score,
        stress_score,
        symptoms: symptoms ?? [],
      },
      { onConflict: 'user_id,check_date' }
    ).select().single()

    if (error) {
      return NextResponse.json({ error: '저장 실패' }, { status: 500 })
    }

    // 스트릭 갱신 + 배지 검사
    const streak = await updateStreak(supabase, user.id)
    const newBadges = await checkAndAwardBadges(supabase, user.id)

    return NextResponse.json({ success: true, checkin: data, streak, newBadges })
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]

  // 오늘 체크인 + 최근 7일
  const { data: checkins } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user.id)
    .gte('check_date', new Date(Date.now() + 9 * 60 * 60 * 1000 - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('check_date', { ascending: true })

  const todayCheckin = checkins?.find((c) => c.check_date === today) ?? null

  return NextResponse.json({ todayCheckin, recentCheckins: checkins ?? [] })
}
