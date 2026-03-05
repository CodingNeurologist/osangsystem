import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const service = await createServiceClient()

  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    { count: totalCheckins },
    { count: weeklyCheckins },
    { count: totalSessions },
    { count: weeklySessions },
    { data: activityBreakdown },
    { data: avgScores },
    { count: activeStreaks },
    { count: programEnrollments },
  ] = await Promise.all([
    // 전체 체크인 수
    service
      .from('daily_checkins')
      .select('*', { count: 'exact', head: true }),
    // 주간 체크인 수
    service
      .from('daily_checkins')
      .select('*', { count: 'exact', head: true })
      .gte('check_date', weekAgo),
    // 전체 세션 수
    service
      .from('reset_sessions')
      .select('*', { count: 'exact', head: true }),
    // 주간 세션 수
    service
      .from('reset_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${weekAgo}T00:00:00+09:00`),
    // 활동 유형별 세션 (최근 30일)
    service
      .from('reset_sessions')
      .select('activity_type')
      .gte('created_at', `${monthAgo}T00:00:00+09:00`),
    // 평균 체크인 점수 (최근 30일) - 개별 식별 불가
    service
      .from('daily_checkins')
      .select('body_score, mood_score, energy_score, stress_score')
      .gte('check_date', monthAgo),
    // 활성 스트릭 사용자 수 (1일+)
    service
      .from('user_streaks')
      .select('*', { count: 'exact', head: true })
      .gte('current_streak', 1),
    // 프로그램 참여자 수
    service
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  // 평균 점수 계산 (익명 집계)
  const scores = avgScores ?? []
  const checkinCount = scores.length
  const avgTotal = checkinCount > 0
    ? Math.round(
        (scores.reduce((s, c) => s + c.body_score + c.mood_score + c.energy_score + c.stress_score, 0) / checkinCount) * 10
      ) / 10
    : 0

  return NextResponse.json({
    summary: {
      totalCheckins: totalCheckins ?? 0,
      weeklyCheckins: weeklyCheckins ?? 0,
      totalSessions: totalSessions ?? 0,
      weeklySessions: weeklySessions ?? 0,
      activeStreaks: activeStreaks ?? 0,
      programEnrollments: programEnrollments ?? 0,
    },
    checkinAverage: {
      count: checkinCount,
      avgTotal,
    },
    // activityBreakdown은 RPC가 없을 경우 null
    activityBreakdown: activityBreakdown ?? null,
  })
}
