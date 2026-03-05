import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import type { AgeGroupSymptoms } from '@/types'

export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const service = await createServiceClient()

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
