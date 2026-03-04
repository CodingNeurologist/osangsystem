'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Brain, Heart, User } from 'lucide-react'

const NAV_ITEMS = [
  {
    href: '/app',
    label: '홈',
    icon: Home,
    matchPaths: ['/app'],
    exact: true,
  },
  {
    href: '/app/survey',
    label: '설문',
    icon: ClipboardList,
    matchPaths: ['/app/survey'],
    exact: false,
  },
  {
    href: '/app/neural-reset',
    label: '뉴럴리셋',
    icon: Brain,
    matchPaths: ['/app/neural-reset', '/app/breathing', '/app/music', '/app/journal', '/app/neural-reset/checkin', '/app/neural-reset/breathing', '/app/neural-reset/music', '/app/neural-reset/journal', '/app/neural-reset/somatic', '/app/neural-reset/badges', '/app/neural-reset/sos', '/app/neural-reset/report', '/app/neural-reset/program', '/app/neural-reset/settings'],
    exact: false,
  },
  {
    href: '/app/health-info',
    label: '건강정보',
    icon: Heart,
    matchPaths: ['/app/health-info'],
    exact: false,
  },
  {
    href: '/app/mypage',
    label: '마이',
    icon: User,
    matchPaths: ['/app/mypage', '/app/contact', '/app/onboarding'],
    exact: false,
  },
] as const

export default function AppNav() {
  const pathname = usePathname()

  return (
    <>
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Link href="/app" className="flex items-center">
            <img
              src="/logo-horizontal.png"
              alt="오상케어"
              className="h-8 w-auto object-contain"
            />
          </Link>
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
              : item.matchPaths.some(
                  (p) => pathname === p || pathname.startsWith(p + '/')
                )
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
    </>
  )
}
