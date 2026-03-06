import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET — 개별 HRV 측정 상세 조회 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('hrv_measurements')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: '측정 기록을 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({ measurement: data })
}

/** PATCH — 사용자 메모 추가/수정 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { user_note } = body

    if (typeof user_note !== 'string') {
      return NextResponse.json({ error: '유효하지 않은 메모입니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('hrv_measurements')
      .update({ user_note: user_note.slice(0, 500) })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '수정 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true, measurement: data })
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
