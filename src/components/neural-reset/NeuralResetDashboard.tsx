'use client'

import Link from 'next/link'
import { Wind, Music, BookOpen, ClipboardCheck, Award, AlertTriangle, Phone, ChevronRight, Heart, Activity, Settings, BarChart3, Calendar, HeartPulse } from 'lucide-react'
import type { DailyCheckin } from '@/types'
import StreakDisplay from './StreakDisplay'
import MoodCalendar from './MoodCalendar'
import { getRecommendations, getCheckinSeverity, getCheckinSeverityLabel, getCheckinSeverityColor } from '@/lib/neural-reset/recommendations'

/** 핵심 도구 — 자주 사용하는 활동 */
const CORE_TOOLS = [
  {
    href: '/app/neural-reset/breathing',
    icon: Wind,
    label: '호흡',
    desc: '호흡 가이드',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    href: '/app/neural-reset/somatic',
    icon: Activity,
    label: '소마틱',
    desc: '신체 운동',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    href: '/app/neural-reset/music',
    icon: Music,
    label: '명상음악',
    desc: '음악 치유',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    href: '/app/neural-reset/journal',
    icon: BookOpen,
    label: '감사일기',
    desc: '마음 기록',
    color: 'bg-amber-50 text-amber-600',
  },
]

/** 부가 도구 — 측정/추적 */
const SUB_TOOLS = [
  {
    href: '/app/neural-reset/hrv',
    icon: HeartPulse,
    label: 'HRV 측정',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    href: '/app/neural-reset/program',
    icon: Calendar,
    label: '프로그램',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    href: '/app/neural-reset/report',
    icon: BarChart3,
    label: '리포트',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    href: '/app/neural-reset/badges',
    icon: Award,
    label: '배지',
    color: 'bg-pink-50 text-pink-500',
  },
]

interface MoodEntry {
  date: string
  mood: number
}

interface NeuralResetDashboardProps {
  todayCheckin: DailyCheckin | null
  recentCheckins: DailyCheckin[]
  streak: { current_streak: number; longest_streak: number }
  todayActive: boolean
  todayActivityTypes: string[]
  badgeCount: number
  moodEntries: MoodEntry[]
}

export default function NeuralResetDashboard({
  todayCheckin,
  recentCheckins,
  streak,
  todayActive,
  todayActivityTypes,
  badgeCount,
  moodEntries,
}: NeuralResetDashboardProps) {
  const totalScore = todayCheckin
    ? todayCheckin.body_score + todayCheckin.mood_score + todayCheckin.energy_score + todayCheckin.stress_score
    : 0
  const severity = todayCheckin ? getCheckinSeverity(totalScore) : null
  const recommendations = todayCheckin
    ? getRecommendations(totalScore, todayActivityTypes)
    : getRecommendations(12) // 기본 추천

  const isCrisis = severity === 'crisis'

  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">뉴럴리셋</h1>
          <p className="text-sm text-zinc-500">자율신경 안정화를 위한 매일의 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <StreakDisplay
            currentStreak={streak.current_streak}
            longestStreak={streak.longest_streak}
            todayActive={todayActive}
            compact
          />
          <Link href="/app/neural-reset/settings" className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
            <Settings className="h-4 w-4 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* 위기 알림 — 체크인 점수 crisis일 때만 */}
      {isCrisis && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold text-sm">지금 힘든 상황이시라면</span>
          </div>
          <p className="text-sm text-red-600">
            전문 상담이 도움이 될 수 있습니다. 혼자 감당하지 않아도 됩니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="tel:1577-0199"
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white"
            >
              <Phone className="h-3.5 w-3.5" />
              위기상담 1577-0199
            </a>
            <a
              href="tel:1599-5453"
              className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs text-red-700"
            >
              <Phone className="h-3.5 w-3.5" />
              오상신경외과 1599-5453
            </a>
          </div>
        </div>
      )}

      {/* 오늘의 컨디션 체크인 */}
      {todayCheckin ? (
        <div className="rounded-xl border border-zinc-100 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700">오늘의 컨디션</span>
            {severity && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCheckinSeverityColor(severity)}`}>
                {getCheckinSeverityLabel(severity)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-2xl font-bold text-zinc-900">{totalScore}</span>
              <span className="text-sm text-zinc-400">/20</span>
            </div>
            <div className="flex-1 grid grid-cols-4 gap-2">
              {[
                { label: '신체', score: todayCheckin.body_score },
                { label: '기분', score: todayCheckin.mood_score },
                { label: '에너지', score: todayCheckin.energy_score },
                { label: '스트레스', score: todayCheckin.stress_score },
              ].map((dim) => (
                <div key={dim.label} className="text-center">
                  <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-400 transition-all"
                      style={{ width: `${(dim.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">{dim.label}</span>
                </div>
              ))}
            </div>
          </div>
          {recentCheckins.length > 1 && (
            <div className="flex items-end gap-1 pt-1">
              {recentCheckins.map((c) => {
                const t = c.body_score + c.mood_score + c.energy_score + c.stress_score
                const height = Math.max(8, (t / 20) * 32)
                return (
                  <div key={c.check_date} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full max-w-[6px] rounded-full bg-zinc-300"
                      style={{ height: `${height}px` }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <Link href="/app/neural-reset/checkin">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 flex items-center gap-4 hover:bg-zinc-50 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-zinc-900">오늘의 컨디션을 기록해 보세요</p>
              <p className="text-xs text-zinc-500 mt-0.5">1분이면 충분합니다</p>
            </div>
            <ChevronRight className="h-5 w-5 text-zinc-300" />
          </div>
        </Link>
      )}

      {/* 추천 활동 */}
      {recommendations.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-sm font-medium text-zinc-700">추천 활동</h2>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <Link key={rec.route} href={rec.route as never}>
                <div className="rounded-xl border border-zinc-100 bg-white p-3.5 flex items-center gap-3 hover:bg-zinc-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{rec.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{rec.description}</p>
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">{rec.duration}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 핵심 도구 (2x2 카드) */}
      <div className="space-y-2.5">
        <h2 className="text-sm font-medium text-zinc-700">자기 관리 도구</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {CORE_TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.href}
                href={tool.href as never}
                className="rounded-xl border border-zinc-100 bg-white p-4 hover:bg-zinc-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.color} mb-2.5`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-zinc-900">{tool.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{tool.desc}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 부가 도구 (4열 아이콘 그리드) */}
      <div className="grid grid-cols-4 gap-2">
        {SUB_TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.href}
              href={tool.href as never}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-100 bg-white p-3 hover:bg-zinc-50 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tool.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs text-zinc-600">{tool.label}</span>
              {tool.label === '배지' && badgeCount > 0 && (
                <span className="text-[10px] text-zinc-400">{badgeCount}개</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* 마음이 힘들 때 — 따뜻한 톤 */}
      <Link href="/app/neural-reset/sos" className="block">
        <div className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex items-center gap-3 hover:from-amber-100/80 hover:to-orange-100/70 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0">
            <Heart className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">마음이 힘들 때</p>
            <p className="text-xs text-amber-600/70 mt-0.5">잠시 멈추고 안정을 찾을 수 있도록 도와드릴게요</p>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-400 shrink-0" />
        </div>
      </Link>

      {/* 스트릭 + 무드 캘린더 */}
      <div className="space-y-3">
        <StreakDisplay
          currentStreak={streak.current_streak}
          longestStreak={streak.longest_streak}
          todayActive={todayActive}
        />

        {moodEntries.length > 0 && (
          <div className="rounded-xl border border-zinc-100 bg-white p-4">
            <MoodCalendar
              entries={moodEntries}
              year={currentYear}
              month={currentMonth}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400 text-center pb-2">
        본 기능은 전문 의료인의 진단을 대체하지 않습니다.
      </p>
    </div>
  )
}
