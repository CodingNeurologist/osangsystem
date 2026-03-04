import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWellnessReport, getCorrelationInsights } from '@/lib/neural-reset/insights'
import WellnessReportView from '@/components/neural-reset/WellnessReportView'

export const metadata: Metadata = {
  title: '웰니스 리포트 | 오상케어',
  description: '주간/월간 건강 리포트를 확인하세요',
}

export default async function ReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [weeklyReport, monthlyReport, insights] = await Promise.all([
    getWellnessReport(supabase, user.id, weekAgo, today),
    getWellnessReport(supabase, user.id, monthAgo, today),
    getCorrelationInsights(supabase, user.id),
  ])

  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">웰니스 리포트</h1>
        <p className="text-sm text-zinc-500 mt-1">
          체크인과 활동 데이터를 바탕으로 한 건강 리포트입니다.
        </p>
      </div>
      <WellnessReportView
        weeklyReport={weeklyReport}
        monthlyReport={monthlyReport}
        insights={insights}
      />
    </div>
  )
}
