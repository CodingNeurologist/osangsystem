import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
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

async function requireAdmin(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const service = await createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return null
  return { user, service }
}

// GET /api/admin/music — 모든 트랙 조회 (is_active 무관)
export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (!ctx) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { data, error } = await ctx.service
    .from('music_tracks')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/music — 트랙 생성
export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (!ctx) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }

  const { data, error } = await ctx.service
    .from('music_tracks')
    .insert({ ...parsed.data, created_by: ctx.user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: '생성 실패' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/admin/music — 트랙 수정 (body에 id 포함)
export async function PATCH(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (!ctx) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

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

  const { data, error } = await ctx.service
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
  const ctx = await requireAdmin(request)
  if (!ctx) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })

  const { error } = await ctx.service
    .from('music_tracks')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  return NextResponse.json({ success: true })
}
