import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SymptomChart from '@/components/chart/SymptomChart'
import type { SurveyResponse } from '@/types'

export const metadata: Metadata = {
  title: '증상 추이',
}

export default async function ChartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 최근 3개월 데이터 조회
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: responses } = await supabase
    .from('survey_responses')
    .select('id, survey_type, total_score, severity_level, crisis_flag, created_at')
    .eq('user_id', user.id)
    .gte('created_at', threeMonthsAgo.toISOString())
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">증상 추이</h1>
        <p className="text-zinc-600 mt-1 text-sm">최근 3개월간 설문 점수 변화입니다.</p>
      </div>

      <SymptomChart responses={(responses as SurveyResponse[]) ?? []} />

      <p className="text-xs text-center text-muted-foreground mt-4">
        본 결과는 전문 의료인의 진단을 대체하지 않습니다.
      </p>
    </div>
  )
}
