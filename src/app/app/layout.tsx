import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/layout/AppNav'

export const metadata: Metadata = {
  title: '스트레스 관리',
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>
    </div>
  )
}
