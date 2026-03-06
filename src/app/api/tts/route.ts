import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize'
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech'

// 간단한 인메모리 캐시 (같은 텍스트는 재생성하지 않음)
const audioCache = new Map<string, ArrayBuffer>()

async function generateWithGoogle(text: string, apiKey: string): Promise<ArrayBuffer> {
  const res = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: 'ko-KR',
        name: 'ko-KR-Neural2-A', // 한국어 여성 신경망 음성 (따뜻한 톤)
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.95, // 약간 느리게 (차분한 안내 톤)
        pitch: 0.5,         // 약간 높게 (따뜻한 느낌)
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google TTS failed: ${err}`)
  }

  const data = await res.json() as { audioContent: string }
  const binary = atob(data.audioContent)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer as ArrayBuffer
}

async function generateWithOpenAI(text: string, apiKey: string): Promise<ArrayBuffer> {
  const res = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'nova', // 따뜻한 여성 음성
      response_format: 'mp3',
      speed: 0.95,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI TTS failed: ${err}`)
  }

  return await res.arrayBuffer()
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json() as { text: string }

    if (!text || typeof text !== 'string' || text.length > 500) {
      return NextResponse.json(
        { error: '유효하지 않은 텍스트입니다.' },
        { status: 400 }
      )
    }

    // 캐시 확인
    const cacheKey = text.trim()
    const cached = audioCache.get(cacheKey)
    if (cached) {
      return new Response(new Uint8Array(cached), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    // Google Cloud TTS 우선 (한국어 품질 최고)
    const googleKey = process.env.GOOGLE_TTS_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    let audioBuffer: ArrayBuffer

    if (googleKey) {
      audioBuffer = await generateWithGoogle(cacheKey, googleKey)
    } else if (openaiKey) {
      audioBuffer = await generateWithOpenAI(cacheKey, openaiKey)
    } else {
      // TTS API 키가 설정되지 않음 → 클라이언트에서 Web Speech API 폴백
      return NextResponse.json(
        { error: 'TTS API 키가 설정되지 않았습니다.', fallback: true },
        { status: 503 }
      )
    }

    // 캐시 저장 (최대 200개)
    if (audioCache.size > 200) {
      const firstKey = audioCache.keys().next().value
      if (firstKey !== undefined) audioCache.delete(firstKey)
    }
    audioCache.set(cacheKey, audioBuffer)

    return new Response(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { error: 'TTS 생성에 실패했습니다.', fallback: true },
      { status: 500 }
    )
  }
}
