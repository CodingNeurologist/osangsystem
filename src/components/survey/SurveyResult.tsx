'use client'

import Link from 'next/link'
import type { Questionnaire, SurveyType } from '@/types'
import SafetyProtocolBanner from './SafetyProtocolBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AsrsResult {
  total_score: number
  severity_level: string
  crisis_flag: boolean
  is_positive: boolean
  positive_count: number
}

type SurveyResultData = {
  total_score: number
  severity_level: string
  crisis_flag: boolean
  is_positive?: boolean
  positive_count?: number
}

interface SurveyResultProps {
  result: SurveyResultData
  questionnaire: Questionnaire
  surveyType: SurveyType
  onRetake: () => void
}

const SEVERITY_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  normal:   { label: '정상', variant: 'secondary' },
  mild:     { label: '경증', variant: 'outline' },
  moderate: { label: '중등도', variant: 'default' },
  severe:   { label: '중증', variant: 'destructive' },
  crisis:   { label: '위기', variant: 'destructive' },
}

const SEVERITY_COLORS: Record<string, string> = {
  normal: 'text-green-700',
  mild: 'text-yellow-700',
  moderate: 'text-orange-700',
  severe: 'text-red-700',
  crisis: 'text-red-800',
}

const SURVEY_LABELS: Record<SurveyType, string> = {
  phq9: '우울',
  gad7: '불안',
  asrs: 'ADHD',
}

export default function SurveyResult({
  result,
  questionnaire,
  surveyType,
  onRetake,
}: SurveyResultProps) {
  const severityConfig = SEVERITY_LABELS[result.severity_level] ?? SEVERITY_LABELS.normal
  const severityColor = SEVERITY_COLORS[result.severity_level] ?? SEVERITY_COLORS.normal
  const maxScore = questionnaire.scoring.max_score
  const scorePercent = Math.round((result.total_score / maxScore) * 100)

  const asrsResult: AsrsResult | null =
    'is_positive' in result && result.is_positive !== undefined
      ? (result as AsrsResult)
      : null

  return (
    <div className="space-y-5">
      {/* 안전 프로토콜 (PHQ-9 전용) */}
      {surveyType === 'phq9' && (
        <SafetyProtocolBanner
          score={result.total_score}
          crisisLine={questionnaire.safety_protocol?.crisis_line}
          crisisLineName={questionnaire.safety_protocol?.crisis_line_name}
          crisisLineHours={questionnaire.safety_protocol?.crisis_line_hours}
          hospitalMessage={questionnaire.safety_protocol?.hospital_message}
        />
      )}

      {/* 점수 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {SURVEY_LABELS[surveyType]} 검사 결과
            </CardTitle>
            {surveyType === 'asrs' ? (
              <Badge variant={asrsResult?.is_positive ? 'destructive' : 'secondary'}>
                {asrsResult?.is_positive ? '양성 (전문의 상담 권장)' : '음성'}
              </Badge>
            ) : (
              <Badge variant={severityConfig.variant}>
                {severityConfig.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {surveyType !== 'asrs' && (
            <>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-zinc-900">{result.total_score}</span>
                <span className="text-zinc-400 text-sm">/ {maxScore}점</span>
              </div>
              <Progress value={scorePercent} className="h-2" />
              <div className="flex justify-between text-xs text-zinc-400 mt-1">
                <span>0</span>
                <span>{maxScore}</span>
              </div>
            </>
          )}

          {surveyType === 'asrs' && asrsResult && (
            <p className="text-sm text-zinc-700">
              스크리닝 6개 문항 중 {asrsResult.positive_count}개 항목에서 주의가 필요한 응답이
              나타났습니다.
              {asrsResult.is_positive
                ? ' ADHD 증상이 의심되므로 전문의 상담을 받아보시기 바랍니다.'
                : ''}
            </p>
          )}

          {/* 결과 해석 문구 */}
          {questionnaire.score_response && (
            <p className="text-sm text-zinc-600 mt-3 pt-3 border-t border-zinc-100">
              {questionnaire.score_response[result.severity_level] ?? ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 면책 고지 */}
      <p className="text-xs text-center text-muted-foreground mt-4">{questionnaire.footer_disclaimer}</p>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 text-sm" asChild>
          <Link href="/app/chart">추이 차트 보기</Link>
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={onRetake}
          className="flex-1 text-sm"
        >
          다시 작성
        </Button>
      </div>
    </div>
  )
}
