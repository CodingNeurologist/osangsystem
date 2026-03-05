import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { ADMIN_COOKIE_NAME, computeAdminToken } from '@/lib/admin-auth'

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname

    // ── 관리자 영역: 쿠키 기반 독립 인증 ──
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      // 로그인 페이지와 인증 API는 통과
      if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
        return NextResponse.next()
      }

      const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value
      if (!adminToken) {
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json({ error: '관리자 인증이 필요합니다' }, { status: 401 })
        }
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
      }

      const expectedToken = await computeAdminToken()
      if (adminToken !== expectedToken) {
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json({ error: '관리자 인증이 필요합니다' }, { status: 401 })
        }
        const url = request.nextUrl.clone()
        url.pathname = '/admin/login'
        return NextResponse.redirect(url)
      }

      return NextResponse.next()
    }

    // ── 사용자 영역: Supabase 인증 ──
    const { supabaseResponse, user } = await updateSession(request)

    // /app/* 경로: 로그인 필수
    if (pathname.startsWith('/app')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
      }

      // 온보딩 미완성 시 강제 리다이렉트 (온보딩 페이지 자체는 제외)
      if (!pathname.startsWith('/app/onboarding') && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseService = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            cookies: {
              getAll() { return request.cookies.getAll() },
              setAll() {},
            },
          }
        )

        const { data: profile } = await supabaseService
          .from('profiles')
          .select('gender, birth_date, primary_symptoms, privacy_consent_at')
          .eq('id', user.id)
          .single()

        const needsOnboarding =
          !profile?.gender ||
          !profile?.birth_date ||
          !profile?.primary_symptoms?.length ||
          !profile?.privacy_consent_at

        if (needsOnboarding) {
          const url = request.nextUrl.clone()
          url.pathname = '/app/onboarding'
          return NextResponse.redirect(url)
        }
      }
    }

    // 이미 로그인된 사용자가 /login, /signup 접근 시 /app으로 리디렉션
    if (user && (pathname === '/login' || pathname === '/signup')) {
      const url = request.nextUrl.clone()
      url.pathname = '/app'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)',
  ],
}
