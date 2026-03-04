import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BADGE_DEFINITIONS } from '@/data/badges'
import { Footprints, Flame, Trophy, Wind, BookHeart, Heart, TrendingUp, Award } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: '배지 & 성취 | 오상케어',
  description: '뉴럴리셋 활동으로 획득한 배지를 확인하세요',
}

const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  Flame,
  Trophy,
  Wind,
  BookHeart,
  Heart,
  TrendingUp,
  Award,
}

export default async function BadgesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', user.id)

  const earnedSet = new Set((userBadges ?? []).map((b) => b.badge_id))
  const earnedMap = new Map(
    (userBadges ?? []).map((b) => [b.badge_id, b.earned_at])
  )

  const earnedCount = earnedSet.size
  const totalCount = BADGE_DEFINITIONS.length

  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">배지 & 성취</h1>
        <p className="text-sm text-zinc-500 mt-1">
          꾸준한 활동으로 배지를 모아 보세요
        </p>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white p-4 flex items-center justify-between">
        <span className="text-sm text-zinc-600">획득한 배지</span>
        <span className="text-sm font-medium text-zinc-900">
          {earnedCount} / {totalCount}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BADGE_DEFINITIONS.map((badge) => {
          const earned = earnedSet.has(badge.id)
          const earnedAt = earnedMap.get(badge.id)
          const Icon = ICON_MAP[badge.icon] ?? Award
          return (
            <div
              key={badge.id}
              className={`rounded-xl border p-4 text-center space-y-2 transition-colors ${
                earned
                  ? 'border-zinc-200 bg-white'
                  : 'border-zinc-100 bg-zinc-50 opacity-50'
              }`}
            >
              <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center ${
                earned ? 'bg-amber-50' : 'bg-zinc-100'
              }`}>
                <Icon className={`h-5 w-5 ${earned ? 'text-amber-500' : 'text-zinc-300'}`} />
              </div>
              <p className={`text-sm font-medium ${earned ? 'text-zinc-900' : 'text-zinc-400'}`}>
                {badge.name}
              </p>
              <p className="text-xs text-zinc-400">{badge.description}</p>
              {earned && earnedAt && (
                <p className="text-[10px] text-zinc-300">
                  {new Date(earnedAt).toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                  })} 획득
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
