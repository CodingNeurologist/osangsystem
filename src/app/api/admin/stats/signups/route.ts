import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import type { MonthlySignup } from '@/types'

export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const service = await createServiceClient()

  const { data, error } = await service
    .from('v_monthly_signups')
    .select('*')
    .limit(12)

  if (error) return NextResponse.json({ error: '조회 실패' }, { status: 500 })

  return NextResponse.json(data as MonthlySignup[])
}
