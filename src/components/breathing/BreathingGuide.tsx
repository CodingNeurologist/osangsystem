'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, ChevronLeft, Clock, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BreathingPattern } from '@/types'
import { BREATHING_PATTERNS } from '@/data/breathing-patterns'
import BreathingFace from './BreathingFace'

type Phase = 'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'done'

const SCALE_MIN = 0.3
const SCALE_MAX = 1

/** 타이머 옵션 (분) */
const TIMER_OPTIONS = [1, 2, 3, 5, 10] as const

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
  const [timerMinutes, setTimerMinutes] = useState(3)
  const [phase, setPhase] = useState<Phase>('idle')
  const [displayTime, setDisplayTime] = useState(0)
  const [totalElapsedSec, setTotalElapsedSec] = useState(0)
  const [completedCycles, setCompletedCycles] = useState(0)
  const [circleScale, setCircleScale] = useState(SCALE_MIN)
  const [transitionMs, setTransitionMs] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)

  const rafRef = useRef(0)
  const phaseStartRef = useRef(0)
  const phaseDurationRef = useRef(0)
  const phaseRef = useRef<Phase>('idle')
  const cycleRef = useRef(0)
  const stoppedRef = useRef(false)
  const patternRef = useRef<BreathingPattern | null>(null)
  const sessionStartRef = useRef(0)
  const timerEndRef = useRef(0)

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

    // 타이머 종료 체크
    if (performance.now() >= timerEndRef.current) {
      setPhase('done')
      setDisplayTime(0)
      setTransitionMs(800)
      setCircleScale(SCALE_MIN)
      setPhaseProgress(0)
      phaseRef.current = 'done'

      if (patternRef.current && sessionStartRef.current > 0) {
        const durationSec = Math.round((performance.now() - sessionStartRef.current) / 1000)
        onSessionComplete?.(patternRef.current.id, cycleRef.current, durationSec)
      }
      return
    }

    const dur = getPhaseDuration(nextPhase)
    if (dur === 0) {
      const next = getNextPhase(nextPhase)
      cycleRef.current = next.cycle
      beginPhase(next.phase, next.cycle)
      return
    }

    // 새로운 사이클 시작 시 카운트 업데이트
    if (nextPhase === 'inhale' && cycle > cycleRef.current) {
      setCompletedCycles(cycle - 1)
    }

    phaseRef.current = nextPhase
    cycleRef.current = cycle
    phaseDurationRef.current = dur
    phaseStartRef.current = performance.now()

    setPhase(nextPhase)
    setDisplayTime(dur)
    setPhaseProgress(0)

    setTransitionMs(dur * 1000)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCircleScale(getScaleForPhase(nextPhase))
      })
    })

    const tick = () => {
      if (stoppedRef.current) return
      const now = performance.now()
      const elapsed = (now - phaseStartRef.current) / 1000
      const remaining = Math.max(0, dur - elapsed)
      const totalElapsed = Math.round((now - sessionStartRef.current) / 1000)

      setDisplayTime(Math.ceil(remaining))
      setPhaseProgress(Math.min(1, elapsed / dur))
      setTotalElapsedSec(totalElapsed)

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        const next = getNextPhase(nextPhase)
        cycleRef.current = next.cycle
        beginPhase(next.phase, next.cycle)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [getPhaseDuration, getNextPhase, getScaleForPhase, onSessionComplete])

  const handleStart = useCallback(() => {
    stopAll()
    stoppedRef.current = false
    setTransitionMs(0)
    setCircleScale(SCALE_MIN)
    setCompletedCycles(0)
    setPhaseProgress(0)
    const now = performance.now()
    sessionStartRef.current = now
    timerEndRef.current = now + timerMinutes * 60 * 1000
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        beginPhase('inhale', 1)
      })
    })
  }, [stopAll, beginPhase, timerMinutes])

  const handleStop = useCallback(() => {
    stopAll()
    setPhase('idle')
    setDisplayTime(0)
    setCompletedCycles(0)
    setTransitionMs(600)
    setCircleScale(SCALE_MIN)
    setPhaseProgress(0)
    setTotalElapsedSec(0)
    phaseRef.current = 'idle'
  }, [stopAll])

  useEffect(() => {
    return () => {
      stoppedRef.current = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    patternRef.current = selectedPattern
  }, [selectedPattern])

  const isRunning = phase === 'inhale' || phase === 'exhale' || phase === 'hold1' || phase === 'hold2'

  const phaseLabel: Record<Phase, string> = {
    idle: '준비되면 시작하세요',
    inhale: '들이쉬세요',
    hold1: '멈추세요',
    exhale: '내쉬세요',
    hold2: '멈추세요',
    done: '잘 하셨습니다',
  }

  const easing = phase === 'inhale'
    ? 'cubic-bezier(0.4, 0, 0.2, 1)'
    : phase === 'exhale'
      ? 'cubic-bezier(0.25, 0.1, 0.25, 1)'
      : 'ease'

  const primaryColor = 'hsl(var(--primary))'
  const activeColor =
    phase === 'inhale' || phase === 'hold1'
      ? 'hsl(37 50% 55%)'
      : phase === 'exhale' || phase === 'hold2'
        ? 'hsl(37 42% 48%)'
        : primaryColor

  const remainingTimerSec = isRunning
    ? Math.max(0, Math.round((timerEndRef.current - performance.now()) / 1000))
    : timerMinutes * 60

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

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
    <div className="flex flex-col items-center min-h-[calc(100dvh-120px)]">
      {/* 상단 바: 뒤로가기 + 패턴 이름 + 타이머 */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => {
            handleStop()
            setSelectedPattern(null)
          }}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">패턴 선택</span>
        </button>

        <p className="text-sm font-medium text-zinc-700">{selectedPattern.name}</p>

        {/* 남은 시간 / 경과 시간 */}
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5" />
          {isRunning || phase === 'done'
            ? formatTime(totalElapsedSec)
            : `${timerMinutes}분`
          }
        </div>
      </div>

      {/* 호흡 패턴 정보 (한줄) */}
      <p className="text-xs text-zinc-400 mb-2">
        들이쉬기 {selectedPattern.inhale}초
        {selectedPattern.hold1 > 0 && ` · 멈춤 ${selectedPattern.hold1}초`}
        {' '}· 내쉬기 {selectedPattern.exhale}초
        {selectedPattern.hold2 > 0 && ` · 멈춤 ${selectedPattern.hold2}초`}
      </p>

      {/* 타이머 설정 (대기 중에만) */}
      {!isRunning && phase !== 'done' && (
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setTimerMinutes((m) => Math.max(1, m - 1))}
            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
          >
            <Minus className="h-3.5 w-3.5 text-zinc-500" />
          </button>
          <div className="flex gap-1.5">
            {TIMER_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setTimerMinutes(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  timerMinutes === m
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {m}분
              </button>
            ))}
          </div>
          <button
            onClick={() => setTimerMinutes((m) => Math.min(30, m + 1))}
            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        </div>
      )}

      {/* 메인 호흡 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* 얼굴 일러스트 */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 mb-4">
          <BreathingFace phase={phase} progress={phaseProgress} />
        </div>

        {/* 호흡 원 애니메이션 - 크게 */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: '280px', height: '280px' }}
          aria-live="polite"
          aria-label={phaseLabel[phase]}
        >
          {/* 외곽 글로우 */}
          <div
            className="absolute rounded-full"
            style={{
              width: '240px',
              height: '240px',
              background: `${activeColor}06`,
              transform: `scale(${circleScale})`,
              transition: transitionMs > 0
                ? `transform ${transitionMs}ms ${easing}, background 0.6s ease`
                : 'none',
              filter: 'blur(16px)',
            }}
          />
          {/* 중간 레이어 */}
          <div
            className="absolute rounded-full"
            style={{
              width: '240px',
              height: '240px',
              background: `${activeColor}10`,
              transform: `scale(${circleScale})`,
              transition: transitionMs > 0
                ? `transform ${transitionMs * 1.02}ms ${easing}, background 0.6s ease`
                : 'none',
            }}
          />
          {/* 메인 원 */}
          <div
            className="relative rounded-full flex items-center justify-center"
            style={{
              width: '240px',
              height: '240px',
              background: `radial-gradient(circle at 38% 38%, ${activeColor}dd, ${activeColor})`,
              transform: `scale(${circleScale})`,
              transition: transitionMs > 0
                ? `transform ${transitionMs}ms ${easing}, background 0.6s ease`
                : 'none',
              boxShadow: isRunning
                ? `0 0 80px ${activeColor}33, 0 0 160px ${activeColor}11`
                : `0 0 40px ${activeColor}22`,
            }}
          >
            {/* 하이라이트 */}
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
            {/* 카운트다운 숫자 */}
            <span
              className="font-bold select-none relative tabular-nums"
              style={{
                fontSize: '3.5rem',
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

        {/* 페이즈 안내 텍스트 */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-xl font-semibold text-foreground">{phaseLabel[phase]}</p>
          {isRunning && (
            <p className="text-sm text-muted-foreground">
              {completedCycles + 1}번째 사이클
            </p>
          )}
          {phase === 'done' && (
            <p className="text-sm font-medium text-primary">
              호흡 훈련을 완료했습니다 ({completedCycles}회)
            </p>
          )}
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div className="w-full pt-6 pb-4 flex flex-col items-center gap-4">
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

        <p className="text-xs text-zinc-400 text-center">
          본 기능은 전문 의료인의 진단을 대체하지 않습니다.
        </p>
      </div>
    </div>
  )
}
