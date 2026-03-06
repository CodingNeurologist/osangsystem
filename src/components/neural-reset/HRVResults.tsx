'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Heart, Activity, TrendingUp, Wind, ArrowLeft, RotateCcw, AlertTriangle, ShieldAlert, History, Zap } from 'lucide-react'
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
  const { timeDomain, confidenceLabel, interpretation, rrIntervals, arrhythmia } = result

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

  // 전체 RR (유효+무효) 타코그램 — 이소성 박동 시각화용
  const fullTachogramData = useMemo(() => {
    if (arrhythmia.ectopicCount === 0) return null
    const startTime = rrIntervals.length > 0 ? rrIntervals[0].timestamp : 0
    return rrIntervals.map((rr, i) => ({
      index: i + 1,
      time: Math.round((rr.timestamp - startTime) / 1000),
      valid: rr.isValid ? Math.round(rr.interval) : null,
      ectopic: !rr.isValid ? Math.round(rr.interval) : null,
    }))
  }, [rrIntervals, arrhythmia.ectopicCount])

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

  // 부정맥으로 HRV 측정 불가인 경우
  if (arrhythmia.burden === 'excessive') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">측정 결과</h2>
          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">베타</Badge>
        </div>

        {/* 부정맥 경고 카드 */}
        <div className="p-5 rounded-xl border border-red-200 bg-red-50 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-700">
                HRV 측정이 어렵습니다
              </p>
              <p className="text-xs text-red-600 leading-relaxed">
                측정 중 비정상적인 리듬이 다수 감지되었습니다
                (전체 박동의 {Math.round(arrhythmia.ectopicRatio * 100)}%, {arrhythmia.ectopicCount}회).
              </p>
              <p className="text-xs text-red-600 leading-relaxed">
                HRV(심박변이도)는 정상 동성 리듬을 기반으로 분석하는 지표이므로,
                비정상 박동이 많은 경우 정확한 측정이 불가능합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 이소성 박동 상세 */}
        <EctopicBeatInfo arrhythmia={arrhythmia} totalBeats={rrIntervals.length} />

        {/* 안내 카드 */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-2">
          <p className="text-xs font-medium text-amber-700">참고 안내</p>
          <ul className="text-xs text-amber-600 leading-relaxed space-y-1.5">
            <li>
              비정상 리듬이 반복적으로 감지된다면, 부정맥 여부를 확인하기 위해
              전문의 상담 및 심전도(ECG) 검사를 권장합니다.
            </li>
            <li>
              카페인, 수면 부족, 스트레스 등으로 일시적으로 조기수축이 늘어날 수 있습니다.
              컨디션이 좋을 때 다시 측정해 보세요.
            </li>
            <li>
              손가락 움직임으로 인한 신호 노이즈가 비정상 리듬으로 오인될 수 있습니다.
              손가락을 가만히 유지한 상태에서 재측정해 보세요.
            </li>
          </ul>
        </div>

        {/* 기본 심박수 정보는 표시 */}
        {timeDomain.meanHR > 0 && (
          <div className="p-4 rounded-xl bg-white border border-zinc-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-500">참고 평균 심박수</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-zinc-900 tabular-nums">
                {Math.round(timeDomain.meanHR)}
              </span>
              <span className="text-xs text-zinc-400">BPM</span>
              <span className="text-xs text-zinc-400 ml-2">
                ({timeDomain.minHR}~{timeDomain.maxHR})
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              정상 리듬 구간 {result.validBeatCount}개 비트 기준
            </p>
          </div>
        )}

        {/* 면책 고지 */}
        <p className="text-xs text-zinc-400 text-center leading-relaxed">
          본 기능은 의료기기가 아니며, 부정맥 진단 도구가 아닙니다.
          <br />
          정확한 진단은 반드시 전문의와 심전도 검사를 통해 확인하세요.
        </p>

        {/* 하단 액션 */}
        <div className="flex gap-3">
          <Link href="/app/neural-reset/hrv/history" className="flex-1">
            <Button variant="outline" className="w-full">
              <History className="w-4 h-4 mr-1" />
              측정 이력
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

      {/* 부정맥 borderline 경고 */}
      {arrhythmia.burden === 'borderline' && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-700">
                비정상 박동 일부 감지 ({arrhythmia.ectopicCount}회, 전체의 {Math.round(arrhythmia.ectopicRatio * 100)}%)
              </p>
              <p className="text-xs text-amber-600 leading-relaxed">
                {arrhythmia.message}
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* 이소성 박동 정보 (감지된 경우) */}
      {arrhythmia.ectopicCount > 0 && (
        <EctopicBeatInfo arrhythmia={arrhythmia} totalBeats={rrIntervals.length} />
      )}

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

      {/* RR 타코그램 — 이소성 있으면 전체 표시, 없으면 유효만 */}
      {arrhythmia.ectopicCount > 0 && fullTachogramData && fullTachogramData.length > 5 ? (
        <div className="p-4 rounded-xl bg-white border border-zinc-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-700">RR 인터벌 변화</p>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 정상
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> 제외됨
              </span>
            </div>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fullTachogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#a1a1aa' }}
                  tickFormatter={(v: number) => `${v}s`}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#a1a1aa' }}
                  domain={['auto', 'auto']}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'valid') return [`${value}ms`, '정상 RR']
                    if (name === 'ectopic') return [`${value}ms`, '제외된 RR']
                    return [value, name]
                  }}
                  labelFormatter={(label: number) => `${label}초`}
                />
                <Line type="monotone" dataKey="valid" stroke="#10b981" strokeWidth={1.5} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="ectopic" stroke="#f87171" strokeWidth={1} dot={{ r: 3, fill: '#f87171' }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-400 text-center">
            빨간 점은 이소성 박동 등으로 HRV 분석에서 제외된 구간입니다
          </p>
        </div>
      ) : tachogramData.length > 5 && (
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
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'interval') return [`${value}ms`, 'RR 인터벌']
                    return [value, name]
                  }}
                  labelFormatter={(label: number) => `${label}초`}
                />
                <Line type="monotone" dataKey="interval" stroke="#ef4444" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
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
        <Link href="/app/neural-reset/hrv/history" className="flex-1">
          <Button variant="outline" className="w-full">
            <History className="w-4 h-4 mr-1" />
            측정 이력
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

// ── 이소성 박동 정보 카드 ──────────────────────────

function EctopicBeatInfo({
  arrhythmia,
  totalBeats,
}: {
  arrhythmia: HRVResult['arrhythmia']
  totalBeats: number
}) {
  return (
    <div className="p-4 rounded-xl bg-white border border-zinc-100 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <p className="text-sm font-medium text-zinc-700">이소성 박동 정보</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg bg-zinc-50">
          <p className="text-xs text-zinc-400">감지 횟수</p>
          <p className="text-lg font-semibold text-zinc-900 tabular-nums">{arrhythmia.ectopicCount}회</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-zinc-50">
          <p className="text-xs text-zinc-400">전체 비율</p>
          <p className="text-lg font-semibold text-zinc-900 tabular-nums">{Math.round(arrhythmia.ectopicRatio * 100)}%</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-zinc-50">
          <p className="text-xs text-zinc-400">전체 박동</p>
          <p className="text-lg font-semibold text-zinc-900 tabular-nums">{totalBeats}회</p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-zinc-50 space-y-1.5">
        <p className="text-xs text-zinc-600 leading-relaxed">
          이소성 박동(조기수축)은 정상인에게서도 흔히 나타날 수 있습니다.
          카페인 섭취, 수면 부족, 스트레스, 과로 등이 일시적인 원인이 될 수 있습니다.
        </p>
        {arrhythmia.ectopicRatio >= 0.05 && (
          <p className="text-xs text-amber-600 leading-relaxed">
            다만 비정상 박동이 반복적으로 일정 비율 이상 감지되는 경우,
            전문의 상담 및 심전도(ECG) 검사를 통해 확인해 보시는 것을 권장합니다.
          </p>
        )}
        <p className="text-xs text-zinc-400 leading-relaxed">
          본 측정은 의료용 진단이 아닌 참고 목적의 정보이며,
          정확한 부정맥 진단은 심전도 검사를 통해서만 가능합니다.
        </p>
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
