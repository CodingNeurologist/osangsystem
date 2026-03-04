import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const requestSchema = z.object({
  url: z.string().url(),
})

interface OEmbedResponse {
  title?: string
  author_name?: string
  author_url?: string
  thumbnail_url?: string
  type?: string
  provider_name?: string
}

async function requireAdmin(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)

    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null
    }

    if (
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'm.youtube.com'
    ) {
      const v = parsed.searchParams.get('v')
      if (v) return v

      const match = parsed.pathname.match(/^\/(embed|shorts)\/([a-zA-Z0-9_-]+)/)
      if (match) return match[2]
    }

    return null
  } catch {
    return null
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\\n/g, '\n')
}

// POST /api/admin/youtube-metadata
export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request)
  if (!ctx) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: '올바른 URL을 입력하세요.' },
      { status: 400 },
    )
  }

  const videoId = extractVideoId(parsed.data.url)
  if (!videoId) {
    return NextResponse.json(
      { error: '유효한 YouTube URL이 아닙니다. 개별 영상 URL을 입력하세요.' },
      { status: 400 },
    )
  }

  // oEmbed API로 제목, 채널명, 썸네일 가져오기
  let oembedData: OEmbedResponse = {}
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.data.url)}&format=json`
    const oembedRes = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(5000),
    })

    if (!oembedRes.ok) {
      return NextResponse.json(
        { error: '영상을 찾을 수 없습니다. URL을 확인해 주세요.' },
        { status: 502 },
      )
    }

    oembedData = (await oembedRes.json()) as OEmbedResponse
  } catch {
    return NextResponse.json(
      { error: 'YouTube 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 502 },
    )
  }

  // YouTube 페이지에서 og:description 추출
  let description = ''
  try {
    const pageRes = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OsangCareBot/1.0)',
          'Accept-Language': 'ko-KR,ko;q=0.9',
        },
        signal: AbortSignal.timeout(5000),
      },
    )

    if (pageRes.ok) {
      const html = await pageRes.text()
      const ogDescMatch = html.match(
        /<meta\s+property="og:description"\s+content="([^"]*)"/,
      )
      if (ogDescMatch) {
        description = decodeHtmlEntities(ogDescMatch[1])
      }
    }
  } catch {
    // og:description 실패는 무시 — oEmbed 데이터만으로 충분
  }

  return NextResponse.json({
    success: true,
    data: {
      title: oembedData.title ?? '',
      author: oembedData.author_name ?? '',
      description,
      thumbnail: oembedData.thumbnail_url ?? null,
    },
  })
}
