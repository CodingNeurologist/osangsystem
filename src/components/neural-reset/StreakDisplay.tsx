'use client'

import { Flame } from 'lucide-react'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  todayActive: boolean
  compact?: boolean
}

export default function StreakDisplay({
  currentStreak,
  longestStreak,
  todayActive,
  compact = false,
}: StreakDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Flame
          className={`h-4 w-4 ${
            todayActive ? 'text-orange-500' : 'text-zinc-300'
          }`}
        />
        <span className={`text-sm font-semibold ${
          currentStreak > 0 ? 'text-zinc-900' : 'text-zinc-400'
        }`}>
          {currentStreak}일
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-white p-4">
      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
        todayActive ? 'bg-orange-50' : 'bg-zinc-50'
      }`}>
        <Flame
          className={`h-6 w-6 ${
            todayActive ? 'text-orange-500' : 'text-zinc-300'
          }`}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-zinc-900">{currentStreak}</span>
          <span className="text-sm text-zinc-500">일 연속</span>
        </div>
        <p className="text-xs text-zinc-400">
          {todayActive ? '오늘 활동 완료' : '오늘 아직 활동 없음'}
          {longestStreak > 0 && ` · 최장 ${longestStreak}일`}
        </p>
      </div>
    </div>
  )
}
