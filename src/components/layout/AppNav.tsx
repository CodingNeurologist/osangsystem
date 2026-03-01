'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, ClipboardList, TrendingUp, BookOpen, Music, LogOut, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AppNavProps {
  userId: string
  needsOnboarding: boolean
}

const NAV_ITEMS = [
  { href: '/app',         label: '홈',  icon: Home,          exact: true },
  { href: '/app/survey',  label: '설문', icon: ClipboardList, exact: false },
  { href: '/app/chart',   label: '추이', icon: TrendingUp,    exact: false },
  { href: '/app/health-info', label: '건강', icon: Heart,     exact: false },
  { href: '/app/journal', label: '일기', icon: BookOpen,      exact: false },
] as const

export default function AppNav({ needsOnboarding }: AppNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/app" className="flex items-center">
            <img
              src="/logo-horizontal.png"
              alt="오상케어"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-2">
            {needsOnboarding && (
              <Link href="/app/onboarding">
                <Badge variant="secondary" className="bg-brand-gold-light text-accent cursor-pointer">
                  프로필 완성하기
                </Badge>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* 하단 탭 네비게이션 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-xl safe-area-bottom"
        aria-label="하단 탭 메뉴"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-1 py-2 rounded-xl flex-1 min-w-0 transition-colors duration-150 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
                <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 하단 탭 높이 패딩 */}
      <div className="h-16 safe-area-bottom" aria-hidden="true" />
    </>
  )
}
