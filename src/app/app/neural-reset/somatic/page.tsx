'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hand, TreePine, Bed, Heart, Ear, Eye } from 'lucide-react'
import { SOMATIC_EXERCISES } from '@/data/somatic-exercises'
import SomaticGuide from '@/components/neural-reset/SomaticGuide'
import type { SomaticExercise } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  hand: Hand,
  'tree-pine': TreePine,
  bed: Bed,
  heart: Heart,
  ear: Ear,
  eye: Eye,
}

const DIFFICULTY_COLOR: Record<string, string> = {
  '쉬움': 'bg-emerald-50 text-emerald-600',
  '보통': 'bg-amber-50 text-amber-600',
}

export default function SomaticPage() {
  const router = useRouter()
  const [selectedExercise, setSelectedExercise] = useState<SomaticExercise | null>(null)

  const handleComplete = async (exerciseId: string, durationSec: number) => {
    try {
      await fetch('/api/neural-reset/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'somatic',
          activityDetail: { exerciseId },
          durationSec,
        }),
      })
    } catch {
      // 실패해도 UX 차단하지 않음
    }
    router.refresh()
    setSelectedExercise(null)
  }

  if (selectedExercise) {
    return (
      <div className="px-4 py-6 max-w-screen-md mx-auto">
        <SomaticGuide
          exercise={selectedExercise}
          onBack={() => setSelectedExercise(null)}
          onComplete={handleComplete}
        />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">소마틱 운동</h1>
        <p className="text-sm text-zinc-500 mt-1">
          신체를 통해 자율신경계를 안정시키는 운동입니다.
        </p>
      </div>

      <div className="space-y-3">
        {SOMATIC_EXERCISES.map((exercise) => {
          const Icon = ICON_MAP[exercise.icon] ?? Hand
          return (
            <button
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className="w-full rounded-xl border border-zinc-100 bg-white p-4 flex items-start gap-3 hover:bg-zinc-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-5 w-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900">{exercise.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${DIFFICULTY_COLOR[exercise.difficulty] ?? 'bg-zinc-100 text-zinc-500'}`}>
                    {exercise.difficulty}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{exercise.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-zinc-400">{exercise.duration}</span>
                  <span className="text-zinc-200">·</span>
                  <span className="text-xs text-zinc-400">{exercise.effect}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-zinc-400 text-center">
        본 기능은 전문 의료인의 진단을 대체하지 않습니다.
      </p>
    </div>
  )
}
