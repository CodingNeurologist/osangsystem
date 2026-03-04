'use client'

import { Dumbbell } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import type { StressCheckLifestyleQuestion } from '@/types'

interface StressCheckLifestylePageProps {
  questions: StressCheckLifestyleQuestion[]
  answers: Record<string, string | number>
  onAnswer: (questionId: string, value: string | number) => void
}

export default function StressCheckLifestylePage({
  questions,
  answers,
  onAnswer,
}: StressCheckLifestylePageProps) {
  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
          <Dumbbell className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">생활습관</h2>
        <p className="text-sm text-zinc-500">생활습관과 관련된 항목을 점검합니다</p>
      </div>

      {/* 질문들 */}
      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="space-y-3">
            <p className="text-sm font-medium text-zinc-900">{q.text}</p>

            {q.type === 'slider' && (
              <div className="space-y-3 px-1">
                <Slider
                  value={[typeof answers[q.id] === 'number' ? (answers[q.id] as number) : 50]}
                  min={q.sliderMin ?? 0}
                  max={q.sliderMax ?? 100}
                  step={1}
                  onValueChange={([v]) => onAnswer(q.id, v)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{q.sliderMin ?? 0}{q.sliderUnit}</span>
                  <span className="text-sm font-semibold text-primary">
                    {typeof answers[q.id] === 'number' ? answers[q.id] : 50}{q.sliderUnit}
                  </span>
                  <span>{q.sliderMax ?? 100}{q.sliderUnit}</span>
                </div>
              </div>
            )}

            {q.type === 'single' && q.options && (
              <div className="space-y-2">
                {q.options.map((option) => {
                  const isSelected = answers[q.id] === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onAnswer(q.id, option)}
                      className={`
                        w-full text-left p-3 rounded-xl text-sm
                        transition-all duration-200 border min-h-[48px]
                        ${isSelected
                          ? 'bg-primary/5 border-primary/30 text-zinc-900'
                          : 'bg-white border-zinc-100 text-zinc-700 hover:border-zinc-200 hover:bg-zinc-50/50'
                        }
                      `}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
