'use client'

import { useState, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StressCheckProgressBar from './StressCheckProgressBar'
import StressCheckCategoryPage from './StressCheckCategoryPage'
import StressCheckLifestylePage from './StressCheckLifestylePage'
import StressCheckResultView from './StressCheckResult'
import {
  STRESS_CHECK_CATEGORIES,
  LIFESTYLE_QUESTIONS,
  STRESS_CHECK_SEVERITY_LEVELS,
} from '@/data/stresscheck'
import { calculateStressCheckScore } from '@/utils/surveyScoring'
import type { StressCheckScoreResult } from '@/types'

const TOTAL_PAGES = STRESS_CHECK_CATEGORIES.length + 1 // 8 categories + 1 lifestyle

export default function StressCheckSurvey() {
  const [currentPage, setCurrentPage] = useState(0)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [lifestyleAnswers, setLifestyleAnswers] = useState<Record<string, string | number>>({
    'stress-level': 50,
  })
  const [result, setResult] = useState<StressCheckScoreResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [isAnimating, setIsAnimating] = useState(false)
  const startTimeRef = useRef(Date.now())

  const handleToggle = useCallback((itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }, [])

  const handleLifestyleAnswer = useCallback((questionId: string, value: string | number) => {
    setLifestyleAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }, [])

  const animatePage = useCallback((newPage: number, dir: 'forward' | 'backward') => {
    setDirection(dir)
    setIsAnimating(true)
    // 페이드아웃 후 페이지 변경 + 페이드인
    setTimeout(() => {
      setCurrentPage(newPage)
      setTimeout(() => {
        setIsAnimating(false)
      }, 50)
    }, 150)
  }, [])

  const goNext = useCallback(() => {
    if (currentPage < TOTAL_PAGES - 1) {
      animatePage(currentPage + 1, 'forward')
    }
  }, [currentPage, animatePage])

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      animatePage(currentPage - 1, 'backward')
    }
  }, [currentPage, animatePage])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)

    const scoreResult = calculateStressCheckScore(
      checkedItems,
      lifestyleAnswers,
      STRESS_CHECK_CATEGORIES,
      STRESS_CHECK_SEVERITY_LEVELS
    )

    // API 저장
    try {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000)

      const categoryScoresMap: Record<string, number> = {}
      for (const cs of scoreResult.categoryScores) {
        categoryScoresMap[cs.categoryId] = cs.percentage
      }

      await fetch('/api/check/stress-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: { ...checkedItems, ...lifestyleAnswers },
          category_scores: categoryScoresMap,
          total_score: Math.round(scoreResult.overallScore),
          severity_level: scoreResult.severity,
          duration,
        }),
      })
    } catch {
      // 저장 실패해도 결과는 표시
    }

    setResult(scoreResult)
    setIsSubmitting(false)
  }, [checkedItems, lifestyleAnswers])

  // 결과 화면
  if (result) {
    return <StressCheckResultView result={result} />
  }

  const isLastPage = currentPage === TOTAL_PAGES - 1
  const isCategoryPage = currentPage < STRESS_CHECK_CATEGORIES.length
  const currentCategory = isCategoryPage ? STRESS_CHECK_CATEGORIES[currentPage] : null

  return (
    <div className="min-h-screen px-4 py-6 bg-zinc-50">
      <div className="max-w-md mx-auto space-y-6">
        {/* 프로그레스 바 */}
        <StressCheckProgressBar
          categories={STRESS_CHECK_CATEGORIES}
          currentPage={currentPage}
          totalPages={TOTAL_PAGES}
        />

        {/* 페이지 콘텐츠 */}
        <div
          className={`
            transition-all duration-200 ease-out
            ${isAnimating
              ? `opacity-0 ${direction === 'forward' ? 'translate-x-4' : '-translate-x-4'}`
              : 'opacity-100 translate-x-0'
            }
          `}
        >
          {isCategoryPage && currentCategory && (
            <StressCheckCategoryPage
              category={currentCategory}
              checkedItems={checkedItems}
              onToggle={handleToggle}
            />
          )}

          {!isCategoryPage && (
            <StressCheckLifestylePage
              questions={LIFESTYLE_QUESTIONS}
              answers={lifestyleAnswers}
              onAnswer={handleLifestyleAnswer}
            />
          )}
        </div>

        {/* 네비게이션 */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={goPrev}
            disabled={currentPage === 0 || isAnimating}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            이전
          </Button>

          {isLastPage ? (
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || isAnimating}
              className="flex-1"
            >
              {isSubmitting ? (
                '분석 중...'
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  결과 확인하기
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={goNext}
              disabled={isAnimating}
              className="flex-1"
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* 면책 문구 */}
        <p className="text-xs text-center text-muted-foreground">
          본 체크리스트는 의학적 진단을 대체하지 않습니다.
        </p>
      </div>
    </div>
  )
}
