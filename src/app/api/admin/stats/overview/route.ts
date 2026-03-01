import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const service = await createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

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
