import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: '로그인',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50">
      <div className="max-w-md w-full slide-up">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <img src="/logo-icon.png" alt="" className="h-14 w-auto object-contain" aria-hidden="true" />
            <img src="/logo-horizontal.png" alt="오상케어" className="h-8 w-auto object-contain" />
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            스트레스 관리 시스템
          </p>
        </div>

        {/* 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="text-center text-sm mt-4 text-muted-foreground">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-medium text-primary underline underline-offset-2">
            가입하기
          </Link>
        </p>
      </div>
    </div>
  )
}
