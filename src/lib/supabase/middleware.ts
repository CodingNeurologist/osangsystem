import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const persistSession = request.cookies.get('persist_session')?.value === 'true'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            if (persistSession) {
              // 로그인 유지: Supabase 기본 만료 설정 유지
              supabaseResponse.cookies.set(name, value, options)
            } else {
              // 세션 쿠키: maxAge/expires 제거 → 브라우저 종료 시 삭제
              const { maxAge, expires, ...sessionOptions } = options as CookieOptions & { maxAge?: number; expires?: Date }
              supabaseResponse.cookies.set(name, value, sessionOptions)
            }
          })
        },
      },
    }
  )

  // 세션 갱신 (토큰 만료 자동 처리)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
