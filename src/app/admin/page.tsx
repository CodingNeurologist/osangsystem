import type { Metadata } from 'next'
import AdminOverview from '@/components/admin/AdminOverview'
import AdminCharts from '@/components/admin/AdminCharts'
import AdminNeuralReset from '@/components/admin/AdminNeuralReset'

export const metadata: Metadata = {
  title: '관리자 대시보드',
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">대시보드</h1>
        <p className="text-zinc-500 text-sm mt-1">
          모든 통계는 익명 집계 데이터입니다. 개별 환자 정보는 포함되지 않습니다.
        </p>
      </div>

      <AdminOverview />
      <AdminNeuralReset />
      <AdminCharts />
    </div>
  )
}
