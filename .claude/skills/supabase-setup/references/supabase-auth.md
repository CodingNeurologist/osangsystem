# Supabase Auth 설정 가이드

## 인증 방식 3가지

OsangCare는 이메일+비밀번호, 카카오 OAuth, Google OAuth를 지원한다.

---

## 1. 이메일+비밀번호 인증

Supabase Dashboard → Authentication → Providers → Email 활성화.

```typescript
// src/lib/supabase/auth.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 회원가입
export async function signUp(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

// 로그인
export async function signIn(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signInWithPassword({ email, password })
}
```

---

## 2. 카카오 OAuth 설정

### Kakao Developers 설정
1. https://developers.kakao.com → 내 애플리케이션 → 앱 추가
2. 플랫폼 → Web 플랫폼 등록: `https://your-project.supabase.co`
3. 카카오 로그인 활성화
4. Redirect URI 등록: `https://your-project.supabase.co/auth/v1/callback`
5. 동의항목: 닉네임(선택), 이메일(필수)
6. REST API 키 복사

### Supabase 설정
Authentication → Providers → Kakao 활성화
- Client ID: Kakao REST API 키
- Client Secret: 카카오 앱 시크릿 키

### 구현
```typescript
export async function signInWithKakao() {
  const supabase = createClient()
  return supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}
```

---

## 3. Google OAuth 설정

### Google Cloud Console 설정
1. https://console.cloud.google.com → 새 프로젝트
2. API 및 서비스 → OAuth 동의 화면 설정
3. 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성
4. 승인된 리디렉션 URI: `https://your-project.supabase.co/auth/v1/callback`
5. 클라이언트 ID, 시크릿 복사

### Supabase 설정
Authentication → Providers → Google 활성화
- Client ID, Client Secret 입력

### 구현
```typescript
export async function signInWithGoogle() {
  const supabase = createClient()
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}
```

---

## 4. 소셜 로그인 후 필수 프로필 수집 처리

소셜 로그인은 이메일만 제공하므로, 로그인 후 필수 프로필 완성 화면으로 리디렉션한다.

```typescript
// src/app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )
    await supabase.auth.exchangeCodeForSession(code)

    // 프로필 완성 여부 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('gender, birth_date, primary_symptoms')
        .eq('id', user.id)
        .single()

      // 필수 프로필 미완성 시 프로필 완성 페이지로
      if (!profile?.gender || !profile?.birth_date || !profile?.primary_symptoms?.length) {
        return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
      }
    }
  }

  return NextResponse.redirect(new URL('/app/dashboard', request.url))
}
```

---

## 5. 미들웨어 (라우트 보호)

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => response.cookies.set({ name, value, ...options }),
        remove: (name, options) => response.cookies.set({ name, value: '', ...options }),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // /app 경로: 로그인 필수
  if (request.nextUrl.pathname.startsWith('/app') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // /admin 경로: 관리자 권한 필수
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/app/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
}
```

---

## 6. 환경변수 (.env.example)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 카카오 OAuth (Supabase Dashboard에서 설정 — 여기 직접 사용 안 함)
# Google OAuth (Supabase Dashboard에서 설정 — 여기 직접 사용 안 함)

# 앱 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
