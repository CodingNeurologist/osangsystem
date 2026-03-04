'use client'

import { useMemo } from 'react'

interface MoodEntry {
  date: string // YYYY-MM-DD
  mood: number // 1-5
}

interface MoodCalendarProps {
  entries: MoodEntry[]
  year: number
  month: number // 1-12
}

const MOOD_COLORS: Record<number, string> = {
  1: 'bg-red-200',
  2: 'bg-orange-200',
  3: 'bg-yellow-200',
  4: 'bg-emerald-200',
  5: 'bg-emerald-400',
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😟',
  3: '😐',
  4: '🙂',
  5: '😊',
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export default function MoodCalendar({ entries, year, month }: MoodCalendarProps) {
  const { days, startDay, daysInMonth } = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const startDay = firstDay.getDay()
    const daysInMonth = new Date(year, month, 0).getDate()

    const moodMap = new Map<string, number>()
    entries.forEach((e) => moodMap.set(e.date, e.mood))

    const days: Array<{ day: number; mood: number | null }> = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ day: d, mood: moodMap.get(dateStr) ?? null })
    }

    return { days, startDay, daysInMonth }
  }, [entries, year, month])

  const filledDays = entries.length
  const avgMood = filledDays > 0
    ? entries.reduce((sum, e) => sum + e.mood, 0) / filledDays
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700">
          {year}년 {month}월 무드 캘린더
        </h3>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span>{filledDays}일 기록</span>
          {avgMood > 0 && <span>평균 {avgMood.toFixed(1)}</span>}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-[10px] text-zinc-400 pb-1">
            {name}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: startDay }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {days.map(({ day, mood }) => {
          const today = new Date()
          const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day

          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-colors relative ${
                mood !== null
                  ? `${MOOD_COLORS[mood]}`
                  : 'bg-zinc-50'
              } ${isToday ? 'ring-1 ring-zinc-400' : ''}`}
              title={mood !== null ? `${MOOD_EMOJIS[mood]} (${mood}/5)` : undefined}
            >
              {mood !== null ? (
                <span className="text-sm">{MOOD_EMOJIS[mood]}</span>
              ) : (
                <span className="text-zinc-300">{day}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((m) => (
          <div key={m} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${MOOD_COLORS[m]}`} />
            <span className="text-[10px] text-zinc-400">{MOOD_EMOJIS[m]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
