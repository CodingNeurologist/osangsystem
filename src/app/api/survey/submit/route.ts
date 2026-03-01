import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { survey_type, responses, total_score, severity_level, crisis_flag } = body

    if (!['phq9', 'gad7', 'asrs'].includes(survey_type)) {
      return NextResponse.json({ error: '올바르지 않은 설문 유형입니다.' }, { status: 400 })
    }

    const { error } = await supabase.from('survey_responses').insert({
      user_id: user.id,
      survey_type,
      responses,
      total_score,
      severity_level,
      crisis_flag: crisis_flag ?? false,
    })

    if (error) {
      return NextResponse.json({ error: '저장 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
