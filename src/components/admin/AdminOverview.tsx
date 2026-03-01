'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface OverviewData {
  total_users: number
  this_month_users: number
  last_month_users: number
  total_surveys: number
  crisis_count: number
  compass_total: number
  compass_converted: number
  conversion_rate: number
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-red-200 bg-red-50' : ''}>
      <CardContent className="p-4">
        <p className="text-xs text-zinc-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${highlight ? 'text-red-700' : 'text-zinc-900'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats/overview')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">통계를 불러올 수 없습니다.</p>
  }

  const growthRate =
    data.last_month_users > 0
      ? Math.round(
          ((data.this_month_users - data.last_month_users) / data.last_month_users) * 100
        )
      : null

  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-600 mb-3 uppercase tracking-wide">
        주요 지표
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="총 가입자"
          value={data.total_users.toLocaleString()}
          sub="누적"
        />
        <StatCard
          label="이번 달 신규"
          value={data.this_month_users.toLocaleString()}
          sub={
            growthRate !== null
              ? `전월 대비 ${growthRate >= 0 ? '+' : ''}${growthRate}%`
              : '전월 데이터 없음'
          }
        />
        <StatCard
          label="총 설문 응답"
          value={data.total_surveys.toLocaleString()}
          sub="PHQ-9·GAD-7·ASRS 합산"
        />
        <StatCard
          label="위기 감지 횟수"
          value={data.crisis_count.toLocaleString()}
          sub="PHQ-9 20점 이상"
          highlight={data.crisis_count > 0}
        />
        <StatCard
          label="자가진단 완료"
          value={data.compass_total.toLocaleString()}
          sub="COMPASS-31 비회원"
        />
        <StatCard
          label="가입 전환"
          value={data.compass_converted.toLocaleString()}
          sub="자가진단 후 회원 가입"
        />
        <StatCard
          label="전환율"
          value={`${data.conversion_rate}%`}
          sub="자가진단 → 가입"
        />
      </div>
    </section>
  )
}
