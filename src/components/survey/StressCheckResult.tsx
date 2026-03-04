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
import type { StressCheckScoreResult } from '@/types'
import { SEVERITY_CONFIG } from '@/data/stresscheck'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Activity, RotateCcw, AlertTriangle, Link2, TrendingUp, ClipboardCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

// ----------------------------------------------------------
// 바 색상 (퍼센티지별)
// ----------------------------------------------------------
function getBarColor(percent: number): string {
  if (percent <= 25) return 'hsl(142, 71%, 45%)'
  if (percent <= 50) return 'hsl(221, 83%, 53%)'
  if (percent <= 75) return 'hsl(38, 92%, 50%)'
  return 'hsl(0, 84%, 60%)'
}

// ----------------------------------------------------------
// 차트 데이터 생성
// ----------------------------------------------------------
function buildChartData(result: StressCheckScoreResult) {
  return result.categoryScores.map((cs) => ({
    category: cs.categoryName,
    categoryId: cs.categoryId,
    percent: cs.percentage,
    checked: cs.checked,
    total: cs.total,
  }))
}

// ----------------------------------------------------------
// 커스텀 툴팁
// ----------------------------------------------------------
function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload as ReturnType<typeof buildChartData>[number]
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-zinc-900">{data.category}</p>
      <p className="text-xs text-zinc-500">
        {data.checked}개 / {data.total}개 ({data.percent}%)
      </p>
    </div>
  )
}

// ----------------------------------------------------------
// Props
// ----------------------------------------------------------
interface Props {
  result: StressCheckScoreResult
}

export default function StressCheckResultView({ result }: Props) {
  const config = SEVERITY_CONFIG[result.severity]
  const chartData = buildChartData(result)
  const showAlert = result.severity === 'attention' || result.severity === 'consult'

  async function handleShare() {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/check' : ''
    const shareText = `자율신경 스트레스 자가체크 결과: ${Math.round(result.overallScore)}점 (${config.label})\n나도 체크해보기:`

    if (navigator.share) {
      try {
        await navigator.share({ title: '오상케어 자가체크 결과', text: shareText, url: shareUrl })
      } catch {
        /* 사용자 취소 */
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      toast.success('링크가 복사되었습니다')
    }
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 py-6 space-y-6">
      {/* 종합 결과 카드 */}
      <Card className="rounded-xl shadow-sm border border-zinc-100 bg-white">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">자가체크 결과</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleShare} className="text-zinc-500">
            <Link2 className="h-4 w-4 mr-1" />
            공유
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center min-w-[80px]">
              <p className="text-4xl font-semibold text-zinc-900">
                {Math.round(result.overallScore)}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">/ 100점</p>
            </div>
            <div className="flex-1">
              <Badge variant={config.variant} className="mb-2">
                {config.label}
              </Badge>
              <p className="text-sm text-zinc-700 leading-relaxed">
                {result.severity === 'normal' &&
                  '현재 자율신경 관련 증상이 적은 편입니다. 건강한 생활습관을 유지하세요.'}
                {result.severity === 'caution' &&
                  '일부 영역에서 증상이 확인됩니다. 생활습관 개선과 스트레스 관리를 권합니다.'}
                {result.severity === 'attention' &&
                  '여러 영역에서 증상이 확인됩니다. 자율신경 진료를 받아보시는 것을 고려해보세요.'}
                {result.severity === 'consult' &&
                  '다수의 영역에서 증상이 뚜렷합니다. 자율신경 전문 진료를 받아보시기를 권합니다.'}
              </p>
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
          <div className="w-full" style={{ height: 280 }}>
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
                  dataKey="category"
                  width={72}
                  tick={{ fontSize: 12, fill: '#3f3f46' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="percent" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry) => (
                    <Cell key={entry.categoryId} fill={getBarColor(entry.percent)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 영역별 상세 */}
          <div className="mt-4 space-y-2">
            {chartData.map((d) => (
              <div key={d.categoryId} className="flex justify-between text-sm">
                <span className="text-zinc-600">{d.category}</span>
                <span className="text-zinc-500">
                  {d.checked}개 / {d.total}개
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 주요 우려 영역 */}
      {result.topConcerns.length > 0 && (
        <Card className="rounded-xl shadow-sm border border-zinc-100 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">주요 확인 영역</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 mb-3">
              아래 영역에서 해당 증상이 상대적으로 많이 확인되었습니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {result.topConcerns.map((name) => (
                <Badge key={name} variant="outline" className="text-sm">
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 자율신경 진료 안내 */}
      {showAlert && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">자율신경 진료 안내</AlertTitle>
          <AlertDescription className="text-orange-700">
            <p className="text-sm leading-relaxed">
              자율신경계 관련 증상이 여러 영역에서 확인됩니다.
              정확한 평가를 위해 오상신경외과에서 자율신경 진료를 받아보시는 것을 권합니다.
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

      {/* 생활습관 참고 */}
      {(result.lifestyleData['stress-level'] !== undefined ||
        result.lifestyleData['exercise'] ||
        result.lifestyleData['caffeine']) && (
        <Card className="rounded-xl shadow-sm border border-zinc-100 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">생활습관 참고</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.lifestyleData['stress-level'] !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">스트레스 수준</span>
                <span className="text-zinc-900 font-medium">
                  {result.lifestyleData['stress-level']}점 / 100점
                </span>
              </div>
            )}
            {result.lifestyleData['exercise'] && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">운동 습관</span>
                <span className="text-zinc-900">{result.lifestyleData['exercise']}</span>
              </div>
            )}
            {result.lifestyleData['caffeine'] && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">카페인 섭취</span>
                <span className="text-zinc-900">{result.lifestyleData['caffeine']}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 가입 유도 */}
      <Card className="rounded-xl border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="font-semibold text-zinc-900 mb-1">내 기록을 저장하고 추적하기</h3>
            <p className="text-sm text-zinc-600 leading-relaxed mb-3">
              무료 가입으로 더 많은 기능을 이용하세요.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <ClipboardCheck className="h-4 w-4 text-primary flex-shrink-0" />
                <span>COMPASS-31 국제 표준 정밀 자율신경 검사</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                <span>우울/불안/ADHD 증상 추이 차트로 변화 확인</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <span>호흡 가이드, 명상, 감사일기 등 자기관리 도구</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button size="lg" className="flex-1" asChild>
              <Link href="/signup">무료 가입하기</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/">나중에</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 면책 문구 */}
      <p className="text-xs text-center text-muted-foreground leading-relaxed">
        본 결과는 의학적 진단이 아닌 자가점검 참고자료입니다.
        <br />
        증상이 지속되면 전문 의료인과 상담하세요.
      </p>

      {/* 다시 체크하기 */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="text-zinc-500"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          다시 체크하기
        </Button>
      </div>
    </div>
  )
}
