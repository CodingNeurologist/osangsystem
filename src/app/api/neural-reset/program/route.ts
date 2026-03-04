import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 현재 참여 중인 프로그램 조회
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('program_enrollments')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

// POST: 프로그램 등록 또는 진행 업데이트
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action, programId, day, completedActivities } = body

  if (action === 'enroll') {
    // 새 프로그램 등록
    const { error } = await supabase
      .from('program_enrollments')
      .upsert({
        user_id: user.id,
        program_id: programId,
        current_day: 1,
        status: 'active',
        daily_progress: {},
        started_at: new Date().toISOString(),
      }, { onConflict: 'user_id,program_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'progress') {
    // 일일 진행 업데이트
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('program_id', programId)
      .eq('status', 'active')
      .maybeSingle()

    if (!enrollment) {
      return NextResponse.json({ error: '활성 프로그램이 없습니다' }, { status: 404 })
    }

    const progress = (enrollment.daily_progress as Record<string, string[]>) ?? {}
    progress[String(day)] = completedActivities ?? []

    const newDay = Math.max(enrollment.current_day, day + 1)
    const isComplete = newDay > 28 // 4주 = 28일

    const { error } = await supabase
      .from('program_enrollments')
      .update({
        current_day: isComplete ? 28 : newDay,
        daily_progress: progress,
        status: isComplete ? 'completed' : 'active',
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq('id', enrollment.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, completed: isComplete })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
