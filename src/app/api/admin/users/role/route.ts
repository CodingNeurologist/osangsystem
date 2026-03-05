import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { z } from 'zod'

const schema = z.object({
  target_user_id: z.string().uuid(),
  new_role: z.enum(['user', 'admin', 'super_admin']),
})

export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }

  const { target_user_id, new_role } = parsed.data

  const service = await createServiceClient()
  const { error } = await service
    .from('profiles')
    .update({ role: new_role })
    .eq('id', target_user_id)

  if (error) return NextResponse.json({ error: '역할 변경 실패' }, { status: 500 })

  return NextResponse.json({ success: true })
}
