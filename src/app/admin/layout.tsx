import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { LayoutDashboard, Music, Users, ExternalLink, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: '관리자 대시보드',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const serviceClient = await createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/app')
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary font-semibold">오상케어</Link>
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
            {profile.role === 'super_admin' && (
              <Link
                href="/admin/users"
                className="text-sm text-zinc-600 hover:text-zinc-800 inline-flex items-center gap-1.5"
              >
                <Users className="h-4 w-4" />
                사용자 관리
              </Link>
            )}
            <Link
              href="/app"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
            >
              <ExternalLink className="h-4 w-4" />
              앱으로 이동
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
