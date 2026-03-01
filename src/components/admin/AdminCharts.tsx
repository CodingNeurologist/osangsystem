'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlySignup, MonthlySurveyAvg, AgeGroupSymptoms, Phq9TrendSummary } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function formatMonth(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear().toString().slice(2)}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function AdminCharts() {
  const [signups, setSignups] = useState<MonthlySignup[]>([])
  const [surveys, setSurveys] = useState<MonthlySurveyAvg[]>([])
  const [ageGroups, setAgeGroups] = useState<AgeGroupSymptoms[]>([])
  const [trend, setTrend] = useState<Phq9TrendSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats/signups').then((r) => r.json()),
      fetch('/api/admin/stats/surveys').then((r) => r.json()),
      fetch('/api/admin/stats/symptoms').then((r) => r.json()),
      fetch('/api/admin/stats/trend').then((r) => r.json()),
    ])
      .then(([s, sv, sy, t]) => {
        setSignups(Array.isArray(s) ? s : [])
        setSurveys(Array.isArray(sv) ? sv : [])
        setAgeGroups(Array.isArray(sy?.age_groups) ? sy.age_groups : [])
        setTrend(Array.isArray(t) ? t : [])
      })
      .finally(() => setLoading(false))
  }, [])

  // 설문 추이 데이터 변환 (월별 × 설문 유형)
  const surveyChartData = (() => {
    const byMonth: Record<string, Record<string, number>> = {}
    for (const row of surveys) {
      const key = formatMonth(row.month)
      if (!byMonth[key]) byMonth[key] = {}
      byMonth[key][row.survey_type] = Number(row.avg_score)
    }
    return Object.entries(byMonth).map(([month, scores]) => ({ month, ...scores }))
  })()

  // PHQ-9 추이 변환
  const trendChartData = trend.map((t) => ({
    month: formatMonth(t.month),
    개선: t.improved_count,
    안정: t.stable_count,
    악화: t.worsened_count,
  }))

  // 나이대별 평균 점수 (PHQ-9만)
  const agePhq9 = ageGroups
    .filter((r) => r.survey_type === 'phq9')
    .map((r) => ({ age_group: r.age_group, 'PHQ-9 평균': Number(r.avg_score) }))

  const chartTooltipStyle = {
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '12px',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 신규 가입자 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-zinc-800">월별 신규 가입자</CardTitle>
        </CardHeader>
        <CardContent>
          {signups.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={signups.map((s) => ({
                  month: formatMonth(s.month),
                  전체: s.signup_count,
                  남성: s.male_count,
                  여성: s.female_count,
                }))}
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="전체" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="남성" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="여성" fill="#f472b6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 설문 유형별 평균 점수 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-zinc-800">설문 유형별 월평균 점수 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {surveyChartData.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={surveyChartData}
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="phq9" name="PHQ-9(우울)" stroke="#0284c7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gad7" name="GAD-7(불안)" stroke="#7c3aed" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="asrs" name="ASRS(ADHD)" stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* PHQ-9 개선/악화 비율 */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-zinc-800">PHQ-9 증상 변화 추이</CardTitle>
          <p className="text-xs text-zinc-500">동일 환자의 전후 비교 (5점 이상 변화 기준)</p>
        </CardHeader>
        <CardContent>
          {trendChartData.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={trendChartData}
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="개선" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="안정" fill="#94a3b8" stackId="a" />
                <Bar dataKey="악화" fill="#f87171" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 나이대별 PHQ-9 평균 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-zinc-800">나이대별 PHQ-9 평균 점수</CardTitle>
        </CardHeader>
        <CardContent>
          {agePhq9.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={agePhq9}
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis dataKey="age_group" type="category" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={55} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="PHQ-9 평균" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
