import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from '@/components/auth/OnboardingForm'
import LogoutButton from '@/components/layout/LogoutButton'

export const metadata: Metadata = {
  title: '프로필 설정',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gender, birth_date, primary_symptoms, privacy_consent_at')
      .eq('id', user.id)
      .single()

    // 이미 프로필이 완성된 유저는 홈으로 리다이렉트
    if (
      profile?.gender &&
      profile?.birth_date &&
      profile?.primary_symptoms?.length &&
      profile?.privacy_consent_at
    ) {
      redirect('/app')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <LogoutButton />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">기본 정보 입력</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          서비스 이용을 위해 몇 가지 기본 정보가 필요합니다.
          입력하신 정보는 익명 임상 연구에 활용됩니다.
        </p>
      </div>
      <OnboardingForm />
    </div>
  )
}
