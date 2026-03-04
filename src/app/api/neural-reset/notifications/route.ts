import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 알림 설정 조회
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // 기본값 반환
  return NextResponse.json(data ?? {
    checkin_enabled: true,
    checkin_time: '09:00',
    streak_reminder: true,
    weekly_review: true,
    survey_reminder: true,
  })
}

// POST: 알림 설정 저장
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const prefs = {
    user_id: user.id,
    checkin_enabled: body.checkin_enabled ?? true,
    checkin_time: body.checkin_time ?? '09:00',
    streak_reminder: body.streak_reminder ?? true,
    weekly_review: body.weekly_review ?? true,
    survey_reminder: body.survey_reminder ?? true,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(prefs, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
