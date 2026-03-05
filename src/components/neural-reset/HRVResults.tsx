'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Heart, Activity, TrendingUp, Wind, ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { HRVResult } from '@/lib/ppg/types'

interface HRVResultsProps {
  result: HRVResult
  onRetry: () => void
}

export default function HRVResults({ result, onRetry }: HRVResultsProps) {
  const { timeDomain, confidenceScore, confidenceLabel, interpretation, rrIntervals } = result

  // RR 타코그램 데이터
  const tachogramData = useMemo(() => {
    const valid = rrIntervals.filter(r => r.isValid)
    const startTime = valid.length > 0 ? valid[0].timestamp : 0
    return valid.map((rr, i) => ({
      index: i + 1,
      time: Math.round((rr.timestamp - startTime) / 1000),
      interval: Math.round(rr.interval),
      bpm: Math.round(60000 / rr.interval),
    }))
  }, [rrIntervals])

  const levelColor = {
    good: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    normal: 'text-amber-600 bg-amber-50 border-amber-200',
    low: 'text-red-600 bg-red-50 border-red-200',
  }[interpretation.level]

  const confidenceColor = {
    '높음': 'text-emerald-600 border-emerald-300',
    '보통': 'text-amber-600 border-amber-300',
    '낮음': 'text-red-600 border-red-300',
  }[confidenceLabel]

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">측정 결과</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">베타</Badge>
          <Badge variant="outline" className={`text-xs ${confidenceColor}`}>
            신뢰도: {confidenceLabel}
          </Badge>
        </div>
      </div>

      {/* 해석 카드 */}
      <div className={`p-4 rounded-xl border ${levelColor}`}>
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">{interpretation.title}</p>
            <p className="text-xs leading-relaxed opacity-80">{interpretation.description}</p>
            <p className="text-xs leading-relaxed">{interpretation.suggestion}</p>
          </div>
        </div>
      </div>

      {/* 주요 지표 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Heart}
          label="평균 심박수"
          value={`${Math.round(timeDomain.meanHR)}`}
          unit="BPM"
          sublabel={`${timeDomain.minHR}~${timeDomain.maxHR}`}
        />
        <MetricCard
          icon={Activity}
          label="RMSSD"
          value={`${timeDomain.rmssd}`}
          unit="ms"
          sublabel="부교감 지표"
        />
        <MetricCard
          icon={TrendingUp}
          label="SDNN"
          value={`${timeDomain.sdnn}`}
          unit="ms"
          sublabel="전체 변이도"
        />
        <MetricCard
          icon={Activity}
          label="pNN50"
          value={`${timeDomain.pnn50}`}
          unit="%"
          sublabel={`유효 비트: ${timeDomain.nnCount}개`}
        />
      </div>

      {/* 주파수 영역 (있을 때만) */}
      {result.frequencyDomain && (
        <div className="p-4 rounded-xl bg-white border border-zinc-100 shadow-sm space-y-2">
          <p className="text-sm font-medium text-zinc-700">주파수 분석</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-zinc-500">LF 파워</p>
              <p className="text-sm font-medium text-zinc-900 tabular-nums">{result.frequencyDomain.lfPower}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">HF 파워</p>
              <p className="text-sm font-medium text-zinc-900 tabular-nums">{result.frequencyDomain.hfPower}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">LF/HF</p>
              <p className="text-sm font-medium text-zinc-900 tabular-nums">{result.frequencyDomain.lfHfRatio}</p>
            </div>
          </div>
        </div>
      )}

      {/* RR 타코그램 */}
      {tachogramData.length > 5 && (
        <div className="p-4 rounded-xl bg-white border border-zinc-100 shadow-sm space-y-3">
          <p className="text-sm font-medium text-zinc-700">RR 인터벌 변화</p>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tachogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#a1a1aa' }}
                  tickFormatter={(v: number) => `${v}s`}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#a1a1aa' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(v: number) => `${v}`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'interval') return [`${value}ms`, 'RR 인터벌']
                    return [value, name]
                  }}
                  labelFormatter={(label: number) => `${label}초`}
                />
                <Line
                  type="monotone"
                  dataKey="interval"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-400 text-center">시간(초) / RR 인터벌(ms)</p>
        </div>
      )}

      {/* 추천 활동 */}
      {interpretation.level !== 'good' && (
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
          <div className="flex items-start gap-3">
            <Wind className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm text-sky-700">호흡 운동으로 HRV를 높여보세요</p>
              <Link href="/app/neural-reset/breathing">
                <Button variant="outline" size="sm" className="text-sky-600 border-sky-200 hover:bg-sky-100">
                  호흡 운동 하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 면책 고지 */}
      <p className="text-xs text-zinc-400 text-center leading-relaxed">
        본 기능은 의료기기가 아니며, 전문 의료인의 진단을 대체하지 않습니다.
        <br />
        참고용으로만 사용하시고, 건강 관련 결정은 전문의와 상담하세요.
      </p>

      {/* 하단 액션 */}
      <div className="flex gap-3">
        <Link href="/app/neural-reset" className="flex-1">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-1" />
            뉴럴리셋
          </Button>
        </Link>
        <Button onClick={onRetry} className="flex-1">
          <RotateCcw className="w-4 h-4 mr-1" />
          다시 측정
        </Button>
      </div>
    </div>
  )
}

// ── 지표 카드 ────────────────────────────────────────

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  unit: string
  sublabel: string
}

function MetricCard({ icon: Icon, label, value, unit, sublabel }: MetricCardProps) {
  return (
    <div className="p-3 rounded-xl bg-white border border-zinc-100 shadow-sm space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-zinc-400" />
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold text-zinc-900 tabular-nums">{value}</span>
        <span className="text-xs text-zinc-400">{unit}</span>
      </div>
      <p className="text-xs text-zinc-400">{sublabel}</p>
    </div>
  )
}
