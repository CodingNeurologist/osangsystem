import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/app')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="max-w-sm w-full text-center space-y-10 fade-in">
        {/* 로고 */}
        <div className="flex flex-col items-center space-y-4">
          <img
            src="/logo-icon.png"
            alt="오상케어 아이콘"
            className="h-20 w-auto object-contain animate-float"
          />
          <img
            src="/logo-horizontal.png"
            alt="오상케어"
            className="h-10 w-auto object-contain"
          />
          <p className="text-sm text-muted-foreground">
            오상신경외과 복지 플랫폼
          </p>
        </div>

        {/* CTA 버튼 */}
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full text-base py-6">
            <Link href="/check">자율신경 스트레스 자가체크</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            회원가입 없이 무료로 이용하실 수 있습니다
          </p>
        </div>

        {/* 로그인 / 가입 */}
        <div className="space-y-4">
          <Separator />
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/login">로그인</Link>
          </Button>
          <Link
            href="/signup"
            className="text-sm font-medium text-primary underline underline-offset-2 transition-colors inline-block"
          >
            스트레스 관리 시스템 가입하기
          </Link>
        </div>
      </div>
    </main>
  )
}
