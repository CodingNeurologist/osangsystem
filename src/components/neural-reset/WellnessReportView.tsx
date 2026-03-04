'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Copy, Check, Lightbulb, AlertCircle, Info } from 'lucide-react'
import type { WeeklyReport, CorrelationInsight } from '@/lib/neural-reset/insights'

const ACTIVITY_LABELS: Record<string, string> = {
  breathing: '호흡 운동',
  somatic: '소마틱 운동',
  meditation: '명상',
  journal: '감사일기',
  sos: 'SOS',
}

const TREND_INFO = {
  improving: { icon: TrendingUp, label: '개선', color: 'text-emerald-600' },
  stable: { icon: Minus, label: '유지', color: 'text-blue-600' },
  declining: { icon: TrendingDown, label: '하향', color: 'text-amber-600' },
  insufficient: { icon: Info, label: '데이터 부족', color: 'text-zinc-400' },
}

interface WellnessReportViewProps {
  weeklyReport: WeeklyReport
  monthlyReport: WeeklyReport
  insights: CorrelationInsight[]
}

export default function WellnessReportView({
  weeklyReport,
  monthlyReport,
  insights,
}: WellnessReportViewProps) {
  const [tab, setTab] = useState<'weekly' | 'monthly'>('weekly')
  const [copied, setCopied] = useState(false)

  const report = tab === 'weekly' ? weeklyReport : monthlyReport
  const trend = TREND_INFO[report.checkinStats.trend]
  const TrendIcon = trend.icon

  const handleCopyReport = () => {
    const text = generateTextReport(report)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-5">
      {/* 기간 탭 */}
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-0.5">
        <button
          onClick={() => setTab('weekly')}
          className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
            tab === 'weekly' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
          }`}
        >
          주간 리포트
        </button>
        <button
          onClick={() => setTab('monthly')}
          className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
            tab === 'monthly' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
          }`}
        >
          월간 리포트
        </button>
      </div>

      {/* 체크인 요약 */}
      <div className="rounded-xl border border-zinc-100 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-700">컨디션 평균</h3>
          <div className={`flex items-center gap-1 text-xs ${trend.color}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trend.label}
          </div>
        </div>

        {report.checkinStats.count > 0 ? (
          <>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <span className="text-3xl font-bold text-zinc-900">
                  {report.checkinStats.avgTotal}
                </span>
                <span className="text-sm text-zinc-400">/20</span>
              </div>
              <div className="flex-1 text-xs text-zinc-500">
                {report.checkinStats.count}일 기록
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: '신체', value: report.checkinStats.avgBody },
                { label: '기분', value: report.checkinStats.avgMood },
                { label: '에너지', value: report.checkinStats.avgEnergy },
                { label: '스트레스', value: report.checkinStats.avgStress },
              ].map((dim) => (
                <div key={dim.label} className="text-center">
                  <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-400"
                      style={{ width: `${(dim.value / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">{dim.label}</p>
                  <p className="text-xs font-medium text-zinc-700">{dim.value}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-400 py-4 text-center">체크인 기록이 없습니다</p>
        )}
      </div>

      {/* 증상 빈도 */}
      {report.topSymptoms.length > 0 && (
        <div className="rounded-xl border border-zinc-100 bg-white p-4 space-y-2">
          <h3 className="text-sm font-medium text-zinc-700">주요 증상</h3>
          <div className="space-y-1.5">
            {report.topSymptoms.map((s) => (
              <div key={s.symptom} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-zinc-600">{s.symptom}</span>
                    <span className="text-zinc-400">{s.count}회</span>
                  </div>
                  <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-300 rounded-full"
                      style={{ width: `${Math.min(100, (s.count / report.checkinStats.count) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 활동 통계 */}
      {report.activityStats.length > 0 && (
        <div className="rounded-xl border border-zinc-100 bg-white p-4 space-y-2">
          <h3 className="text-sm font-medium text-zinc-700">활동 내역</h3>
          <div className="grid grid-cols-2 gap-2">
            {report.activityStats.map((a) => (
              <div key={a.type} className="rounded-lg bg-zinc-50 p-3 text-center">
                <p className="text-xs text-zinc-500">{ACTIVITY_LABELS[a.type] ?? a.type}</p>
                <p className="text-lg font-bold text-zinc-900 mt-0.5">{a.count}회</p>
                {a.totalDuration > 0 && (
                  <p className="text-[10px] text-zinc-400">
                    총 {Math.round(a.totalDuration / 60)}분
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 디스트레스 변화 */}
      {report.distressChange && (
        <div className="rounded-xl border border-zinc-100 bg-white p-4 space-y-2">
          <h3 className="text-sm font-medium text-zinc-700">활동 전후 불편함 변화</h3>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-xs text-zinc-400">활동 전</p>
              <p className="text-2xl font-bold text-zinc-900">{report.distressChange.avgPre}</p>
            </div>
            <span className="text-zinc-300 text-lg">→</span>
            <div className="text-center">
              <p className="text-xs text-zinc-400">활동 후</p>
              <p className="text-2xl font-bold text-zinc-900">{report.distressChange.avgPost}</p>
            </div>
          </div>
          {report.distressChange.avgPre > report.distressChange.avgPost && (
            <p className="text-xs text-emerald-600 text-center">
              평균 {(report.distressChange.avgPre - report.distressChange.avgPost).toFixed(1)}점 감소
            </p>
          )}
        </div>
      )}

      {/* 설문 점수 */}
      {report.surveyScores.length > 0 && (
        <div className="rounded-xl border border-zinc-100 bg-white p-4 space-y-2">
          <h3 className="text-sm font-medium text-zinc-700">설문 점수</h3>
          <div className="space-y-1.5">
            {report.surveyScores.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">{s.type.toUpperCase()}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900">{s.score}점</span>
                  <span className="text-xs text-zinc-400">{s.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 인사이트 */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-zinc-100 bg-white p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            인사이트
          </h3>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-sm ${
                  insight.type === 'positive'
                    ? 'text-emerald-700'
                    : insight.type === 'neutral'
                    ? 'text-amber-700'
                    : 'text-zinc-500'
                }`}
              >
                {insight.type === 'positive' ? (
                  <TrendingUp className="h-4 w-4 shrink-0 mt-0.5" />
                ) : insight.type === 'info' ? (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                )}
                <p className="text-xs leading-relaxed">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 진료 시 보여주기 */}
      <button
        onClick={handleCopyReport}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-500" />
            복사 완료
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            진료 시 보여주기 (텍스트 복사)
          </>
        )}
      </button>

      <p className="text-xs text-zinc-400 text-center">
        본 기능은 전문 의료인의 진단을 대체하지 않습니다.
      </p>
    </div>
  )
}

function generateTextReport(report: WeeklyReport): string {
  const lines: string[] = [
    `[오상케어 웰니스 리포트]`,
    `기간: ${report.period.start} ~ ${report.period.end}`,
    ``,
    `[컨디션 평균] ${report.checkinStats.avgTotal}/20 (${report.checkinStats.count}일 기록)`,
    `  신체: ${report.checkinStats.avgBody} | 기분: ${report.checkinStats.avgMood} | 에너지: ${report.checkinStats.avgEnergy} | 스트레스: ${report.checkinStats.avgStress}`,
    `  추세: ${TREND_LABELS[report.checkinStats.trend] ?? report.checkinStats.trend}`,
  ]

  if (report.topSymptoms.length > 0) {
    lines.push(``, `[주요 증상]`)
    report.topSymptoms.forEach((s) => lines.push(`  - ${s.symptom}: ${s.count}회`))
  }

  if (report.activityStats.length > 0) {
    lines.push(``, `[활동 내역]`)
    report.activityStats.forEach((a) => {
      lines.push(`  - ${ACTIVITY_LABELS[a.type] ?? a.type}: ${a.count}회 (${Math.round(a.totalDuration / 60)}분)`)
    })
  }

  if (report.distressChange) {
    lines.push(
      ``,
      `[활동 전후 변화] ${report.distressChange.avgPre} → ${report.distressChange.avgPost}`
    )
  }

  if (report.surveyScores.length > 0) {
    lines.push(``, `[설문 점수]`)
    report.surveyScores.forEach((s) => lines.push(`  - ${s.type.toUpperCase()}: ${s.score}점 (${s.date})`))
  }

  return lines.join('\n')
}

const TREND_LABELS: Record<string, string> = {
  improving: '개선',
  stable: '유지',
  declining: '하향',
  insufficient: '데이터 부족',
}
