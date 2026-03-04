import type { Metadata } from 'next'
import {
  Phone,
  MessageCircle,
  Globe,
  BookOpen,
  Instagram,
  MapPin,
  Youtube,
  ChevronRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: '병원 연락처',
}

const CONTACT_ITEMS = [
  {
    label: '전화하기',
    sub: '1599-5453',
    href: 'tel:1599-5453',
    icon: Phone,
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    label: '카카오톡 상담',
    sub: '카카오채널',
    href: 'https://pf.kakao.com/_pxlsPs/chat',
    icon: MessageCircle,
    color: 'bg-yellow-500/10 text-yellow-600',
  },
  {
    label: '줄기세포 상담',
    sub: '010-4559-5453',
    href: 'tel:010-4559-5453',
    icon: Phone,
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    label: '홈페이지',
    sub: 'osns.co.kr',
    href: 'https://osns.co.kr',
    icon: Globe,
    color: 'bg-primary/10 text-primary',
  },
  {
    label: '블로그',
    sub: 'Naver Blog',
    href: 'https://blog.naver.com/osns_',
    icon: BookOpen,
    color: 'bg-green-500/10 text-green-600',
  },
  {
    label: '인스타그램',
    sub: '@osangns_',
    href: 'https://instagram.com/osangns_',
    icon: Instagram,
    color: 'bg-pink-500/10 text-pink-600',
  },
  {
    label: '오시는 길',
    sub: '네이버 지도',
    href: 'https://naver.me/FMAynKMZ',
    icon: MapPin,
    color: 'bg-red-500/10 text-red-600',
  },
  {
    label: '유튜브',
    sub: '@오상병원',
    href: 'https://www.youtube.com/@%EC%98%A4%EC%83%81%EB%B3%91%EC%9B%90',
    icon: Youtube,
    color: 'bg-red-600/10 text-red-600',
  },
] as const

export default function ContactPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">병원 연락처</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          오상신경외과에 문의하거나 방문하실 수 있습니다.
        </p>
      </div>

      <div className="space-y-1.5">
        {CONTACT_ITEMS.map((item) => {
          const Icon = item.icon
          const isExternal = !item.href.startsWith('tel:')

          return (
            <a
              key={item.label}
              href={item.href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-100 bg-white transition-colors duration-150 hover:bg-zinc-50 active:scale-[0.99]"
            >
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${item.color}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
