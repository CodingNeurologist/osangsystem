'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Phone } from 'lucide-react'

const DIMENSIONS = [
  { id: 'body', label: '신체 컨디션', emojis: ['😫', '😣', '😐', '🙂', '😊'] },
  { id: 'mood', label: '기분', emojis: ['😢', '😔', '😐', '🙂', '😄'] },
  { id: 'energy', label: '에너지', emojis: ['🪫', '😴', '😐', '⚡', '🔋'] },
  { id: 'stress', label: '스트레스', emojis: ['🔴', '🟠', '🟡', '🟢', '💚'] },
] as const

const SYMPTOM_TAGS = [
  '어지럼증', '두근거림', '소화불량', '두통', '불면',
  '피로', '불안', '발한', '손발저림', '호흡곤란',
  '목/어깨 결림', '집중력 저하',
]

interface DailyCheckinProps {
  onComplete?: () => void
}

export default function DailyCheckin({ onComplete }: DailyCheckinProps) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, number>>({})
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [step, setStep] = useState<'score' | 'symptoms' | 'done'>('score')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalScore, setTotalScore] = useState(0)

  const allScored = DIMENSIONS.every((d) => scores[d.id] !== undefined)

  const handleScore = (dimensionId: string, value: number) => {
    setScores((prev) => ({ ...prev, [dimensionId]: value }))
  }

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) => {
      if (prev.includes(symptom)) return prev.filter((s) => s !== symptom)
      if (prev.length >= 3) return prev
      return [...prev, symptom]
    })
  }

  const handleSubmit = async () => {
    if (!allScored) return
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/neural-reset/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body_score: scores.body,
          mood_score: scores.mood,
          energy_score: scores.energy,
          stress_score: scores.stress,
          symptoms,
        }),
      })

      if (res.ok) {
        const total = (scores.body ?? 0) + (scores.mood ?? 0) + (scores.energy ?? 0) + (scores.stress ?? 0)
        setTotalScore(total)
        setStep('done')
        onComplete?.()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'done') {
    const isCrisis = totalScore <= 5
    return (
      <div className="space-y-4">
        {isCrisis && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold text-sm">지금 힘든 상황이시라면</span>
            </div>
            <p className="text-sm text-red-600">
              전문 상담이 도움이 될 수 있습니다. 혼자 감당하지 않아도 됩니다.
            </p>
            <a
              href="tel:1577-0199"
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white w-fit"
            >
              <Phone className="h-4 w-4" />
              정신건강위기상담전화 1577-0199
            </a>
            <a
              href="tel:1599-5453"
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-red-700 w-fit"
            >
              <Phone className="h-4 w-4" />
              오상신경외과 1599-5453
            </a>
          </div>
        )}
        <div className="rounded-xl border border-zinc-100 bg-white p-6 text-center space-y-3">
          <div className="text-3xl font-semibold text-zinc-900">
            {totalScore}<span className="text-lg text-zinc-400">/20</span>
          </div>
          <p className="text-sm text-zinc-500">오늘의 컨디션이 기록되었습니다</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/app/neural-reset')}
          >
            추천 활동 보기
          </Button>
        </div>
        <p className="text-xs text-zinc-400 text-center">
          본 기능은 전문 의료인의 진단을 대체하지 않습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">오늘은 어떠세요?</h2>
        <p className="text-sm text-zinc-500 mt-1">각 항목을 탭하여 오늘의 상태를 기록해 보세요</p>
      </div>

      {step === 'score' && (
        <>
          <div className="space-y-5">
            {DIMENSIONS.map((dim) => (
              <div key={dim.id} className="space-y-2">
                <span className="text-sm font-medium text-zinc-700">{dim.label}</span>
                <div className="flex gap-2">
                  {dim.emojis.map((emoji, idx) => {
                    const value = idx + 1
                    const selected = scores[dim.id] === value
                    return (
                      <button
                        key={value}
                        onClick={() => handleScore(dim.id, value)}
                        className={`flex-1 flex items-center justify-center h-12 rounded-lg text-xl transition-all ${
                          selected
                            ? 'bg-zinc-900 shadow-sm scale-105'
                            : 'bg-zinc-50 hover:bg-zinc-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <Button
            className="w-full"
            disabled={!allScored}
            onClick={() => setStep('symptoms')}
          >
            다음
          </Button>
        </>
      )}

      {step === 'symptoms' && (
        <>
          <div className="space-y-3">
            <p className="text-sm text-zinc-600">
              오늘 느끼는 증상이 있다면 선택해 주세요 <span className="text-zinc-400">(최대 3개, 선택사항)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_TAGS.map((symptom) => {
                const selected = symptoms.includes(symptom)
                return (
                  <button
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selected
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {symptom}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep('score')}
            >
              이전
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : '기록하기'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
