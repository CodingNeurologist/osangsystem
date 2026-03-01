import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  target_user_id: z.string().uuid(),
  new_role: z.enum(['user', 'admin', 'super_admin']),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const service = await createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // 슈퍼 관리자만 역할 변경 가능
  if (!profile || profile.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼 관리자만 역할을 변경할 수 있습니다.' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }

  const { target_user_id, new_role } = parsed.data

  // 자기 자신의 역할은 변경 불가
  if (target_user_id === user.id) {
    return NextResponse.json({ error: '자신의 역할은 변경할 수 없습니다.' }, { status: 400 })
  }

  const { error } = await service
    .from('profiles')
    .update({ role: new_role })
    .eq('id', target_user_id)

  if (error) return NextResponse.json({ error: '역할 변경 실패' }, { status: 500 })

  return NextResponse.json({ success: true })
}
