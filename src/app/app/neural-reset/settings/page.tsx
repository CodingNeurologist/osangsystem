import type { Metadata } from 'next'
import NotificationSettings from '@/components/neural-reset/NotificationSettings'

export const metadata: Metadata = {
  title: '알림 설정 | 오상케어',
  description: '뉴럴리셋 리마인더 알림을 설정합니다',
}

export default function NeuralResetSettingsPage() {
  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto">
      <NotificationSettings />
    </div>
  )
}
