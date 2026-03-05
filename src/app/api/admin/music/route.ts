import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  source_type: z.enum(['youtube', 'binaural', 'storage']),
  source_url: z.string().url().optional().nullable(),
  binaural_base_hz: z.number().int().min(20).max(20000).optional().nullable(),
  binaural_beat_hz: z.number().int().min(1).max(100).optional().nullable(),
  category: z.string().max(50).default('meditation'),
  sort_order: z.number().int().min(0).default(0),
})

// GET /api/admin/music — 모든 트랙 조회 (is_active 무관)
export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const service = await createServiceClient()
  const { data, error } = await service
    .from('music_tracks')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/music — 트랙 생성
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }

  const service = await createServiceClient()
  const { data, error } = await service
    .from('music_tracks')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: '생성 실패' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/admin/music — 트랙 수정 (body에 id 포함)
export async function PATCH(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const body = await request.json()
  const { id, ...rest } = body

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
  }

  const updateSchema = createSchema.partial()
  const parsed = updateSchema.safeParse(rest)
  if (!parsed.success) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }

  const service = await createServiceClient()
  const { data, error } = await service
    .from('music_tracks')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: '수정 실패' }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/admin/music?id=UUID — 트랙 삭제
export async function DELETE(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })

  const service = await createServiceClient()
  const { error } = await service
    .from('music_tracks')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  return NextResponse.json({ success: true })
}
