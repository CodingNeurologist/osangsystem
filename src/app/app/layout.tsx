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

  // 필수 프로필 미완성 시 온보딩으로 이동
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

  return (
    <div className="min-h-screen bg-background">
      <AppNav userId={user.id} needsOnboarding={needsOnboarding} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
