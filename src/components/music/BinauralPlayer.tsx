'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Headphones } from 'lucide-react'
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

type Preset = typeof PRESETS[number]

export default function BinauralPlayer() {
  const [selectedPreset, setSelectedPreset] = useState<Preset>(PRESETS[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.3)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const leftOscRef = useRef<OscillatorNode | null>(null)
  const rightOscRef = useRef<OscillatorNode | null>(null)

  function stopAudio() {
    try {
      leftOscRef.current?.stop()
      rightOscRef.current?.stop()
    } catch {
      // 이미 중지된 경우 무시
    }
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    leftOscRef.current = null
    rightOscRef.current = null
    gainRef.current = null
    setIsPlaying(false)
  }

  function startAudio() {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx

    const gain = ctx.createGain()
    gain.gain.value = volume
    gainRef.current = gain

    // 스테레오 패너로 좌우 분리
    const leftPanner = ctx.createStereoPanner()
    leftPanner.pan.value = -1

    const rightPanner = ctx.createStereoPanner()
    rightPanner.pan.value = 1

    // 왼쪽 귀: 기본 주파수
    const leftOsc = ctx.createOscillator()
    leftOsc.type = 'sine'
    leftOsc.frequency.value = selectedPreset.base
    leftOscRef.current = leftOsc

    // 오른쪽 귀: 기본 주파수 + 비트 주파수
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

    setIsPlaying(true)
  }

  function handleToggle() {
    if (isPlaying) {
      stopAudio()
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
    if (gainRef.current) {
      gainRef.current.gain.value = v
    }
  }

  useEffect(() => {
    return () => stopAudio()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <Alert>
        <Headphones className="h-4 w-4" />
        <AlertDescription>
          헤드폰이나 이어폰을 착용하면 바이노럴 비트 효과를 더 잘 느낄 수 있습니다.
          각 귀에 약간 다른 주파수의 소리를 들려주어 뇌파를 유도합니다.
        </AlertDescription>
      </Alert>

      {/* 프리셋 선택 */}
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

      {/* 음량 조절 */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 w-8">음량</span>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[volume]}
          onValueChange={([v]) => handleVolumeChange(v)}
          className="flex-1"
          aria-label="음량 조절"
        />
        <span className="text-xs text-zinc-500 w-8 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* 재생 버튼 */}
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
        <p className="text-center text-xs text-zinc-400">
          {selectedPreset.name} 재생 중 —
          왼쪽 {selectedPreset.base}Hz / 오른쪽 {selectedPreset.base + selectedPreset.beat}Hz
        </p>
      )}
    </div>
  )
}
