import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const service = await createServiceClient()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const [
    totalUsers,
    thisMonthUsers,
    lastMonthUsers,
    totalSurveys,
    crisisCount,
    compassTotal,
    compassConverted,
  ] = await Promise.all([
    service.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
    service.from('profiles').select('id', { count: 'exact', head: true })
      .eq('role', 'user').gte('created_at', thisMonthStart),
    service.from('profiles').select('id', { count: 'exact', head: true })
      .eq('role', 'user').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    service.from('survey_responses').select('id', { count: 'exact', head: true }),
    service.from('survey_responses').select('id', { count: 'exact', head: true })
      .eq('crisis_flag', true),
    service.from('anonymous_assessments').select('id', { count: 'exact', head: true }),
    service.from('anonymous_assessments').select('id', { count: 'exact', head: true })
      .eq('converted_to_member', true),
  ])

  const conversionRate =
    (compassTotal.count ?? 0) > 0
      ? Math.round(((compassConverted.count ?? 0) / (compassTotal.count ?? 1)) * 100)
      : 0

  return NextResponse.json({
    total_users: totalUsers.count ?? 0,
    this_month_users: thisMonthUsers.count ?? 0,
    last_month_users: lastMonthUsers.count ?? 0,
    total_surveys: totalSurveys.count ?? 0,
    crisis_count: crisisCount.count ?? 0,
    compass_total: compassTotal.count ?? 0,
    compass_converted: compassConverted.count ?? 0,
    conversion_rate: conversionRate,
  })
}
