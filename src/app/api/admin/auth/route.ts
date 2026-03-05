import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME, computeAdminToken } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    const expectedUsername = process.env.ADMIN_USERNAME
    const expectedPassword = process.env.ADMIN_PASSWORD

    if (!expectedUsername || !expectedPassword) {
      return NextResponse.json(
        { error: '관리자 인증 설정이 없습니다' },
        { status: 500 }
      )
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    const token = await computeAdminToken()

    const response = NextResponse.json({ success: true })
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24시간
    })

    return response
  } catch {
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
