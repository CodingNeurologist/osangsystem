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
  type LucideIcon,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
}

interface StressCheckCategoryPageProps {
  category: StressCheckCategory
  checkedItems: Record<string, boolean>
  onToggle: (itemId: string) => void
}

export default function StressCheckCategoryPage({
  category,
  checkedItems,
  onToggle,
}: StressCheckCategoryPageProps) {
  const Icon = ICON_MAP[category.icon] ?? Activity
  const checkedCount = category.items.filter((item) => checkedItems[item.id]).length

  return (
    <div className="space-y-5">
      {/* 카테고리 헤더 */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
          <Icon className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">{category.name}</h2>
        <p className="text-sm text-zinc-500">{category.description}</p>
      </div>

      {/* 체크리스트 */}
      <div className="space-y-2">
        {category.items.map((item) => {
          const isChecked = !!checkedItems[item.id]
          return (
            <label
              key={item.id}
              className={`
                flex items-start gap-3 p-3 rounded-xl cursor-pointer
                transition-all duration-200 border
                min-h-[48px]
                ${isChecked
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-white border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/50'
                }
              `}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggle(item.id)}
                className="mt-0.5 flex-shrink-0"
              />
              <span
                className={`text-base leading-relaxed ${
                  isChecked ? 'text-zinc-900' : 'text-zinc-700'
                }`}
              >
                {item.text}
              </span>
            </label>
          )
        })}
      </div>

      {/* 선택 카운트 */}
      <div className="flex justify-center">
        <Badge
          variant={checkedCount > 0 ? 'default' : 'secondary'}
          className="text-xs"
        >
          {checkedCount > 0 ? `${checkedCount}개 해당` : '해당 없음'}
        </Badge>
      </div>
    </div>
  )
}
