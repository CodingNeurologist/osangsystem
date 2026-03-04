'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle2 } from 'lucide-react'
import type { SomaticExercise } from '@/types'

interface SomaticGuideProps {
  exercise: SomaticExercise
  onBack: () => void
  onComplete: (exerciseId: string, durationSec: number) => void
}

type GuidePhase = 'ready' | 'active' | 'done'

export default function SomaticGuide({ exercise, onBack, onComplete }: SomaticGuideProps) {
  const [phase, setPhase] = useState<GuidePhase>('ready')
  const [currentStep, setCurrentStep] = useState(0)
  const [stepTimeLeft, setStepTimeLeft] = useState(0)
  const [paused, setPaused] = useState(false)
  const [preDistress, setPreDistress] = useState<number | null>(null)
  const [postDistress, setPostDistress] = useState<number | null>(null)
  const elapsedRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const steps = exercise.steps

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Timer logic
  useEffect(() => {
    if (phase !== 'active' || paused) return
    clearTimer()

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1
      setStepTimeLeft((prev) => {
        if (prev <= 1) {
          // Move to next step or complete
          if (currentStep < steps.length - 1) {
            setCurrentStep((s) => s + 1)
            return steps[currentStep + 1].durationSec
          } else {
            setPhase('done')
            clearTimer()
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)

    return clearTimer
  }, [phase, paused, currentStep, steps, clearTimer])

  const handleStart = () => {
    if (preDistress === null) return
    setCurrentStep(0)
    setStepTimeLeft(steps[0].durationSec)
    elapsedRef.current = 0
    setPhase('active')
  }

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
      setStepTimeLeft(steps[currentStep + 1].durationSec)
    } else {
      setPhase('done')
      clearTimer()
    }
  }

  const handleFinish = () => {
    onComplete(exercise.id, elapsedRef.current)
  }

  const progress = phase === 'active'
    ? ((currentStep + 1 - stepTimeLeft / steps[currentStep].durationSec) / steps.length) * 100
    : phase === 'done' ? 100 : 0

  // Ready: pre-distress selection
  if (phase === 'ready') {
    return (
      <div className="space-y-6">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>

        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{exercise.name}</h2>
          <p className="text-sm text-zinc-500 mt-1">{exercise.description}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{exercise.duration}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{exercise.difficulty}</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-700">시작 전, 현재 불편함 정도를 선택해 주세요</p>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPreDistress(n)}
                className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
                  preDistress === n
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>편안함</span>
            <span>매우 불편함</span>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={preDistress === null}
          className="w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
        >
          시작하기
        </button>
      </div>
    )
  }

  // Done: post-distress
  if (phase === 'done') {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">수고하셨습니다</h2>
          <p className="text-sm text-zinc-500 mt-1">{exercise.name}을(를) 완료했습니다.</p>
        </div>

        {postDistress === null ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700">운동 후 불편함 정도를 선택해 주세요</p>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPostDistress(n)}
                  className="flex-1 h-10 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-zinc-400">
              <span>편안함</span>
              <span>매우 불편함</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-xs text-zinc-400">시작 전</p>
                <p className="text-2xl font-bold text-zinc-900">{preDistress}</p>
              </div>
              <div className="text-center">
                <span className="text-zinc-300">→</span>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-400">운동 후</p>
                <p className="text-2xl font-bold text-zinc-900">{postDistress}</p>
              </div>
            </div>
            {preDistress !== null && postDistress < preDistress && (
              <p className="text-sm text-emerald-600">
                불편함이 {preDistress - postDistress}점 감소했습니다
              </p>
            )}
            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              완료
            </button>
          </div>
        )}
      </div>
    )
  }

  // Active: step-by-step guide
  const step = steps[currentStep]

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-800 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {currentStep + 1} / {steps.length}
        </span>
        <span className="text-xs text-zinc-400">{exercise.name}</span>
      </div>

      {/* Instruction */}
      <div className="min-h-[120px] flex items-center justify-center px-4">
        <p className="text-center text-zinc-900 leading-relaxed">
          {step.instruction}
        </p>
      </div>

      {/* Timer */}
      <div className="text-center">
        <span className="text-4xl font-light text-zinc-900 tabular-nums">
          {stepTimeLeft}
        </span>
        <span className="text-sm text-zinc-400 ml-1">초</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setPaused(!paused)}
          className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
        >
          {paused ? (
            <Play className="h-6 w-6 text-zinc-700 ml-0.5" />
          ) : (
            <Pause className="h-6 w-6 text-zinc-700" />
          )}
        </button>
        <button
          onClick={handleSkipStep}
          className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center hover:bg-zinc-100 transition-colors"
        >
          <SkipForward className="h-4 w-4 text-zinc-500" />
        </button>
      </div>
    </div>
  )
}
