'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Play, ChevronRight } from 'lucide-react'
import type { ProgramDefinition } from '@/data/programs'
import ProgramTracker from './ProgramTracker'

interface Enrollment {
  id: string
  program_id: string
  current_day: number
  status: 'active' | 'completed' | 'abandoned'
  daily_progress: Record<string, string[]>
  started_at: string
  completed_at: string | null
}

interface ProgramListProps {
  programs: ProgramDefinition[]
  enrollments: Enrollment[]
}

export default function ProgramList({ programs, enrollments }: ProgramListProps) {
  const router = useRouter()
  const [activeProgram, setActiveProgram] = useState<string | null>(() => {
    const active = enrollments.find((e) => e.status === 'active')
    return active?.program_id ?? null
  })
  const [enrolling, setEnrolling] = useState(false)

  const handleEnroll = async (programId: string) => {
    setEnrolling(true)
    try {
      await fetch('/api/neural-reset/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll', programId }),
      })
      router.refresh()
      setActiveProgram(programId)
    } catch {
      // 실패 시 무시
    }
    setEnrolling(false)
  }

  // 활성 프로그램이 있으면 트래커 표시
  if (activeProgram) {
    const program = programs.find((p) => p.id === activeProgram)
    const enrollment = enrollments.find((e) => e.program_id === activeProgram)

    if (program && enrollment) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => setActiveProgram(null)}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            ← 목록으로
          </button>
          <ProgramTracker program={program} enrollment={enrollment} />
        </div>
      )
    }
  }

  // 프로그램 목록
  return (
    <div className="space-y-3">
      {programs.map((program) => {
        const enrollment = enrollments.find((e) => e.program_id === program.id)
        const isActive = enrollment?.status === 'active'
        const isCompleted = enrollment?.status === 'completed'
        const completedDays = enrollment
          ? Object.keys(enrollment.daily_progress ?? {}).filter((d) => ((enrollment.daily_progress ?? {})[d] ?? []).length > 0).length
          : 0

        return (
          <div
            key={program.id}
            className="rounded-xl border border-zinc-100 bg-white p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">{program.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{program.description}</p>
                <p className="text-xs text-zinc-400 mt-1">{program.durationDays}일 프로그램</p>
              </div>
            </div>

            {isActive && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{completedDays}일 완료</span>
                  <span>{Math.round((completedDays / program.durationDays) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${(completedDays / program.durationDays) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => setActiveProgram(program.id)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  이어서 하기 <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">완료</span>
                <button
                  onClick={() => setActiveProgram(program.id)}
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                >
                  결과 보기
                </button>
              </div>
            )}

            {!enrollment && (
              <button
                onClick={() => handleEnroll(program.id)}
                disabled={enrolling}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                시작하기
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
