'use client'

import Link from 'next/link'
import type { Questionnaire, Compass31Result } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Activity } from 'lucide-react'

interface Props {
  result: Compass31Result
  questionnaire: Questionnaire
}

const SEVERITY_CONFIG = {
  normal: {
    label: '정상',
    variant: 'secondary' as const,
    barColor: 'bg-green-500',
  },
  mild: {
    label: '경증',
    variant: 'outline' as const,
    barColor: 'bg-yellow-400',
  },
  moderate: {
    label: '중등도',
    variant: 'default' as const,
    barColor: 'bg-orange-500',
  },
  severe: {
    label: '중증',
    variant: 'destructive' as const,
    barColor: 'bg-red-500',
  },
}

const PATIENT_DESCRIPTIONS: Record<string, string> = {
  normal: '자율신경 기능이 대체로 정상 범위입니다.',
  mild: '자율신경 기능에 경미한 이상 소견이 있습니다. 생활 습관 개선이 도움이 될 수 있습니다.',
  moderate: '자율신경 기능에 중등도 이상 소견이 있습니다. 전문의 상담을 권장합니다.',
  severe:
    '자율신경 기능에 심각한 이상 소견이 있습니다. 가능한 빨리 전문의 상담을 받으시기 바랍니다.',
}

export default function Compass31ResultView({ result, questionnaire }: Props) {
  const config = SEVERITY_CONFIG[result.severity_level] ?? SEVERITY_CONFIG.normal

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* 종합 결과 (환자용) */}
      <Card>
        <CardHeader>
          <CardTitle>자가진단 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-zinc-900">{result.total_score.toFixed(1)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">/ 100점</p>
            </div>
            <div>
              <Badge variant={config.variant}>
                {result.severity_label}
              </Badge>
              <p className="text-sm text-zinc-700 mt-2">
                {PATIENT_DESCRIPTIONS[result.severity_level]}
              </p>
            </div>
          </div>

          {/* 점수 바 */}
          <Progress value={Math.min(result.total_score, 100)} className="h-3" />
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>0</span>
            <span>100</span>
          </div>
        </CardContent>
      </Card>

      {/* 도메인별 결과 (의료진 참고용) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">영역별 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.domain_details.map((domain) => {
              const ratio = domain.max_weighted_score > 0
                ? (domain.weighted_score / domain.max_weighted_score) * 100
                : 0
              return (
                <div key={domain.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-700">{domain.name}</span>
                    <span className="text-zinc-500">
                      {domain.weighted_score.toFixed(1)} / {domain.max_weighted_score}
                    </span>
                  </div>
                  <Progress value={ratio} className="h-2" />
                </div>
              )
            })}
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            * 영역별 점수는 의료진 상담 시 참고 자료로 활용하실 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* 다음 단계 안내 */}
      {(result.severity_level === 'moderate' || result.severity_level === 'severe') && (
        <Alert className="border-orange-200 bg-orange-50">
          <Activity className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">전문의 상담 권장</AlertTitle>
          <AlertDescription className="text-orange-700">
            <p>
              자율신경 기능에 이상 소견이 있습니다. 오상신경외과에서 정확한 평가와 적절한 치료를
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

      {/* 가입 유도 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-zinc-900 mb-2">증상을 지속적으로 관리하세요</h3>
          <p className="text-sm text-zinc-700 mb-4">
            스트레스 관리 시스템에 가입하시면 우울, 불안, ADHD 증상을 주기적으로 추적하고
            변화를 차트로 확인하실 수 있습니다.
          </p>
          <div className="flex gap-3">
            <Button size="sm" asChild>
              <Link href="/signup">가입하기</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">나중에</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground mt-4">{questionnaire.footer_disclaimer}</p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="text-sm text-zinc-500 underline w-full text-center"
      >
        다시 진단하기
      </button>
    </div>
  )
}
