'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { SurveyResponse, SurveyType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface SymptomChartProps {
  responses: SurveyResponse[]
}

const SURVEY_COLORS: Record<SurveyType, string> = {
  phq9: '#0284c7',
  gad7: '#7c3aed',
  asrs: '#059669',
}

const SURVEY_LABELS: Record<SurveyType, string> = {
  phq9: 'PHQ-9 (우울)',
  gad7: 'GAD-7 (불안)',
  asrs: 'ASRS (ADHD)',
}

// PHQ-9 안전 기준선 (20점)
const PHQ9_CRISIS_LINE = 20

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function buildChartData(responses: SurveyResponse[]) {
  const byDate: Record<string, Record<string, number>> = {}

  for (const r of responses) {
    const date = formatDate(r.created_at)
    if (!byDate[date]) byDate[date] = {}
    byDate[date][r.survey_type] = r.total_score
  }

  return Object.entries(byDate).map(([date, scores]) => ({
    date,
    ...scores,
  }))
}

export default function SymptomChart({ responses }: SymptomChartProps) {
  if (responses.length === 0) {
    return (
      <Card className="text-center py-10">
        <CardContent>
          <p className="text-zinc-500 text-sm mb-4">
            아직 설문 응답 기록이 없습니다.
          </p>
          <Button asChild>
            <Link href="/app/survey">첫 설문 작성하기</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const chartData = buildChartData(responses)
  const surveyTypes = Array.from(new Set(responses.map((r) => r.survey_type))) as SurveyType[]

  const hasPhq9 = surveyTypes.includes('phq9')
  const hasCrisis = responses.some((r) => r.survey_type === 'phq9' && r.crisis_flag)

  return (
    <div className="space-y-4">
      {/* PHQ-9 위기 경고 */}
      {hasCrisis && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm font-medium">
              최근 PHQ-9 점수가 위기 수준(20점 이상)으로 기록된 적이 있습니다.
            </p>
            <a
              href="tel:1577-0199"
              className="text-sm underline font-medium mt-1 block"
            >
              정신건강위기상담전화 1577-0199 (24시간)
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>점수 변화</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              />

              {/* PHQ-9 위기 기준선 */}
              {hasPhq9 && (
                <ReferenceLine
                  y={PHQ9_CRISIS_LINE}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{ value: '위기선', fill: '#dc2626', fontSize: 10 }}
                />
              )}

              {surveyTypes.map((type) => (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  name={SURVEY_LABELS[type]}
                  stroke={SURVEY_COLORS[type]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: SURVEY_COLORS[type] }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 최근 응답 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 응답 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...responses]
              .reverse()
              .slice(0, 10)
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium text-zinc-700">
                      {SURVEY_LABELS[r.survey_type]}
                    </span>
                    <span className="text-xs text-zinc-400 ml-2">
                      {new Date(r.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-800">
                      {r.total_score}점
                    </span>
                    {r.crisis_flag && (
                      <Badge variant="destructive">위기</Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
