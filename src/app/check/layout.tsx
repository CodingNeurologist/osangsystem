import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '자율신경 스트레스 자가체크 — 무료 자가진단',
  description: '수면, 기분, 뇌기능, 순환기, 소화기 등 8개 영역의 자율신경 관련 증상을 간편하게 점검해보세요. 회원가입 없이 약 3-5분이면 완료됩니다.',
  openGraph: {
    title: '자율신경 스트레스 자가체크 — 오상케어',
    description: '8개 영역 58개 항목으로 자율신경 상태를 체크하세요. 무료, 3-5분 소요.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '오상케어 자가체크' }],
  },
}

export default function CheckLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-primary font-semibold text-lg">
            오상케어
          </Link>
          <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-800">
            로그인
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
