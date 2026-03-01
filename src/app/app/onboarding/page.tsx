import type { Metadata } from 'next'
import OnboardingForm from '@/components/auth/OnboardingForm'

export const metadata: Metadata = {
  title: '프로필 설정',
}

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
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
