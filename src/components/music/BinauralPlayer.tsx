'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Headphones, Moon, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'

const PRESETS = [
  {
    id: 'alpha',
    name: '알파파 (릴렉스)',
    description: '긴장 완화, 창의적 사고 향상',
    base: 200,
    beat: 10,
  },
  {
    id: 'theta',
    name: '세타파 (명상)',
    description: '깊은 명상, 직관력 향상',
    base: 200,
    beat: 6,
  },
  {
    id: 'delta',
    name: '델타파 (수면)',
    description: '깊은 수면, 신체 회복',
    base: 200,
    beat: 2,
  },
  {
    id: 'beta',
    name: '베타파 (집중)',
    description: '집중력 강화, 각성 상태',
    base: 200,
    beat: 18,
  },
]

const AMBIENT_SOUNDS = [
  { id: 'none', name: '없음' },
  { id: 'rain', name: '빗소리' },
  { id: 'waves', name: '파도' },
  { id: 'wind', name: '바람' },
  { id: 'white', name: '백색소음' },
]

const TIMER_OPTIONS = [
  { label: '무제한', value: 0 },
  { label: '5분', value: 5 },
  { label: '10분', value: 10 },
  { label: '15분', value: 15 },
  { label: '20분', value: 20 },
  { label: '30분', value: 30 },
]

const SLEEP_TIMER_OPTIONS = [
  { label: '없음', value: 0 },
  { label: '10분', value: 10 },
  { label: '20분', value: 20 },
  { label: '30분', value: 30 },
  { label: '45분', value: 45 },
  { label: '60분', value: 60 },
]

type Preset = typeof PRESETS[number]

// Generate noise buffer
function createNoiseBuffer(ctx: AudioContext, type: string): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const bufferSize = sampleRate * 4 // 4 seconds, will loop
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate)

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    } else if (type === 'rain') {
      // Pink-ish noise (rain-like)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
    } else if (type === 'waves') {
      // Brown noise (wave-like low rumble)
      let last = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        last = (last + (0.02 * white)) / 1.02
        data[i] = last * 3.5
      }
    } else if (type === 'wind') {
      // Filtered noise (wind-like)
      let b0 = 0, b1 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.997 * b0 + white * 0.05
        b1 = 0.95 * b1 + b0 * 0.15
        data[i] = b1 * 4
      }
    }
  }

  return buffer
}

interface SessionInfo {
  presetId: string
  durationSec: number
}

interface BinauralPlayerProps {
  onSessionComplete?: (info: SessionInfo) => void
}

export default function BinauralPlayer({ onSessionComplete }: BinauralPlayerProps) {
  const [selectedPreset, setSelectedPreset] = useState<Preset>(PRESETS[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.3)
  const [ambientType, setAmbientType] = useState('none')
  const [ambientVolume, setAmbientVolume] = useState(0.2)
  const [timerMinutes, setTimerMinutes] = useState(0)
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(0)
  const [elapsed, setElapsed] = useState(0) // seconds
  const [showTimerPanel, setShowTimerPanel] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const ambientGainRef = useRef<GainNode | null>(null)
  const ambientSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const leftOscRef = useRef<OscillatorNode | null>(null)
  const rightOscRef = useRef<OscillatorNode | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  const stopAudio = useCallback(() => {
    try {
      leftOscRef.current?.stop()
      rightOscRef.current?.stop()
    } catch { /* ignore */ }
    try {
      ambientSourceRef.current?.stop()
    } catch { /* ignore */ }
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    leftOscRef.current = null
    rightOscRef.current = null
    gainRef.current = null
    ambientGainRef.current = null
    ambientSourceRef.current = null

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsPlaying(false)
  }, [])

  const handleSessionEnd = useCallback(() => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
    stopAudio()
    onSessionComplete?.({ presetId: selectedPreset.id, durationSec: duration })
  }, [stopAudio, onSessionComplete, selectedPreset.id])

  function startAudio() {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx

    // Binaural beat gain
    const gain = ctx.createGain()
    gain.gain.value = volume
    gainRef.current = gain

    const leftPanner = ctx.createStereoPanner()
    leftPanner.pan.value = -1
    const rightPanner = ctx.createStereoPanner()
    rightPanner.pan.value = 1

    const leftOsc = ctx.createOscillator()
    leftOsc.type = 'sine'
    leftOsc.frequency.value = selectedPreset.base
    leftOscRef.current = leftOsc

    const rightOsc = ctx.createOscillator()
    rightOsc.type = 'sine'
    rightOsc.frequency.value = selectedPreset.base + selectedPreset.beat
    rightOscRef.current = rightOsc

    leftOsc.connect(leftPanner)
    rightOsc.connect(rightPanner)
    leftPanner.connect(gain)
    rightPanner.connect(gain)
    gain.connect(ctx.destination)
    leftOsc.start()
    rightOsc.start()

    // Ambient sound
    if (ambientType !== 'none') {
      const ambientGain = ctx.createGain()
      ambientGain.gain.value = ambientVolume
      ambientGainRef.current = ambientGain

      const buffer = createNoiseBuffer(ctx, ambientType)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(ambientGain)
      ambientGain.connect(ctx.destination)
      source.start()
      ambientSourceRef.current = source
    }

    startTimeRef.current = Date.now()
    setElapsed(0)
    setIsPlaying(true)

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
  }

  function handleToggle() {
    if (isPlaying) {
      handleSessionEnd()
    } else {
      startAudio()
    }
  }

  function handleSelectPreset(preset: Preset) {
    if (isPlaying) stopAudio()
    setSelectedPreset(preset)
  }

  function handleVolumeChange(v: number) {
    setVolume(v)
    if (gainRef.current) gainRef.current.gain.value = v
  }

  function handleAmbientVolumeChange(v: number) {
    setAmbientVolume(v)
    if (ambientGainRef.current) ambientGainRef.current.gain.value = v
  }

  // Session timer: stop when time is up
  useEffect(() => {
    if (!isPlaying || timerMinutes === 0) return
    const targetSec = timerMinutes * 60
    if (elapsed >= targetSec) {
      handleSessionEnd()
    }
  }, [isPlaying, timerMinutes, elapsed, handleSessionEnd])

  // Sleep timer: fade out and stop
  useEffect(() => {
    if (!isPlaying || sleepTimerMinutes === 0) return
    const targetSec = sleepTimerMinutes * 60
    const fadeStartSec = targetSec - 30 // 30-sec fade

    if (elapsed >= targetSec) {
      handleSessionEnd()
    } else if (elapsed >= fadeStartSec) {
      // Fade from current volume to 0 over remaining time
      const remaining = targetSec - elapsed
      const fadeRatio = remaining / 30
      if (gainRef.current) gainRef.current.gain.value = volume * fadeRatio
      if (ambientGainRef.current) ambientGainRef.current.gain.value = ambientVolume * fadeRatio
    }
  }, [isPlaying, sleepTimerMinutes, elapsed, volume, ambientVolume, handleSessionEnd])

  useEffect(() => {
    return () => stopAudio()
  }, [stopAudio])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const remainingTimer = timerMinutes > 0 ? timerMinutes * 60 - elapsed : null
  const remainingSleep = sleepTimerMinutes > 0 ? sleepTimerMinutes * 60 - elapsed : null

  return (
    <div className="space-y-4">
      <Alert>
        <Headphones className="h-4 w-4" />
        <AlertDescription>
          헤드폰이나 이어폰을 착용하면 바이노럴 비트 효과를 더 잘 느낄 수 있습니다.
        </AlertDescription>
      </Alert>

      {/* Preset selection */}
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className={`text-left p-3 rounded-xl border transition-colors ${
              selectedPreset.id === preset.id
                ? 'border-primary bg-primary/5'
                : 'border-zinc-200 bg-white hover:bg-zinc-50'
            }`}
          >
            <p className="font-medium text-zinc-800 text-sm">{preset.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{preset.description}</p>
            <p className="text-xs text-primary mt-1">{preset.beat}Hz 비트차</p>
          </button>
        ))}
      </div>

      {/* Ambient sound selector */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 font-medium">배경음</p>
        <div className="flex gap-1.5 flex-wrap">
          {AMBIENT_SOUNDS.map((sound) => (
            <button
              key={sound.id}
              onClick={() => {
                if (isPlaying) stopAudio()
                setAmbientType(sound.id)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                ambientType === sound.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {sound.name}
            </button>
          ))}
        </div>
      </div>

      {/* Volume controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 w-16">비트 음량</span>
          <Slider
            min={0} max={1} step={0.05}
            value={[volume]}
            onValueChange={([v]) => handleVolumeChange(v)}
            className="flex-1"
            aria-label="바이노럴 비트 음량"
          />
          <span className="text-xs text-zinc-500 w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
        {ambientType !== 'none' && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-16">배경 음량</span>
            <Slider
              min={0} max={1} step={0.05}
              value={[ambientVolume]}
              onValueChange={([v]) => handleAmbientVolumeChange(v)}
              className="flex-1"
              aria-label="배경음 음량"
            />
            <span className="text-xs text-zinc-500 w-8 text-right">
              {Math.round(ambientVolume * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Timer toggle */}
      <button
        onClick={() => setShowTimerPanel(!showTimerPanel)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <Timer className="h-3.5 w-3.5" />
        타이머 설정
        {(timerMinutes > 0 || sleepTimerMinutes > 0) && (
          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
            {timerMinutes > 0 && `${timerMinutes}분`}
            {timerMinutes > 0 && sleepTimerMinutes > 0 && ' · '}
            {sleepTimerMinutes > 0 && `수면 ${sleepTimerMinutes}분`}
          </span>
        )}
      </button>

      {showTimerPanel && (
        <div className="space-y-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50">
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Timer className="h-3 w-3" /> 세션 타이머
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {TIMER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimerMinutes(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    timerMinutes === opt.value
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Moon className="h-3 w-3" /> 슬립 타이머 (자동 페이드 아웃)
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {SLEEP_TIMER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSleepTimerMinutes(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    sleepTimerMinutes === opt.value
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Play button */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={handleToggle}
          variant={isPlaying ? 'outline' : 'default'}
          className="px-10"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-1" />
              중지
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              재생
            </>
          )}
        </Button>
      </div>

      {isPlaying && (
        <div className="text-center space-y-1">
          <p className="text-xs text-zinc-400">
            {selectedPreset.name} 재생 중 — {formatTime(elapsed)}
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-300">
            {remainingTimer !== null && remainingTimer > 0 && (
              <span>타이머 {formatTime(remainingTimer)}</span>
            )}
            {remainingSleep !== null && remainingSleep > 0 && (
              <span>수면 {formatTime(remainingSleep)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
