import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '자율신경실조증 자가진단',
  description: 'COMPASS-31 기반 자율신경실조증 자가진단 설문입니다. 6개 도메인 31개 문항으로 구성되어 있습니다.',
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
