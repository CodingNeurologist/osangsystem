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
    const { activity_type, activity_detail, duration_sec, pre_distress, post_distress, completed } = body

    const validTypes = ['breathing', 'somatic', 'meditation', 'journal', 'sos', 'hrv']
    if (!validTypes.includes(activity_type)) {
      return NextResponse.json({ error: '올바르지 않은 활동 유형입니다.' }, { status: 400 })
    }

    const { data, error } = await supabase.from('reset_sessions').insert({
      user_id: user.id,
      activity_type,
      activity_detail: activity_detail ?? {},
      duration_sec: duration_sec ?? null,
      pre_distress: pre_distress ?? null,
      post_distress: post_distress ?? null,
      completed: completed ?? true,
    }).select().single()

    if (error) {
      return NextResponse.json({ error: '저장 실패' }, { status: 500 })
    }

    // 스트릭 갱신 + 배지 검사
    const streak = await updateStreak(supabase, user.id)
    const newBadges = await checkAndAwardBadges(supabase, user.id)

    return NextResponse.json({ success: true, session: data, streak, newBadges })
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
