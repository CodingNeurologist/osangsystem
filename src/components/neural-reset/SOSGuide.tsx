'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, ChevronRight, X } from 'lucide-react'

type SOSPhase = 'start' | 'grounding' | 'breathing' | 'closing'

const GROUNDING_STEPS = [
  { sense: '보이는 것', count: 5, prompt: '지금 눈에 보이는 것 5가지를 찾아보세요' },
  { sense: '만질 수 있는 것', count: 4, prompt: '만질 수 있는 것 4가지를 느껴 보세요' },
  { sense: '들리는 것', count: 3, prompt: '들리는 소리 3가지에 집중해 보세요' },
  { sense: '냄새', count: 2, prompt: '맡을 수 있는 냄새 2가지를 찾아보세요' },
  { sense: '맛', count: 1, prompt: '지금 느껴지는 맛 1가지에 집중해 보세요' },
]

// 4-7-8 breathing cycle timings
const BREATH_INHALE = 4
const BREATH_HOLD = 7
const BREATH_EXHALE = 8
const BREATH_CYCLES = 4

interface SOSGuideProps {
  onComplete?: (durationSec: number) => void
  onClose?: () => void
}

export default function SOSGuide({ onComplete, onClose }: SOSGuideProps) {
  const [phase, setPhase] = useState<SOSPhase>('start')
  const [groundingStep, setGroundingStep] = useState(0)
  const [breathCycle, setBreathCycle] = useState(0)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [breathTimer, setBreathTimer] = useState(BREATH_INHALE)
  const startTimeRef = useRef(Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Breathing timer
  useEffect(() => {
    if (phase !== 'breathing') return
    clearTimer()

    intervalRef.current = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          // Transition to next breath phase
          if (breathPhase === 'inhale') {
            setBreathPhase('hold')
            return BREATH_HOLD
          } else if (breathPhase === 'hold') {
            setBreathPhase('exhale')
            return BREATH_EXHALE
          } else {
            // exhale done → next cycle or finish
            if (breathCycle + 1 >= BREATH_CYCLES) {
              setPhase('closing')
              clearTimer()
              return 0
            }
            setBreathCycle((c) => c + 1)
            setBreathPhase('inhale')
            return BREATH_INHALE
          }
        }
        return prev - 1
      })
    }, 1000)

    return clearTimer
  }, [phase, breathPhase, breathCycle, clearTimer])

  const handleGroundingNext = () => {
    if (groundingStep < GROUNDING_STEPS.length - 1) {
      setGroundingStep((s) => s + 1)
    } else {
      // Start breathing phase
      setBreathCycle(0)
      setBreathPhase('inhale')
      setBreathTimer(BREATH_INHALE)
      setPhase('breathing')
    }
  }

  const handleFinish = () => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
    onComplete?.(duration)
  }

  // Full-screen calm UI
  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white px-6">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Start */}
      {phase === 'start' && (
        <div className="text-center space-y-8 max-w-sm">
          <p className="text-2xl leading-relaxed">
            괜찮습니다.
            <br />
            지금 여기에 있어요.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            잠시 멈추고, 천천히 함께해 보겠습니다.
            <br />
            준비가 되면 시작해 주세요.
          </p>
          <button
            onClick={() => {
              startTimeRef.current = Date.now()
              setPhase('grounding')
            }}
            className="px-8 py-3 rounded-full bg-white text-slate-900 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            시작하기
          </button>
        </div>
      )}

      {/* Grounding: 5-4-3-2-1 */}
      {phase === 'grounding' && (
        <div className="text-center space-y-8 max-w-sm">
          <div className="space-y-2">
            <span className="text-6xl font-light">
              {GROUNDING_STEPS[groundingStep].count}
            </span>
            <p className="text-sm text-slate-400 uppercase tracking-wide">
              {GROUNDING_STEPS[groundingStep].sense}
            </p>
          </div>
          <p className="text-lg leading-relaxed">
            {GROUNDING_STEPS[groundingStep].prompt}
          </p>
          <div className="flex items-center gap-2 justify-center">
            {GROUNDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= groundingStep ? 'bg-white' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleGroundingNext}
            className="flex items-center gap-1 px-6 py-2.5 rounded-full bg-white/10 text-sm hover:bg-white/20 transition-colors mx-auto"
          >
            {groundingStep < GROUNDING_STEPS.length - 1 ? '다음' : '호흡으로'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Breathing: 4-7-8 */}
      {phase === 'breathing' && (
        <div className="text-center space-y-8">
          <p className="text-sm text-slate-400">4-7-8 호흡</p>

          {/* Breathing circle */}
          <div className="relative w-48 h-48 mx-auto">
            <div
              className={`absolute inset-0 rounded-full border-2 transition-all duration-1000 ease-in-out ${
                breathPhase === 'inhale'
                  ? 'border-sky-400 scale-100 bg-sky-400/10'
                  : breathPhase === 'hold'
                  ? 'border-amber-400 scale-100 bg-amber-400/10'
                  : 'border-slate-400 scale-75 bg-slate-400/5'
              }`}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-light tabular-nums">{breathTimer}</span>
              <span className="text-sm text-slate-400 mt-1">
                {breathPhase === 'inhale' && '들이쉬기'}
                {breathPhase === 'hold' && '멈추기'}
                {breathPhase === 'exhale' && '내쉬기'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center">
            {Array.from({ length: BREATH_CYCLES }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= breathCycle ? 'bg-white' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Closing */}
      {phase === 'closing' && (
        <div className="text-center space-y-8 max-w-sm">
          <p className="text-2xl leading-relaxed">
            잘하셨습니다.
            <br />
            조금 나아졌기를 바랍니다.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            지금 힘든 상황이라면,
            <br />
            전문 상담이 도움이 될 수 있습니다.
          </p>

          <div className="space-y-2">
            <a
              href="tel:1577-0199"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-red-500/20 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-colors"
            >
              <Phone className="h-4 w-4" />
              정신건강위기상담전화 1577-0199
            </a>
            <a
              href="tel:1599-5453"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white/10 text-sm hover:bg-white/20 transition-colors"
            >
              <Phone className="h-4 w-4" />
              오상신경외과 1599-5453
            </a>
          </div>

          <button
            onClick={handleFinish}
            className="px-8 py-3 rounded-full bg-white text-slate-900 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            돌아가기
          </button>

          <p className="text-xs text-slate-500">
            본 기능은 전문 의료인의 진단을 대체하지 않습니다.
          </p>
        </div>
      )}
    </div>
  )
}
