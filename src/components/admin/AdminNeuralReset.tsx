'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface NeuralResetStats {
  summary: {
    totalCheckins: number
    weeklyCheckins: number
    totalSessions: number
    weeklySessions: number
    activeStreaks: number
    programEnrollments: number
  }
  checkinAverage: {
    count: number
    avgTotal: number
  }
  activityBreakdown: { activity_type: string }[] | null
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-zinc-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

const ACTIVITY_LABELS: Record<string, string> = {
  breathing: '호흡',
  somatic: '소마틱',
  meditation: '명상',
  journal: '일기',
  sos: 'SOS',
}

export default function AdminNeuralReset() {
  const [data, setData] = useState<NeuralResetStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats/neural-reset')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-zinc-600 mb-3 uppercase tracking-wide">
          뉴럴리셋
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (!data) {
    return null
  }

  // 활동 유형별 집계
  const activityCounts: Record<string, number> = {}
  if (data.activityBreakdown) {
    for (const row of data.activityBreakdown) {
      activityCounts[row.activity_type] = (activityCounts[row.activity_type] ?? 0) + 1
    }
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-600 mb-3 uppercase tracking-wide">
        뉴럴리셋
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="총 체크인"
          value={data.summary.totalCheckins.toLocaleString()}
          sub={`이번 주 ${data.summary.weeklyCheckins}`}
        />
        <StatCard
          label="총 활동 세션"
          value={data.summary.totalSessions.toLocaleString()}
          sub={`이번 주 ${data.summary.weeklySessions}`}
        />
        <StatCard
          label="활성 스트릭 사용자"
          value={data.summary.activeStreaks.toLocaleString()}
          sub="1일+ 연속 활동"
        />
        <StatCard
          label="프로그램 참여"
          value={data.summary.programEnrollments.toLocaleString()}
          sub="진행 중"
        />
        <StatCard
          label="체크인 평균 점수"
          value={data.checkinAverage.avgTotal > 0 ? `${data.checkinAverage.avgTotal}/20` : '-'}
          sub={data.checkinAverage.count > 0 ? `최근 30일 ${data.checkinAverage.count}건 기준` : '데이터 없음'}
        />
      </div>

      {/* 활동 유형별 분포 (최근 30일) */}
      {Object.keys(activityCounts).length > 0 && (
        <div className="mt-4 rounded-xl border border-zinc-100 bg-white p-4">
          <h3 className="text-xs font-medium text-zinc-500 mb-3">활동 유형 분포 (최근 30일)</h3>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(activityCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-1.5 text-sm">
                  <span className="text-zinc-600">{ACTIVITY_LABELS[type] ?? type}</span>
                  <span className="font-medium text-zinc-900">{count}회</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  )
}
