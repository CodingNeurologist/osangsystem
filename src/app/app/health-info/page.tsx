import type { Metadata } from 'next'
import PatientContentList from '@/components/health-info/PatientContentList'
import YouTubeRecommendations from '@/components/health-info/YouTubeRecommendations'

export const metadata: Metadata = {
  title: '건강 정보',
}

export default function HealthInfoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">건강 정보</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          배정된 건강 자료를 확인하세요
        </p>
      </div>
      <YouTubeRecommendations />
      <PatientContentList />
    </div>
  )
}
