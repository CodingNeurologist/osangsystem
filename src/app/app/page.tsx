import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { TrendingUp, BookOpen, Wind, Music, Building2, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: '홈',
}

const SUB_CARDS = [
  {
    href: '/app/chart',
    icon: TrendingUp,
    title: '증상 추이',
    desc: '시간에 따른 변화 확인',
  },
  {
    href: '/app/journal',
    icon: BookOpen,
    title: '감사일기',
    desc: '오늘 감사한 일 기록',
  },
  {
    href: '/app/breathing',
    icon: Wind,
    title: '호흡 가이드',
    desc: '호흡으로 긴장 풀기',
  },
  {
    href: '/app/music',
    icon: Music,
    title: '명상음악',
    desc: '바이노럴 비트 & 명상',
  },
] as const

export default async function AppHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
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
    redirect('/app/onboarding')
  }

  return (
    <div className="space-y-6 slide-up">
      {/* 인사말 */}
      <div className="pt-2">
        <p className="text-sm text-muted-foreground">안녕하세요</p>
        <h1 className="text-2xl font-semibold mt-0.5 text-foreground">
          오늘은 어떠세요?
        </h1>
      </div>

      {/* 오늘 설문 CTA 카드 */}
      <Link
        href="/app/survey"
        className="flex items-center justify-between p-5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 active:scale-[0.98]"
      >
        <div>
          <p className="text-xs font-medium mb-1 opacity-75">
            오늘 설문 작성하기
          </p>
          <p className="text-base font-semibold leading-snug">
            우울·불안·ADHD 증상을 기록하세요
          </p>
        </div>
        <ChevronRight className="ml-3 h-5 w-5 flex-shrink-0 opacity-80" />
      </Link>

      {/* 기능 카드 그리드 */}
      <div>
        <h2 className="text-xs font-semibold mb-3 tracking-wide uppercase text-muted-foreground">
          건강 관리
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {SUB_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.href} href={card.href}>
                <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md h-full">
                  <CardContent className="p-4">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-primary mb-3">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-semibold text-sm mb-0.5 text-foreground">
                      {card.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {card.desc}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 치료 안내 */}
      <Link
        href="/app/treatment"
        className="flex items-center justify-between p-4 rounded-xl border border-border transition-colors duration-150 hover:bg-zinc-50"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-primary">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-sm text-foreground">치료 안내</p>
            <p className="text-xs text-muted-foreground">
              자율신경실조증 치료 정보
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>
    </div>
  )
}
