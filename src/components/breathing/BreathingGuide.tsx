'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { BreathingPattern } from '@/types'
import { BREATHING_PATTERNS, CYCLE_OPTIONS } from '@/data/breathing-patterns'

type Phase = 'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'done'

const SCALE_MIN = 0.35
const SCALE_MAX = 1

interface BreathingGuideProps {
  initialPatternId?: string
  onSessionComplete?: (patternId: string, cycles: number, durationSec: number) => void
}

export default function BreathingGuide({ initialPatternId, onSessionComplete }: BreathingGuideProps) {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern | null>(
    initialPatternId
      ? BREATHING_PATTERNS.find((p) => p.id === initialPatternId) ?? null
      : null
  )
  const [cycles, setCycles] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [displayTime, setDisplayTime] = useState(0)
  const [currentCycle, setCurrentCycle] = useState(0)
  const [circleScale, setCircleScale] = useState(SCALE_MIN)
  const [transitionMs, setTransitionMs] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState(0)

  const rafRef = useRef(0)
  const phaseStartRef = useRef(0)
  const phaseDurationRef = useRef(0)
  const phaseRef = useRef<Phase>('idle')
  const cycleRef = useRef(0)
  const stoppedRef = useRef(false)
  const patternRef = useRef<BreathingPattern | null>(null)
  const totalCyclesRef = useRef(0)

  const stopAll = useCallback(() => {
    stoppedRef.current = true
    cancelAnimationFrame(rafRef.current)
  }, [])

  const getNextPhase = useCallback((currentPhase: Phase): { phase: Phase; cycle: number } => {
    const p = patternRef.current
    if (!p) return { phase: 'done', cycle: 0 }
    const c = cycleRef.current

    switch (currentPhase) {
      case 'inhale':
        if (p.hold1 > 0) return { phase: 'hold1', cycle: c }
        return { phase: 'exhale', cycle: c }
      case 'hold1':
        return { phase: 'exhale', cycle: c }
      case 'exhale':
        if (p.hold2 > 0) return { phase: 'hold2', cycle: c }
        return { phase: 'inhale', cycle: c + 1 }
      case 'hold2':
        return { phase: 'inhale', cycle: c + 1 }
      default:
        return { phase: 'inhale', cycle: 1 }
    }
  }, [])

  const getPhaseDuration = useCallback((ph: Phase): number => {
    const p = patternRef.current
    if (!p) return 0
    switch (ph) {
      case 'inhale': return p.inhale
      case 'hold1': return p.hold1
      case 'exhale': return p.exhale
      case 'hold2': return p.hold2
      default: return 0
    }
  }, [])

  const getScaleForPhase = useCallback((ph: Phase): number => {
    switch (ph) {
      case 'inhale': return SCALE_MAX
      case 'hold1': return SCALE_MAX
      case 'exhale': return SCALE_MIN
      case 'hold2': return SCALE_MIN
      default: return SCALE_MIN
    }
  }, [])

  const beginPhase = useCallback((nextPhase: Phase, cycle: number) => {
    if (stoppedRef.current) return

    if (cycle > totalCyclesRef.current) {
      setPhase('done')
      setDisplayTime(0)
      setCurrentCycle(0)
      setTransitionMs(800)
      setCircleScale(SCALE_MIN)
      phaseRef.current = 'done'

      // 세션 완료 콜백
      if (patternRef.current && sessionStartTime > 0) {
        const durationSec = Math.round((performance.now() - sessionStartTime) / 1000)
        onSessionComplete?.(patternRef.current.id, totalCyclesRef.current, durationSec)
      }
      return
    }

    const dur = getPhaseDuration(nextPhase)
    if (dur === 0) {
      // 0초 페이즈는 건너뛰기
      const next = getNextPhase(nextPhase)
      cycleRef.current = next.cycle
      beginPhase(next.phase, next.cycle)
      return
    }

    phaseRef.current = nextPhase
    cycleRef.current = cycle
    phaseDurationRef.current = dur
    phaseStartRef.current = performance.now()

    setPhase(nextPhase)
    setDisplayTime(dur)
    setCurrentCycle(cycle)

    setTransitionMs(dur * 1000)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCircleScale(getScaleForPhase(nextPhase))
      })
    })

    const tick = () => {
      if (stoppedRef.current) return
      const elapsed = (performance.now() - phaseStartRef.current) / 1000
      const remaining = Math.max(0, dur - elapsed)

      setDisplayTime(Math.ceil(remaining))

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        const next = getNextPhase(nextPhase)
        cycleRef.current = next.cycle
        beginPhase(next.phase, next.cycle)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [getPhaseDuration, getNextPhase, getScaleForPhase, onSessionComplete, sessionStartTime])

  const handleStart = useCallback(() => {
    stopAll()
    stoppedRef.current = false
    setTransitionMs(0)
    setCircleScale(SCALE_MIN)
    setSessionStartTime(performance.now())
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        beginPhase('inhale', 1)
      })
    })
  }, [stopAll, beginPhase])

  const handleStop = useCallback(() => {
    stopAll()
    setPhase('idle')
    setDisplayTime(0)
    setCurrentCycle(0)
    setTransitionMs(600)
    setCircleScale(SCALE_MIN)
    phaseRef.current = 'idle'
  }, [stopAll])

  useEffect(() => {
    return () => {
      stoppedRef.current = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // 패턴 선택 시 ref 업데이트
  useEffect(() => {
    patternRef.current = selectedPattern
    if (selectedPattern) {
      setCycles(selectedPattern.defaultCycles)
      totalCyclesRef.current = selectedPattern.defaultCycles
    }
  }, [selectedPattern])

  useEffect(() => {
    totalCyclesRef.current = cycles
  }, [cycles])

  const isRunning = phase === 'inhale' || phase === 'exhale' || phase === 'hold1' || phase === 'hold2'

  const phaseLabel: Record<Phase, string> = {
    idle: '시작 버튼을 눌러 시작하세요',
    inhale: '들이쉬세요',
    hold1: '멈추세요',
    exhale: '내쉬세요',
    hold2: '멈추세요',
    done: '잘 하셨습니다',
  }

  // 흡기: 시간에 맞게 일정하게 커지도록 linear, 호기: 부드럽게 줄어들도록 ease-out
  const easing = phase === 'inhale'
    ? 'linear'
    : phase === 'exhale'
      ? 'cubic-bezier(0.4, 0, 0.2, 1)'
      : 'ease'
  const primaryColor = 'hsl(var(--primary))'
  const activeColor =
    phase === 'inhale' || phase === 'hold1'
      ? 'hsl(37 50% 55%)'
      : phase === 'exhale' || phase === 'hold2'
        ? 'hsl(37 42% 48%)'
        : primaryColor

  // 패턴 선택 화면
  if (!selectedPattern) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">호흡 가이드</h2>
          <p className="text-sm text-zinc-500 mt-1">상황에 맞는 호흡 패턴을 선택해 보세요</p>
        </div>
        <div className="space-y-3">
          {BREATHING_PATTERNS.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => setSelectedPattern(pattern)}
              className="w-full text-left rounded-xl border border-zinc-100 bg-white p-4 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-zinc-900">{pattern.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{pattern.description}</p>
                </div>
                <span className="text-xs text-zinc-400 shrink-0 ml-3">
                  {pattern.inhale}
                  {pattern.hold1 > 0 ? `-${pattern.hold1}` : ''}
                  -{pattern.exhale}
                  {pattern.hold2 > 0 ? `-${pattern.hold2}` : ''}초
                </span>
              </div>
              <div className="mt-2 flex gap-1.5">
                <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-50 text-xs text-zinc-500">
                  {pattern.purpose}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 + 패턴 정보 */}
      {!isRunning && phase !== 'done' && (
        <>
          <button
            onClick={() => {
              handleStop()
              setSelectedPattern(null)
            }}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            패턴 선택
          </button>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="font-semibold text-sm text-foreground">{selectedPattern.name}</p>
              <p className="text-xs mt-0.5 text-muted-foreground">{selectedPattern.description}</p>
              <p className="text-xs mt-1 text-muted-foreground/70">
                들이쉬기 {selectedPattern.inhale}초
                {selectedPattern.hold1 > 0 && ` · 멈춤 ${selectedPattern.hold1}초`}
                {' '}· 내쉬기 {selectedPattern.exhale}초
                {selectedPattern.hold2 > 0 && ` · 멈춤 ${selectedPattern.hold2}초`}
                {' '}· {cycles}회
              </p>
              <div className="flex gap-2 mt-3">
                {CYCLE_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCycles(c)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      cycles === c
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
                    }`}
                  >
                    {c}회
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 호흡 애니메이션 */}
      <div className="flex flex-col items-center py-10 space-y-8">
        <div
          className="relative flex items-center justify-center"
          style={{ width: '260px', height: '260px' }}
          aria-live="polite"
          aria-label={phaseLabel[phase]}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: '180px',
              height: '180px',
              background: `${activeColor}08`,
              transform: `scale(${circleScale})`,
              transition: transitionMs > 0
                ? `transform ${transitionMs}ms ${easing}, background 0.6s ease`
                : 'none',
              filter: 'blur(8px)',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: '180px',
              height: '180px',
              background: `${activeColor}14`,
              transform: `scale(${circleScale})`,
              transition: transitionMs > 0
                ? `transform ${transitionMs * 1.02}ms ${easing}, background 0.6s ease`
                : 'none',
            }}
          />
          <div
            className="relative rounded-full flex items-center justify-center"
            style={{
              width: '180px',
              height: '180px',
              background: `radial-gradient(circle at 38% 38%, ${activeColor}dd, ${activeColor})`,
              transform: `scale(${circleScale})`,
              transition: transitionMs > 0
                ? `transform ${transitionMs}ms ${easing}, background 0.6s ease`
                : 'none',
              boxShadow: isRunning
                ? `0 0 60px ${activeColor}33, 0 0 120px ${activeColor}11`
                : `0 0 30px ${activeColor}22`,
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: '60%',
                height: '60%',
                top: '12%',
                left: '12%',
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <span
              className="font-bold select-none relative tabular-nums"
              style={{
                fontSize: '2.75rem',
                lineHeight: 1,
                color: 'white',
                textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                opacity: isRunning ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              {displayTime}
            </span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xl font-semibold text-foreground">{phaseLabel[phase]}</p>
          {isRunning && (
            <p className="text-sm text-muted-foreground">
              {currentCycle}번째 / 총 {cycles}회
            </p>
          )}
          {phase === 'done' && (
            <p className="text-sm font-medium text-primary">호흡 훈련을 완료했습니다.</p>
          )}
        </div>

        {!isRunning ? (
          <div className="flex gap-3">
            {phase === 'done' && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setPhase('idle')
                  setSelectedPattern(null)
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                패턴 선택
              </Button>
            )}
            <Button onClick={handleStart} size="lg" className="px-10 py-3 text-base">
              {phase === 'done' ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  다시 시작
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  시작하기
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button onClick={handleStop} variant="outline" size="lg" className="px-10 py-3 text-base">
            <Pause className="h-4 w-4 mr-1" />
            중단
          </Button>
        )}
      </div>

      <p className="text-xs text-zinc-400 text-center">
        본 기능은 전문 의료인의 진단을 대체하지 않습니다.
      </p>
    </div>
  )
}
