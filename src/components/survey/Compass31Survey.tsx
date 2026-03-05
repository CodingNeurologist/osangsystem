'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { COMPASS31_SURVEY } from '@/data/compass31'
import type { SurveyAnswers, SurveyQuestion } from '@/types'
import type { WeightedScoreResult } from '@/utils/surveyScoring'
import { getVisibleQuestions, calculateSurveyScore } from '@/utils/surveyScoring'
import Compass31ResultView from './Compass31Result'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

const AUTO_ADVANCE_DELAY = 300

export default function Compass31Survey() {
  const survey = COMPASS31_SURVEY
  const [answers, setAnswers] = useState<SurveyAnswers>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [result, setResult] = useState<WeightedScoreResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime] = useState(() => Date.now())
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 현재 visible 문항 목록
  const visibleQuestions = getVisibleQuestions(survey.questions, answers)
  const totalVisible = visibleQuestions.length
  const currentQuestion = visibleQuestions[currentIndex]

  // 진행률
  const answeredCount = visibleQuestions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== '' &&
      !(Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0)
  ).length
  const progressPercent = totalVisible > 0 ? Math.round((answeredCount / totalVisible) * 100) : 0

  const isLastQuestion = currentIndex === totalVisible - 1

  // gate 문항 변경 시 currentIndex 보정
  useEffect(() => {
    if (currentIndex >= totalVisible && totalVisible > 0) {
      setCurrentIndex(totalVisible - 1)
    }
  }, [currentIndex, totalVisible])

  // cleanup auto-advance timer
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    }
  }, [])

  // 문항 변경 시 스크롤 맨 위로 (모바일 대응)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentIndex])

  // single 선택 핸들러 — 자동 진행
  const handleSingleSelect = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))

      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)

      autoAdvanceTimer.current = setTimeout(() => {
        // 답변 설정 후 visible 재계산하여 마지막인지 확인
        setAnswers((latestAnswers) => {
          const updated = { ...latestAnswers, [questionId]: value }
          const updatedVisible = getVisibleQuestions(survey.questions, updated)
          const updatedIdx = updatedVisible.findIndex((q) => q.id === questionId)
          const updatedIsLast = updatedIdx === updatedVisible.length - 1

          if (updatedIsLast) {
            // 마지막 문항이면 자동 제출
            submitSurvey(updated)
          } else {
            // 다음 문항으로 이동
            setCurrentIndex((prev) => {
              const nextIdx = updatedVisible.findIndex((q) => q.id === questionId)
              return nextIdx >= 0 ? nextIdx + 1 : prev + 1
            })
          }
          return updated
        })
      }, AUTO_ADVANCE_DELAY)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [survey.questions]
  )

  // multiple 선택 토글 핸들러
  const handleMultipleToggle = useCallback(
    (questionId: string, option: string) => {
      setAnswers((prev) => {
        const current = (prev[questionId] as string[] | undefined) ?? []
        const next = current.includes(option)
          ? current.filter((v) => v !== option)
          : [...current, option]
        return { ...prev, [questionId]: next }
      })
    },
    []
  )

  // 네비게이션
  function goNext() {
    if (currentIndex < totalVisible - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }

  // 제출
  async function submitSurvey(finalAnswers?: SurveyAnswers) {
    const answersToScore = finalAnswers ?? answers
    const allVisible = getVisibleQuestions(survey.questions, answersToScore)
    const allAnswered = allVisible.every((q) => {
      const a = answersToScore[q.id]
      if (a === undefined || a === null || a === '') return false
      if (Array.isArray(a) && a.length === 0) return false
      return true
    })
    if (!allAnswered) return

    setIsSubmitting(true)
    const calcResult = calculateSurveyScore(survey, answersToScore)
    const duration = Math.round((Date.now() - startTime) / 1000)
    const roundedTotal = Math.round(calcResult.totalScore)

    // 익명 응답 저장
    try {
      await fetch('/api/check/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: answersToScore,
          total_score: roundedTotal,
          domain_scores: calcResult.domainScores,
          severity_level: calcResult.severity ?? 'minimal',
          duration,
        }),
      })
    } catch {
      // 저장 실패해도 결과 표시
    }

    setResult(calcResult)
    setIsSubmitting(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 결과 화면
  if (result) {
    return <Compass31ResultView result={result} />
  }

  // 로딩 방어
  if (!currentQuestion) {
    return null
  }

  // 현재 문항 답변 여부
  const currentAnswer = answers[currentQuestion.id]
  const isCurrentAnswered = (() => {
    if (currentAnswer === undefined || currentAnswer === null || currentAnswer === '') return false
    if (Array.isArray(currentAnswer) && currentAnswer.length === 0) return false
    return true
  })()

  // 문항 번호 (원래 31문항 기준)
  const questionNumber = survey.questions.findIndex((q) => q.id === currentQuestion.id) + 1

  return (
    <div className="max-w-screen-md mx-auto px-4 py-6">
      {/* 상단 진행률 바 */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>
            {currentIndex + 1} / {totalVisible} 문항
          </span>
          <span>{progressPercent}% 완료</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* 문항 카드 */}
      <Card className="rounded-xl shadow-sm border border-zinc-100 bg-white">
        <CardContent className="pt-6 pb-6">
          <p className="text-sm text-zinc-500 mb-2">Q{questionNumber}</p>
          <p className="text-base font-medium text-zinc-900 leading-relaxed mb-6">
            {currentQuestion.text}
          </p>

          {/* single 타입 */}
          {currentQuestion.type === 'single' && (
            <SingleChoiceOptions
              question={currentQuestion}
              value={currentAnswer as string | undefined}
              onSelect={(v) => handleSingleSelect(currentQuestion.id, v)}
            />
          )}

          {/* multiple 타입 */}
          {currentQuestion.type === 'multiple' && (
            <MultipleChoiceOptions
              question={currentQuestion}
              value={(currentAnswer as string[] | undefined) ?? []}
              onToggle={(v) => handleMultipleToggle(currentQuestion.id, v)}
            />
          )}
        </CardContent>
      </Card>

      {/* 하단 네비게이션 Footer */}
      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex-1"
          size="lg"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>

        {currentQuestion.type === 'multiple' || !isCurrentAnswered ? (
          isLastQuestion ? (
            <Button
              onClick={() => submitSurvey()}
              disabled={!isCurrentAnswered || isSubmitting}
              className="flex-1"
              size="lg"
            >
              {isSubmitting ? '계산 중...' : '결과 확인하기'}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!isCurrentAnswered}
              className="flex-1"
              size="lg"
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )
        ) : (
          // single 타입은 자동진행이므로 수동 다음 버튼도 표시
          isLastQuestion ? (
            <Button
              onClick={() => submitSurvey()}
              disabled={!isCurrentAnswered || isSubmitting}
              className="flex-1"
              size="lg"
            >
              {isSubmitting ? '계산 중...' : '결과 확인하기'}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!isCurrentAnswered}
              className="flex-1"
              size="lg"
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )
        )}
      </div>

      {/* 면책 문구 */}
      <p className="text-xs text-center text-muted-foreground mt-4">
        이 결과는 참고용 자가점검 도구이며, 의사의 진단이나 치료를 대체하지 않습니다.
      </p>
    </div>
  )
}

// ============================================================
// SingleChoiceOptions 서브 컴포넌트
// ============================================================
function SingleChoiceOptions({
  question,
  value,
  onSelect,
}: {
  question: SurveyQuestion
  value: string | undefined
  onSelect: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      {question.options?.map((option) => {
        const isSelected = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg border text-left transition-colors min-h-[44px] ${
              isSelected
                ? 'border-primary bg-primary/5 text-zinc-900'
                : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
            }`}
          >
            <div
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                isSelected ? 'border-primary bg-primary' : 'border-zinc-300'
              }`}
            >
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="text-sm">{option}</span>
          </button>
        )
      })}
    </div>
  )
}

// ============================================================
// MultipleChoiceOptions 서브 컴포넌트
// ============================================================
function MultipleChoiceOptions({
  question,
  value,
  onToggle,
}: {
  question: SurveyQuestion
  value: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      {question.options?.map((option) => {
        const isChecked = value.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg border text-left transition-colors min-h-[44px] ${
              isChecked
                ? 'border-primary bg-primary/5 text-zinc-900'
                : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
            }`}
          >
            <Checkbox checked={isChecked} className="pointer-events-none" />
            <span className="text-sm">{option}</span>
          </button>
        )
      })}
      <p className="text-xs text-zinc-400 mt-1">복수 선택 가능</p>
    </div>
  )
}
