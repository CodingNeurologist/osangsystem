import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserStreak } from '@/types'

/**
 * 오늘 날짜 문자열 (KST 기준, YYYY-MM-DD)
 */
function getTodayKST(): string {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().split('T')[0]
}

/**
 * 두 날짜 간의 일수 차이
 */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * 스트릭 갱신
 * - 오늘 첫 활동이면 스트릭 증가
 * - 어제 활동이 없었으면 (freeze 가능한 경우 freeze 사용, 아니면 리셋)
 */
export async function updateStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStreak | null> {
  const today = getTodayKST()

  // 현재 스트릭 조회
  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    // 첫 활동: 스트릭 생성
    const newStreak: Partial<UserStreak> = {
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
      freeze_available: false,
    }
    const { data } = await supabase
      .from('user_streaks')
      .insert(newStreak)
      .select()
      .single()
    return data
  }

  // 이미 오늘 활동했으면 변경 없음
  if (existing.last_active_date === today) {
    return existing as UserStreak
  }

  const gap = daysBetween(existing.last_active_date || today, today)
  let newCurrent = existing.current_streak

  if (gap === 1) {
    // 연속: 스트릭 +1
    newCurrent = existing.current_streak + 1
  } else if (gap === 2 && existing.freeze_available && !existing.freeze_used_at) {
    // 1일 빠짐 + freeze 가능: freeze 사용
    newCurrent = existing.current_streak + 1
    await supabase
      .from('user_streaks')
      .update({ freeze_used_at: today, freeze_available: false })
      .eq('user_id', userId)
  } else {
    // 스트릭 리셋
    newCurrent = 1
  }

  const newLongest = Math.max(existing.longest_streak, newCurrent)
  // 7일 이상이면 freeze 활성화
  const freezeAvailable = newCurrent >= 7

  const { data } = await supabase
    .from('user_streaks')
    .update({
      current_streak: newCurrent,
      longest_streak: newLongest,
      last_active_date: today,
      freeze_available: freezeAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  return data as UserStreak | null
}

/**
 * 사용자의 현재 스트릭 조회
 */
export async function getStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStreak | null> {
  const { data } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data as UserStreak | null
}
