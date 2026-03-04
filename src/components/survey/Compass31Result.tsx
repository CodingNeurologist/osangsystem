'use client'

import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  type TooltipProps,
} from 'recharts'
import type { WeightedScoreResult } from '@/utils/surveyScoring'
import {
  DOMAIN_LABELS,
  DOMAIN_MAX_WEIGHTED,
  DOMAIN_ORDER,
} from '@/data/compass31'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Activity, RotateCcw } from 'lucide-react'

// ----------------------------------------------------------
// 중증도별 설정
// ----------------------------------------------------------
const SEVERITY_CONFIG: Record<
  string,
  { label: string; variant: 'secondary' | 'outline' | 'default' | 'destructive'; color: string }
> = {
  minimal: { label: '정상', variant: 'secondary', color: 'text-green-700' },
  mild: { label: '경미', variant: 'outline', color: 'text-yellow-700' },
  moderate: { label: '중등도', variant: 'default', color: 'text-orange-700' },
  severe: { label: '심각', variant: 'destructive', color: 'text-red-700' },
}

// ----------------------------------------------------------
// 퍼센티지별 바 색상
// ----------------------------------------------------------
function getBarColor(percent: number): string {
  if (percent <= 25) return 'hsl(142, 71%, 45%)' // green
  if (percent <= 50) return 'hsl(221, 83%, 53%)' // blue (primary)
  if (percent <= 75) return 'hsl(38, 92%, 50%)'  // yellow/warning
  return 'hsl(0, 84%, 60%)'                      // red/destructive
}

// ----------------------------------------------------------
// 차트 데이터 생성
// ----------------------------------------------------------
function buildChartData(domainScores: Record<string, number>) {
  return DOMAIN_ORDER.map((domainId) => {
    const score = domainScores[domainId] ?? 0
    const max = DOMAIN_MAX_WEIGHTED[domainId] ?? 1
    const percent = Math.round((score / max) * 100)
    return {
      domain: DOMAIN_LABELS[domainId] ?? domainId,
      domainId,
      percent,
      score,
      max,
    }
  })
}

// ----------------------------------------------------------
// 커스텀 툴팁
// ----------------------------------------------------------
function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload as ReturnType<typeof buildChartData>[number]
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-zinc-900">{data.domain}</p>
      <p className="text-xs text-zinc-500">
        {data.score.toFixed(1)} / {data.max} ({data.percent}%)
      </p>
    </div>
  )
}

// ----------------------------------------------------------
// Main Component
// ----------------------------------------------------------
interface Props {
  result: WeightedScoreResult
}

export default function Compass31ResultView({ result }: Props) {
  const severity = result.severity ?? 'minimal'
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.minimal
  const chartData = buildChartData(result.domainScores)

  return (
    <div className="max-w-screen-md mx-auto px-4 py-6 space-y-6">
      {/* 종합 결과 카드 */}
      <Card className="rounded-xl shadow-sm border border-zinc-100 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">자가진단 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center min-w-[80px]">
              <p className="text-4xl font-semibold text-zinc-900">
                {result.totalScore.toFixed(1)}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">/ 100점</p>
            </div>
            <div className="flex-1">
              <Badge variant={config.variant} className="mb-2">
                {config.label}
              </Badge>
              {result.interpretation && (
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {result.interpretation}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 영역별 바 차트 */}
      <Card className="rounded-xl shadow-sm border border-zinc-100 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">영역별 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#71717a' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="domain"
                  width={60}
                  tick={{ fontSize: 12, fill: '#3f3f46' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="percent" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry) => (
                    <Cell key={entry.domainId} fill={getBarColor(entry.percent)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 영역별 상세 점수 */}
          <div className="mt-4 space-y-2">
            {chartData.map((d) => (
              <div key={d.domainId} className="flex justify-between text-sm">
                <span className="text-zinc-600">{d.domain}</span>
                <span className="text-zinc-500">
                  {d.score.toFixed(1)} / {d.max}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 전문의 상담 권고 */}
      {(severity === 'moderate' || severity === 'severe') && (
        <Alert className="border-orange-200 bg-orange-50">
          <Activity className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">전문의 상담 권장</AlertTitle>
          <AlertDescription className="text-orange-700">
            <p className="text-sm leading-relaxed">
              자율신경 기능에 이상 소견이 있습니다. 오상신경외과에서 정확한 평가와 적절한 관리를
              받아보시기 바랍니다.
            </p>
            <a
              href="tel:031-000-0000"
              className="inline-block mt-3 text-sm text-orange-700 underline font-medium"
            >
              병원 전화 연결
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* 추가 관리 안내 */}
      <Card className="rounded-xl border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-zinc-900 mb-2">증상을 지속적으로 관리하세요</h3>
          <p className="text-sm text-zinc-700 mb-4 leading-relaxed">
            우울, 불안, ADHD 증상을 주기적으로 추적하고
            변화를 차트로 확인하실 수 있습니다.
          </p>
          <div className="flex gap-3">
            <Button size="sm" asChild>
              <Link href="/app/survey">추적 설문 바로가기</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app">홈으로</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 면책 문구 */}
      <p className="text-xs text-center text-muted-foreground">
        이 결과는 참고용 자가점검 도구이며, 의사의 진단이나 치료를 대체하지 않습니다.
      </p>

      {/* 다시 진단하기 */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="text-zinc-500"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          다시 진단하기
        </Button>
      </div>
    </div>
  )
}
