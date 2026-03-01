import type { Metadata } from 'next'
import SurveySelector from '@/components/survey/SurveySelector'

export const metadata: Metadata = {
  title: '설문 작성',
}

export default function SurveyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">설문 작성</h1>
        <p className="text-zinc-600 mt-1 text-sm">
          주기적으로 응답하면 증상 변화를 추적할 수 있습니다.
        </p>
      </div>
      <SurveySelector />
    </div>
  )
}
