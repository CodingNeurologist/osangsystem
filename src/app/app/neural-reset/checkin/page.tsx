import type { Metadata } from 'next'
import DailyCheckin from '@/components/neural-reset/DailyCheckin'

export const metadata: Metadata = {
  title: '오늘의 컨디션 | 오상케어',
  description: '매일 1분, 오늘의 컨디션을 기록해 보세요',
}

export default function CheckinPage() {
  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto">
      <DailyCheckin />
    </div>
  )
}
