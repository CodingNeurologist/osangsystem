import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { responses, total_score, domain_scores, severity_level } = body

    // 쿠키에서 세션 ID 가져오거나 생성
    const cookieStore = await cookies()
    let sessionId = cookieStore.get('anon_session_id')?.value

    if (!sessionId) {
      sessionId = randomUUID()
    }

    const supabase = await createServiceClient()

    const { error } = await supabase.from('anonymous_assessments').insert({
      session_id: sessionId,
      survey_type: 'compass31',
      responses,
      total_score,
      domain_scores,
      severity_level,
    })

    if (error) {
      return NextResponse.json({ error: '저장 실패' }, { status: 500 })
    }

    const response = NextResponse.json({ success: true })
    // 세션 ID 쿠키 설정 (30일)
    response.cookies.set('anon_session_id', sessionId, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })

    return response
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
