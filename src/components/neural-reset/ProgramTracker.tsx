'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronRight, Trophy } from 'lucide-react'
import type { ProgramDefinition } from '@/data/programs'

interface DailyProgress {
  [day: string]: string[] // completed activity types
}

interface Enrollment {
  id: string
  program_id: string
  current_day: number
  status: 'active' | 'completed' | 'abandoned'
  daily_progress: DailyProgress
  started_at: string
  completed_at: string | null
}

interface ProgramTrackerProps {
  program: ProgramDefinition
  enrollment: Enrollment
}

export default function ProgramTracker({ program, enrollment }: ProgramTrackerProps) {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const currentWeek = Math.min(Math.ceil(enrollment.current_day / 7), 4)
    return currentWeek
  })
  const [completing, setCompleting] = useState(false)

  const progress = enrollment.daily_progress ?? {}
  const isCompleted = enrollment.status === 'completed'

  // 전체 진행률
  const completedDays = Object.keys(progress).filter((d) => (progress[d] ?? []).length > 0).length
  const progressPercent = Math.round((completedDays / program.durationDays) * 100)

  const week = program.weeks[selectedWeek - 1]

  const handleCompleteDay = async (day: number, activityTypes: string[]) => {
    setCompleting(true)
    try {
      await fetch('/api/neural-reset/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'progress',
          programId: program.id,
          day,
          completedActivities: activityTypes,
        }),
      })
      // 낙관적 업데이트
      progress[String(day)] = activityTypes
    } catch {
      // 실패 시 무시
    }
    setCompleting(false)
  }

  if (isCompleted) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
          <Trophy className="h-10 w-10 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">프로그램 완료</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {program.name}을(를) 완료했습니다. 수고하셨습니다!
          </p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-white p-4 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">완료 일수</span>
            <span className="font-medium text-zinc-900">{completedDays}일 / {program.durationDays}일</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">시작일</span>
            <span className="text-zinc-700">
              {new Date(enrollment.started_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
          {enrollment.completed_at && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">완료일</span>
              <span className="text-zinc-700">
                {new Date(enrollment.completed_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 진행률 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">{completedDays}일 완료</span>
          <span className="text-zinc-500">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-800 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 주차 탭 */}
      <div className="flex gap-1">
        {program.weeks.map((w) => (
          <button
            key={w.week}
            onClick={() => setSelectedWeek(w.week)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              selectedWeek === w.week
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            {w.week}주차
          </button>
        ))}
      </div>

      {/* 주차 테마 */}
      <div>
        <h3 className="text-sm font-medium text-zinc-700">{week.theme}</h3>
      </div>

      {/* 일별 활동 */}
      <div className="space-y-2">
        {week.days.map((dayData) => {
          const dayProgress = progress[String(dayData.day)] ?? []
          const isDayComplete = dayProgress.length >= dayData.activities.length
          const isCurrent = dayData.day === enrollment.current_day
          const isPast = dayData.day < enrollment.current_day
          const isFuture = dayData.day > enrollment.current_day

          return (
            <div
              key={dayData.day}
              className={`rounded-xl border p-3.5 transition-colors ${
                isDayComplete
                  ? 'border-emerald-100 bg-emerald-50/50'
                  : isCurrent
                  ? 'border-zinc-300 bg-white'
                  : 'border-zinc-100 bg-white'
              } ${isFuture ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isDayComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-zinc-300" />
                  )}
                  <span className={`text-sm font-medium ${isDayComplete ? 'text-emerald-700' : 'text-zinc-700'}`}>
                    {dayData.day}일차
                  </span>
                </div>
                {isCurrent && !isDayComplete && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-white">오늘</span>
                )}
              </div>

              <div className="space-y-1.5 ml-6">
                {dayData.activities.map((act) => {
                  const done = dayProgress.includes(act.type)
                  return (
                    <Link
                      key={act.type}
                      href={act.route as never}
                      className={`flex items-center justify-between py-1 ${isFuture ? 'pointer-events-none' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-emerald-400' : 'bg-zinc-200'}`} />
                        <span className={`text-xs ${done ? 'text-emerald-600 line-through' : 'text-zinc-600'}`}>
                          {act.label}
                        </span>
                      </div>
                      {!done && !isFuture && <ChevronRight className="h-3 w-3 text-zinc-300" />}
                    </Link>
                  )
                })}
              </div>

              {(isCurrent || isPast) && !isDayComplete && (
                <button
                  onClick={() => handleCompleteDay(dayData.day, dayData.activities.map((a) => a.type))}
                  disabled={completing}
                  className="mt-2 ml-6 text-xs text-zinc-500 hover:text-zinc-700 underline underline-offset-2"
                >
                  모두 완료로 표시
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
