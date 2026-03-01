import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { AgeGroupSymptoms } from '@/types'

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

  const [ageData, genderData] = await Promise.all([
    service.from('v_age_group_symptoms').select('*'),
    service
      .from('survey_responses')
      .select('survey_type, total_score, profiles!inner(gender)')
      .not('profiles.gender', 'is', null)
      .limit(0), // count only — 실제로는 집계 뷰를 사용
  ])

  if (ageData.error) return NextResponse.json({ error: '조회 실패' }, { status: 500 })

  return NextResponse.json({ age_groups: ageData.data as AgeGroupSymptoms[] })
}
