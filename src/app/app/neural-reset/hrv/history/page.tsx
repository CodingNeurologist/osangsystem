'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, Activity, TrendingUp, AlertTriangle, MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
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
  ReferenceLine,
} from 'recharts'
import type { HRVMeasurement } from '@/types'

type FilterMode = 'all' | 'anomaly'

export default function HRVHistoryPage() {
  const [measurements, setMeasurements] = useState<HRVMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filter === 'anomaly') params.set('anomaly', 'true')

      const res = await fetch(`/api/neural-reset/hrv?${params}`)
      if (res.ok) {
        const json = await res.json()
        setMeasurements(json.measurements ?? [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  // 차트 데이터 (시간순 정렬)
  const chartData = [...measurements]
    .reverse()
    .map(m => ({
      date: formatDate(m.created_at),
      rmssd: Math.round(m.rmssd),
      sdnn: Math.round(m.sdnn),
      hr: Math.round(m.mean_hr),
      isAnomaly: m.is_anomaly,
    }))

  const handleSaveNote = async (id: string) => {
    setSavingNote(true)
    try {
      const res = await fetch(`/api/neural-reset/hrv/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_note: noteText }),
      })
      if (res.ok) {
        setMeasurements(prev =>
          prev.map(m => m.id === id ? { ...m, user_note: noteText } : m)
        )
        setEditingNoteId(null)
      }
    } catch {
      // ignore
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/app/neural-reset/hrv">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">HRV 측정 이력</h1>
          <p className="text-xs text-zinc-500">측정 기록과 변화 추이를 확인하세요</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      ) : measurements.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Heart className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-sm text-zinc-500">아직 측정 기록이 없습니다</p>
          <Link href="/app/neural-reset/hrv">
            <Button size="sm">첫 측정 하기</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* 추세 차트: RMSSD */}
          {chartData.length >= 2 && (
            <div className="p-4 rounded-xl bg-white border border-zinc-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-700">RMSSD 변화 추이</p>
                <Badge variant="outline" className="text-xs text-zinc-500">부교감신경 지표</Badge>
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} width={35} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
                      formatter={(v: number, name: string) => {
                        const labels: Record<string, string> = { rmssd: 'RMSSD', sdnn: 'SDNN', hr: '심박수' }
                        return [`${v}${name === 'hr' ? ' BPM' : ' ms'}`, labels[name] ?? name]
                      }}
                    />
                    <ReferenceLine y={40} stroke="#10b981" strokeDasharray="5 5" label={{ value: '양호 기준', fontSize: 10, fill: '#10b981' }} />
                    <Line type="monotone" dataKey="rmssd" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 추세 차트: SDNN + HR */}
          {chartData.length >= 2 && (
            <div className="p-4 rounded-xl bg-white border border-zinc-100 shadow-sm space-y-3">
              <p className="text-sm font-medium text-zinc-700">SDNN / 심박수 추이</p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#a1a1aa' }} width={35} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#a1a1aa' }} width={35} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
                      formatter={(v: number, name: string) => {
                        const labels: Record<string, string> = { sdnn: 'SDNN', hr: '심박수' }
                        return [`${v}${name === 'hr' ? ' BPM' : ' ms'}`, labels[name] ?? name]
                      }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="sdnn" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="hr" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-indigo-500 inline-block" /> SDNN (ms)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-amber-500 inline-block" /> 심박수 (BPM)
                </span>
              </div>
            </div>
          )}

          {/* 필터 */}
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              전체 ({measurements.length})
            </Button>
            <Button
              variant={filter === 'anomaly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('anomaly')}
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              급변 기록
            </Button>
          </div>

          {/* 측정 기록 목록 */}
          <div className="space-y-3">
            {measurements.map(m => (
              <div
                key={m.id}
                className={`rounded-xl border bg-white shadow-sm overflow-hidden ${
                  m.is_anomaly ? 'border-amber-200' : 'border-zinc-100'
                }`}
              >
                {/* 요약 행 */}
                <button
                  className="w-full p-4 text-left flex items-center justify-between"
                  onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">{formatDateTime(m.created_at)}</span>
                      {m.is_anomaly && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">급변</Badge>
                      )}
                      {m.arrhythmia_burden !== 'normal' && (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                          이소성 {m.ectopic_count}회
                        </Badge>
                      )}
                      <LevelBadge level={m.interpretation_level} />
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-400" />
                        <span className="font-medium text-zinc-900 tabular-nums">{Math.round(m.mean_hr)}</span>
                        <span className="text-xs text-zinc-400">BPM</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-indigo-400" />
                        <span className="font-medium text-zinc-900 tabular-nums">{Math.round(m.rmssd)}</span>
                        <span className="text-xs text-zinc-400">ms</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="font-medium text-zinc-900 tabular-nums">{Math.round(m.sdnn)}</span>
                        <span className="text-xs text-zinc-400">ms</span>
                      </span>
                    </div>
                  </div>
                  {expandedId === m.id ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>

                {/* 상세 정보 (확장) */}
                {expandedId === m.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-zinc-50">
                    {/* 상세 지표 */}
                    <div className="grid grid-cols-3 gap-2 pt-3">
                      <MiniMetric label="pNN50" value={`${m.pnn50}%`} />
                      <MiniMetric label="유효 비트" value={`${m.valid_beat_count}개`} />
                      <MiniMetric label="신뢰도" value={m.confidence_label} />
                      <MiniMetric label="측정 시간" value={`${Math.round(m.measurement_duration)}초`} />
                      <MiniMetric label="HR 범위" value={`${m.min_hr}-${m.max_hr}`} />
                      <MiniMetric label="NN 인터벌" value={`${m.nn_count}개`} />
                    </div>

                    {/* 이소성 박동 정보 */}
                    {m.ectopic_count > 0 && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 space-y-1">
                        <p className="text-xs font-medium text-amber-700">
                          이소성 박동 감지: {m.ectopic_count}회 (전체의 {Math.round(m.ectopic_ratio * 100)}%)
                        </p>
                        <p className="text-xs text-amber-600 leading-relaxed">
                          {m.arrhythmia_burden === 'excessive'
                            ? '비정상 리듬이 다수 감지되어 정확한 HRV 분석이 어려운 측정입니다. 반복적으로 나타나는 경우 전문의 상담을 고려해 보세요.'
                            : '일부 비정상 박동이 감지되었으나 정상 리듬 구간으로 HRV를 분석하였습니다. 이소성 박동은 카페인, 수면 부족, 스트레스 등으로도 일시적으로 나타날 수 있습니다.'
                          }
                        </p>
                      </div>
                    )}

                    {/* 급변 사유 */}
                    {m.is_anomaly && m.anomaly_reason && (
                      <div className="p-3 rounded-lg bg-sky-50 border border-sky-100">
                        <p className="text-xs font-medium text-sky-700">급변 감지 사유</p>
                        <p className="text-xs text-sky-600 mt-0.5">{m.anomaly_reason}</p>
                      </div>
                    )}

                    {/* 사용자 메모 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-zinc-400" />
                        <span className="text-xs text-zinc-500">메모</span>
                      </div>
                      {editingNoteId === m.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="w-full text-sm border border-zinc-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-300"
                            rows={3}
                            maxLength={500}
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="이 시점에 특이사항이 있었나요? (카페인, 수면, 스트레스, 운동 등)"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveNote(m.id)}
                              disabled={savingNote}
                            >
                              {savingNote ? '저장 중...' : '저장'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNoteId(null)}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="w-full text-left p-2 rounded-lg border border-dashed border-zinc-200 text-xs text-zinc-400 hover:bg-zinc-50 transition-colors"
                          onClick={() => {
                            setEditingNoteId(m.id)
                            setNoteText(m.user_note ?? '')
                          }}
                        >
                          {m.user_note || '메모를 추가하려면 탭하세요'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 면책 고지 */}
          <p className="text-xs text-zinc-400 text-center leading-relaxed">
            본 기능은 의료기기가 아니며, 전문 의료인의 진단을 대체하지 않습니다.
            <br />
            이소성 박동 정보는 참고용이며, 부정맥 진단은 전문의와 심전도 검사를 통해 확인하세요.
          </p>
        </>
      )}
    </div>
  )
}

// ── 헬퍼 컴포넌트 ──────────────────────────────

function LevelBadge({ level }: { level: string }) {
  const config = {
    good: { label: '양호', className: 'text-emerald-600 border-emerald-300' },
    normal: { label: '보통', className: 'text-amber-600 border-amber-300' },
    low: { label: '낮음', className: 'text-red-600 border-red-300' },
  }[level] ?? { label: level, className: 'text-zinc-600 border-zinc-300' }

  return <Badge variant="outline" className={`text-xs ${config.className}`}>{config.label}</Badge>
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-zinc-50">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-medium text-zinc-900 tabular-nums">{value}</p>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${month}/${day} ${hour}:${min}`
}
