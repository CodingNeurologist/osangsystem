'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

/**
 * 한국어 음성 안내 훅.
 *
 * 1순위: 클라우드 TTS (/api/tts) — Google Cloud Neural2 / OpenAI nova
 * 2순위: Web Speech API (브라우저 내장) — 폴백
 *
 * 클라이언트에서 오디오를 캐싱하고, preload()로 미리 로드할 수 있습니다.
 */

// ── Web Speech API 폴백용 음성 선택 ──

const PREFERRED_VOICE_NAMES = ['Yuna', 'Google 한국어', 'Microsoft SunHi']

function pickKoreanFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const preferred of PREFERRED_VOICE_NAMES) {
    const match = voices.find(
      (v) => v.name.includes(preferred) && v.lang.startsWith('ko')
    )
    if (match) return match
  }

  const femaleKeywords = ['female', 'woman', '여성', '여자', 'yuna', 'sunhi', 'heami']
  const koreanVoices = voices.filter((v) => v.lang.startsWith('ko'))
  for (const v of koreanVoices) {
    const nameLower = v.name.toLowerCase()
    if (femaleKeywords.some((kw) => nameLower.includes(kw))) return v
  }

  if (koreanVoices.length > 0) return koreanVoices[0]
  return null
}

// ── 클라이언트 오디오 캐시 ──

const audioCache = new Map<string, string>() // text → objectURL

async function fetchTTSAudio(text: string): Promise<string | null> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) return null

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    audioCache.set(text, url)
    return url
  } catch {
    return null
  }
}

// ── Hook ──

interface UseVoiceGuideOptions {
  enabled?: boolean
}

interface UseVoiceGuideReturn {
  speak: (text: string) => void
  stop: () => void
  preload: (texts: string[]) => void
  isSupported: boolean
  isSpeaking: boolean
  isCloudTTS: boolean
}

export function useVoiceGuide(options: UseVoiceGuideOptions = {}): UseVoiceGuideReturn {
  const { enabled = true } = options
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isCloudTTS, setIsCloudTTS] = useState(false)
  const [cloudAvailable, setCloudAvailable] = useState<boolean | null>(null) // null = 아직 확인 안 됨
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Web Speech API 음성 로드
  useEffect(() => {
    if (!isSupported) return

    function loadVoices() {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        voiceRef.current = pickKoreanFemaleVoice(voices)
      }
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [isSupported])

  // 클라우드 TTS 사용 가능 여부 확인 (최초 1회)
  useEffect(() => {
    if (cloudAvailable !== null) return

    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '준비' }),
    })
      .then((res) => {
        const available = res.ok
        setCloudAvailable(available)
        setIsCloudTTS(available)
      })
      .catch(() => {
        setCloudAvailable(false)
        setIsCloudTTS(false)
      })
  }, [cloudAvailable])

  // 정지
  const stop = useCallback(() => {
    // Cloud TTS 오디오 정지
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    // Web Speech API 정지
    if (isSupported) {
      speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [isSupported])

  // Cloud TTS로 재생
  const playCloudAudio = useCallback(
    async (text: string) => {
      // 캐시 확인
      const cached = audioCache.get(text)
      const url = cached ?? await fetchTTSAudio(text)

      if (!url) return false

      // 기존 재생 중단
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay = () => setIsSpeaking(true)
      audio.onended = () => setIsSpeaking(false)
      audio.onerror = () => setIsSpeaking(false)

      try {
        await audio.play()
        return true
      } catch {
        return false
      }
    },
    []
  )

  // Web Speech API로 재생 (폴백)
  const playSpeechSynthesis = useCallback(
    (text: string) => {
      if (!isSupported) return

      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ko-KR'
      utterance.rate = 0.92
      utterance.pitch = 1.08

      if (voiceRef.current) {
        utterance.voice = voiceRef.current
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      speechSynthesis.speak(utterance)
    },
    [isSupported]
  )

  // 메인 speak 함수
  const speak = useCallback(
    (text: string) => {
      if (!enabled) return

      if (cloudAvailable) {
        playCloudAudio(text).then((success) => {
          if (!success) {
            playSpeechSynthesis(text)
          }
        })
      } else {
        playSpeechSynthesis(text)
      }
    },
    [enabled, cloudAvailable, playCloudAudio, playSpeechSynthesis]
  )

  // 여러 텍스트 미리 로드 (운동 시작 시 모든 스텝 프리로드)
  const preload = useCallback(
    (texts: string[]) => {
      if (!cloudAvailable) return
      texts.forEach((text) => {
        if (!audioCache.has(text)) {
          fetchTTSAudio(text)
        }
      })
    },
    [cloudAvailable]
  )

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (isSupported) speechSynthesis.cancel()
    }
  }, [isSupported])

  return { speak, stop, preload, isSupported: isSupported || isCloudTTS, isSpeaking, isCloudTTS }
}
