import type { Metadata } from 'next'
import Link from 'next/link'
import SignupForm from '@/components/auth/SignupForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata: Metadata = {
  title: '회원가입',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-zinc-50">
      <div className="max-w-md w-full slide-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <img src="/logo-icon.png" alt="" className="h-14 w-auto object-contain" aria-hidden="true" />
            <img src="/logo-horizontal.png" alt="오상케어" className="h-8 w-auto object-contain" />
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            스트레스 관리 시스템
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>가입하기</CardTitle>
            <CardDescription>
              증상 추적과 스트레스 관리 도구를 무료로 이용하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
        <p className="text-center text-sm mt-4 text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-primary underline underline-offset-2">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
