import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { LayoutDashboard, Music, Users, BookOpen } from 'lucide-react'
import { ADMIN_COOKIE_NAME, verifyAdminToken } from '@/lib/admin-auth'
import AdminLogoutButton from '@/components/admin/AdminLogoutButton'

export const metadata: Metadata = {
  title: '관리자 대시보드 | 오상케어',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  const isAuthenticated = adminToken ? await verifyAdminToken(adminToken) : false

  // 비인증 상태 (로그인 페이지 등): 네비게이션 없이 렌더링
  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-primary font-semibold">오상케어</Link>
            <span className="text-zinc-400">/</span>
            <span className="text-zinc-700 text-sm">관리자</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm text-zinc-600 hover:text-zinc-800 inline-flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              대시보드
            </Link>
            <Link
              href="/admin/contents"
              className="text-sm text-zinc-600 hover:text-zinc-800 inline-flex items-center gap-1.5"
            >
              <BookOpen className="h-4 w-4" />
              콘텐츠 관리
            </Link>
            <Link
              href="/admin/music"
              className="text-sm text-zinc-600 hover:text-zinc-800 inline-flex items-center gap-1.5"
            >
              <Music className="h-4 w-4" />
              음악 관리
            </Link>
            <Link
              href="/admin/users"
              className="text-sm text-zinc-600 hover:text-zinc-800 inline-flex items-center gap-1.5"
            >
              <Users className="h-4 w-4" />
              사용자 관리
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
