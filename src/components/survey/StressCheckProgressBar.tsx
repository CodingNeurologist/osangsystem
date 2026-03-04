'use client'

import {
  Moon,
  Heart,
  Brain,
  Activity,
  Utensils,
  Droplets,
  Bone,
  Shield,
  Dumbbell,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { StressCheckCategory } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  Moon,
  Heart,
  Brain,
  Activity,
  Utensils,
  Droplets,
  Bone,
  Shield,
  Dumbbell,
}

interface StressCheckProgressBarProps {
  categories: StressCheckCategory[]
  currentPage: number
  totalPages: number
}

export default function StressCheckProgressBar({
  categories,
  currentPage,
  totalPages,
}: StressCheckProgressBarProps) {
  const percent = Math.round(((currentPage + 1) / totalPages) * 100)

  // 카테고리 아이콘 + 라이프스타일 아이콘
  const steps = [
    ...categories.map((c) => ({
      icon: c.icon,
      label: c.name,
    })),
    { icon: 'Dumbbell', label: '생활습관' },
  ]

  return (
    <div className="space-y-3">
      {/* 아이콘 스텝 */}
      <div className="flex items-center justify-between px-1">
        {steps.map((step, i) => {
          const Icon = ICON_MAP[step.icon] ?? Activity
          const isCompleted = i < currentPage
          const isCurrent = i === currentPage

          return (
            <div
              key={step.label}
              className="flex flex-col items-center gap-1"
              title={step.label}
            >
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full
                  transition-all duration-300
                  ${isCurrent
                    ? 'bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/20'
                    : isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-zinc-100 text-zinc-400'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <span
                className={`
                  text-[9px] leading-none max-w-[40px] text-center truncate
                  ${isCurrent ? 'text-primary font-semibold' : 'text-zinc-400'}
                `}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* 프로그레스 바 */}
      <div className="flex items-center gap-3">
        <Progress value={percent} className="h-1.5 flex-1" />
        <span className="text-xs text-zinc-400 tabular-nums w-8 text-right">
          {percent}%
        </span>
      </div>
    </div>
  )
}
