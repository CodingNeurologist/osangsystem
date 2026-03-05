'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Questionnaire, SurveyType } from '@/types'
import { calcSumScore, calcAsrsScore } from '@/lib/scoring'
import SurveyResult from './SurveyResult'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

interface TrackingSurveyProps {
  questionnaire: Questionnaire
  surveyType: SurveyType
}

export default function TrackingSurvey({ questionnaire, surveyType }: TrackingSurveyProps) {
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(0)
  type ResultType = ReturnType<typeof calcSumScore> | ReturnType<typeof calcAsrsScore>
  const [result, setResult] = useState<ResultType | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ASRS는 Part A/B로 나눔, 나머지는 3문항씩 페이지 분할
  const ITEMS_PER_PAGE = surveyType === 'asrs' ? 6 : 3
  const pages = chunkArray(questionnaire.items, ITEMS_PER_PAGE)
  const currentItems = pages[currentPage] ?? []
  const totalPages = pages.length

  const answeredOnCurrentPage = currentItems.every(
    (item) => responses[item.id] !== undefined
  )

  const totalAnswered = Object.keys(responses).length
  const totalItems = questionnaire.items.length
  const progressPercent = Math.round((totalAnswered / totalItems) * 100)

  // 페이지 변경 시 스크롤 맨 위로 (모바일 대응)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentPage])

  const handleAnswer = useCallback((itemId: string, value: number) => {
    setResponses((prev) => ({ ...prev, [itemId]: value }))
  }, [])

  function handleNext() {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1)
    }
  }

  function handlePrev() {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1)
    }
  }

  async function handleSubmit() {
    const allAnswered = questionnaire.items.every(
      (item) => responses[item.id] !== undefined
    )
    if (!allAnswered) return

    setIsSaving(true)
    setSaveError(null)

    const calcResult =
      surveyType === 'asrs'
        ? calcAsrsScore(responses, questionnaire)
        : calcSumScore(responses, questionnaire)

    try {
      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_type: surveyType,
          responses,
          total_score: calcResult.total_score,
          severity_level: calcResult.severity_level,
          crisis_flag: calcResult.crisis_flag,
        }),
      })

      if (!res.ok) {
        setSaveError('응답 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
    } catch {
      setSaveError('네트워크 오류가 발생했습니다.')
    }

    setResult(calcResult)
    setIsSaving(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 결과 화면
  if (result) {
    return (
      <SurveyResult
        result={result}
        questionnaire={questionnaire}
        surveyType={surveyType}
        onRetake={() => {
          setResponses({})
          setCurrentPage(0)
          setResult(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">{questionnaire.title}</h2>
        <p className="text-sm text-zinc-600 mt-1">{questionnaire.description}</p>
      </div>

      {/* 진행률 */}
      <div>
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>
            {currentPage + 1} / {totalPages} 페이지
          </span>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* 문항 */}
      <div className="space-y-4">
        {currentItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              {surveyType === 'asrs' && item.part && (
                <p className="text-xs text-primary font-medium mb-1">Part {item.part}</p>
              )}
              <p className="text-sm font-medium text-zinc-800 mb-3">
                <span className="text-primary font-bold mr-1.5">{item.number}.</span>
                {item.text}
              </p>
              <div className="space-y-2">
                {item.options.map((option) => {
                  const isSelected = responses[item.id] === option.value
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-zinc-900'
                          : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={item.id}
                        value={option.value}
                        checked={isSelected}
                        onChange={() => handleAnswer(item.id, option.value)}
                        className="w-4 h-4 text-primary focus:ring-primary flex-shrink-0"
                      />
                      <span className="text-sm">{option.text}</span>
                    </label>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {saveError && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-4 py-3" role="alert">
          {saveError}
        </p>
      )}

      {/* 네비게이션 */}
      <div className="flex gap-3">
        {currentPage > 0 && (
          <Button variant="outline" type="button" onClick={handlePrev} className="flex-1">
            이전
          </Button>
        )}
        {currentPage < totalPages - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!answeredOnCurrentPage}
            className="flex-1"
          >
            다음
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!answeredOnCurrentPage || isSaving}
            className="flex-1"
          >
            {isSaving ? '저장 중...' : '결과 확인'}
          </Button>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">{questionnaire.footer_disclaimer}</p>
    </div>
  )
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}
