import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, Building2, UserPen, ChevronRight } from 'lucide-react'
import LogoutButton from '@/components/layout/LogoutButton'

export const metadata: Metadata = {
  title: '마이페이지',
}

const MENU_ITEMS = [
  {
    href: '/app/onboarding',
    icon: UserPen,
    label: '프로필 수정',
    color: 'bg-primary/10 text-primary',
  },
  {
    href: '/app/contact',
    icon: Phone,
    label: '병원 연락처',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    href: '/app/treatment',
    icon: Building2,
    label: '치료 안내',
    color: 'bg-secondary text-primary',
  },
] as const

const GENDER_MAP: Record<string, string> = {
  male: '남성',
  female: '여성',
  other: '기타',
  prefer_not_to_say: '미응답',
}

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('gender, birth_date, primary_symptoms')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">마이페이지</h1>
      </div>

      {/* 프로필 요약 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-semibold text-lg">
              {user.email?.[0]?.toUpperCase() ?? 'U'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {user.email}
              </p>
              {profile?.gender && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {GENDER_MAP[profile.gender] ?? profile.gender}
                  {profile.birth_date && ` · ${profile.birth_date}`}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 메뉴 */}
      <div className="space-y-2">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="transition-colors duration-150 hover:bg-zinc-50 active:scale-[0.99]">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <span
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${item.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* 로그아웃 */}
      <LogoutButton />
    </div>
  )
}
