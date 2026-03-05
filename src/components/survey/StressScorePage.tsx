'use client'

import { Gauge } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

interface StressScorePageProps {
  value: number | null
  onChange: (value: number) => void
}

function getScoreColor(value: number): string {
  if (value <= 25) return 'text-green-600'
  if (value <= 50) return 'text-amber-600'
  if (value <= 75) return 'text-orange-600'
  return 'text-red-600'
}

function getScoreLabel(value: number): string {
  if (value <= 15) return '거의 없음'
  if (value <= 30) return '가벼운 편'
  if (value <= 50) return '보통'
  if (value <= 70) return '상당히 높음'
  if (value <= 85) return '매우 높음'
  return '극심함'
}

function getBarGradient(value: number): string {
  if (value <= 25) return 'from-green-400 to-green-500'
  if (value <= 50) return 'from-amber-400 to-amber-500'
  if (value <= 75) return 'from-orange-400 to-orange-500'
  return 'from-red-400 to-red-500'
}

export default function StressScorePage({ value, onChange }: StressScorePageProps) {
  const displayValue = value ?? 50
  const hasInteracted = value !== null

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
          <Gauge className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">스트레스 주관 점수</h2>
        <p className="text-sm text-zinc-500">
          최근 느끼는 스트레스 정도를 바를 움직여 표시해 주세요
        </p>
      </div>

      {/* 점수 표시 */}
      <div className="text-center py-4">
        <div className={`text-5xl font-semibold transition-colors ${hasInteracted ? getScoreColor(displayValue) : 'text-zinc-300'}`}>
          {hasInteracted ? displayValue : '?'}
        </div>
        <p className="text-sm mt-2 text-zinc-500">
          {hasInteracted ? (
            <span className={getScoreColor(displayValue)}>
              {getScoreLabel(displayValue)}
            </span>
          ) : (
            '바를 움직여 점수를 선택하세요'
          )}
        </p>
      </div>

      {/* 슬라이더 바 */}
      <div className="space-y-4 px-2">
        {/* 시각적 바 */}
        <div className="relative h-3 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-all duration-200 ${
              hasInteracted ? getBarGradient(displayValue) : 'from-zinc-200 to-zinc-300'
            }`}
            style={{ width: `${displayValue}%` }}
          />
        </div>

        {/* 실제 슬라이더 */}
        <Slider
          value={[displayValue]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) => onChange(v)}
          className="w-full"
        />

        {/* 눈금 라벨 */}
        <div className="flex justify-between text-xs text-zinc-400">
          <span>0점</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100점</span>
        </div>

        {/* 가이드 텍스트 */}
        <div className="flex justify-between text-[10px] text-zinc-300">
          <span>스트레스 없음</span>
          <span>극심한 스트레스</span>
        </div>
      </div>
    </div>
  )
}
