import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const ADMIN_COOKIE_NAME = 'admin-session'

/**
 * HMAC-SHA256 기반 관리자 세션 토큰 생성
 * Edge Runtime과 Node.js 모두 호환 (Web Crypto API 사용)
 */
export async function computeAdminToken(): Promise<string> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode('osangcare-admin-session-v1')
  )
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  const expected = await computeAdminToken()
  return token === expected
}

/**
 * API 라우트용 관리자 인증 검증
 * 인증 실패 시 NextResponse 반환, 성공 시 null
 */
export async function requireAdminAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value

  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json(
      { error: '관리자 인증이 필요합니다' },
      { status: 401 }
    )
  }

  return null
}
