import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            const persistSession = cookieStore.get('persist_session')?.value === 'true'
            cookiesToSet.forEach(({ name, value, options }) => {
              if (persistSession) {
                cookieStore.set(name, value, options)
              } else {
                // maxAge/expires 제거 → 세션 쿠키 (브라우저 종료 시 삭제)
                const { maxAge, expires, ...sessionOptions } = options as CookieOptions & { maxAge?: number; expires?: Date }
                cookieStore.set(name, value, sessionOptions)
              }
            })
          } catch {
            // Server Component에서 호출 시 무시 (미들웨어가 세션 갱신 처리)
          }
        },
      },
    }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
