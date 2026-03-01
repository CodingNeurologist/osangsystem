'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const INHALE_SEC = 4
const EXHALE_SEC = 6
const TOTAL_CYCLES = 6

type Phase = 'idle' | 'inhale' | 'exhale' | 'done'

// Circle scales
const SCALE_MIN = 0.55
const SCALE_MAX = 1

export default function BreathingGuide() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [displayTime, setDisplayTime] = useState(0)
  const [currentCycle, setCurrentCycle] = useState(0)
  const [circleScale, setCircleScale] = useState(SCALE_MIN)
  const [transitionMs, setTransitionMs] = useState(0)

  const rafRef = useRef(0)
  const phaseStartRef = useRef(0)
  const phaseDurationRef = useRef(0)
  const phaseRef = useRef<Phase>('idle')
  const cycleRef = useRef(0)
  const stoppedRef = useRef(false)

  const stopAll = useCallback(() => {
    stoppedRef.current = true
    cancelAnimationFrame(rafRef.current)
  }, [])

  const beginPhase = useCallback((nextPhase: Phase, cycle: number) => {
    if (stoppedRef.current) return

    if (cycle > TOTAL_CYCLES) {
      setPhase('done')
      setDisplayTime(0)
      setCurrentCycle(0)
      setTransitionMs(800)
      setCircleScale(SCALE_MIN)
      phaseRef.current = 'done'
      return
    }

    const dur = nextPhase === 'inhale' ? INHALE_SEC : EXHALE_SEC
    phaseRef.current = nextPhase
    cycleRef.current = cycle
    phaseDurationRef.current = dur
    phaseStartRef.current = performance.now()

    setPhase(nextPhase)
    setDisplayTime(dur)
    setCurrentCycle(cycle)

    // Drive circle scale via CSS transition
    setTransitionMs(dur * 1000)
    // Small delay so browser registers the transition-duration change before scale
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCircleScale(nextPhase === 'inhale' ? SCALE_MAX : SCALE_MIN)
      })
    })

    // Countdown loop via rAF
    const tick = () => {
      if (stoppedRef.current) return
      const elapsed = (performance.now() - phaseStartRef.current) / 1000
      const remaining = Math.max(0, dur - elapsed)

      setDisplayTime(Math.ceil(remaining))

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // Transition to next phase
        const isInhale = nextPhase === 'inhale'
        const nextCycle = isInhale ? cycle : cycle + 1
        beginPhase(isInhale ? 'exhale' : 'inhale', nextCycle)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const handleStart = useCallback(() => {
    stopAll()
    stoppedRef.current = false
    // Reset to minimum scale instantly
    setTransitionMs(0)
    setCircleScale(SCALE_MIN)
    // Kick off first inhale after a brief layout tick
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

  const isRunning = phase === 'inhale' || phase === 'exhale'

  const phaseLabel: Record<Phase, string> = {
    idle: '시작 버튼을 눌러 시작하세요',
    inhale: '들이쉬세요',
    exhale: '내쉬세요',
    done: '잘 하셨습니다',
  }

  // Breathing-specific easing: natural lung expansion / contraction
  const easing =
    phase === 'inhale'
      ? 'cubic-bezier(0.22, 1, 0.36, 1)' // fast start, gentle end (ease-out-quint)
      : 'cubic-bezier(0.22, 1, 0.36, 1)'

  const primaryColor = 'hsl(var(--primary))'
  const activeColor =
    phase === 'inhale'
      ? 'hsl(37 50% 55%)'
      : phase === 'exhale'
        ? 'hsl(37 42% 48%)'
        : primaryColor

  return (
    <div className="space-y-6">
      {/* 안내 카드 - idle/done 상태에서만 */}
      {!isRunning && phase !== 'done' && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="font-semibold text-sm text-foreground">
              이완 호흡
            </p>
            <p className="text-xs mt-0.5 text-muted-foreground">
              긴장 완화와 진정에 도움이 됩니다
            </p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              들이쉬기 {INHALE_SEC}초 · 내쉬기 {EXHALE_SEC}초 · {TOTAL_CYCLES}회
            </p>
          </CardContent>
        </Card>
      )}

      {/* 호흡 애니메이션 */}
      <div className="flex flex-col items-center py-10 space-y-8">
        {/* 원 컨테이너 */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: '260px', height: '260px' }}
          aria-live="polite"
          aria-label={phaseLabel[phase]}
        >
          {/* Layer 1: 가장 바깥 글로우 링 */}
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

          {/* Layer 2: 바깥 소프트 원 */}
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

          {/* Layer 3: 메인 원 */}
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
            {/* 내부 하이라이트 원 */}
            <div
              className="absolute rounded-full"
              style={{
                width: '60%',
                height: '60%',
                top: '12%',
                left: '12%',
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* 타이머 숫자 */}
            <span
              className="font-bold select-none relative"
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

        {/* 단계 텍스트 */}
        <div className="text-center space-y-1">
          <p className="text-xl font-semibold text-foreground">
            {phaseLabel[phase]}
          </p>
          {isRunning && (
            <p className="text-sm text-muted-foreground">
              {currentCycle}번째 / 총 {TOTAL_CYCLES}회
            </p>
          )}
          {phase === 'done' && (
            <p className="text-sm font-medium text-primary">
              호흡 훈련을 완료했습니다.
            </p>
          )}
        </div>

        {/* 컨트롤 버튼 */}
        {!isRunning ? (
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
        ) : (
          <Button
            onClick={handleStop}
            variant="outline"
            size="lg"
            className="px-10 py-3 text-base"
          >
            <Pause className="h-4 w-4 mr-1" />
            중단
          </Button>
        )}
      </div>
    </div>
  )
}
