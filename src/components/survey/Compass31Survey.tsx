'use client'

import { useState, useCallback } from 'react'
import compass31Data from '@/data/questionnaire-compass31.json'
import type { Questionnaire, Compass31Result } from '@/types'
import { calcCompass31Score } from '@/lib/scoring'
import Compass31ResultView from './Compass31Result'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

const questionnaire = compass31Data as unknown as Questionnaire

// 도메인별로 문항 그룹화
const DOMAIN_GROUPS = [
  { id: 'oi', label: '기립성 저혈압 증상', description: '누워 있다가 일어날 때 나타나는 증상' },
  { id: 'vm', label: '혈관운동 증상', description: '피부 색상 변화 및 홍조 관련 증상' },
  { id: 'sm', label: '분비 기능 증상', description: '땀, 구강·눈 건조 등 분비 관련 증상' },
  { id: 'gi', label: '위장관 증상', description: '소화, 식욕, 배변 관련 증상' },
  { id: 'bl', label: '방광 증상', description: '소변 관련 증상' },
  { id: 'pm', label: '동공 및 시각 증상', description: '빛 적응, 시력 관련 증상' },
]

export default function Compass31Survey() {
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0)
  const [result, setResult] = useState<Compass31Result | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentDomain = DOMAIN_GROUPS[currentDomainIndex]
  const domainItems = questionnaire.items.filter(
    (item) => item.domain === currentDomain.id
  )
  const totalDomains = DOMAIN_GROUPS.length

  const answeredInCurrentDomain = domainItems.every(
    (item) => responses[item.id] !== undefined
  )

  const totalItems = questionnaire.items.length
  const answeredTotal = Object.keys(responses).length
  const progressPercent = Math.round((answeredTotal / totalItems) * 100)

  const handleAnswer = useCallback((itemId: string, value: number) => {
    setResponses((prev) => ({ ...prev, [itemId]: value }))
  }, [])

  function handleNext() {
    if (currentDomainIndex < totalDomains - 1) {
      setCurrentDomainIndex((i) => i + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handlePrev() {
    if (currentDomainIndex > 0) {
      setCurrentDomainIndex((i) => i - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function handleSubmit() {
    const allAnswered = questionnaire.items.every(
      (item) => responses[item.id] !== undefined
    )
    if (!allAnswered) return

    setIsSubmitting(true)

    const calcResult = calcCompass31Score(responses, questionnaire)
    setResult(calcResult)

    // 익명 응답 저장 (세션 기반)
    try {
      await fetch('/api/check/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          total_score: calcResult.total_score,
          domain_scores: calcResult.domain_scores,
          severity_level: calcResult.severity_level,
        }),
      })
    } catch {
      // 저장 실패해도 결과는 표시
    }

    setIsSubmitting(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (result) {
    return <Compass31ResultView result={result} questionnaire={questionnaire} />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 진행률 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-zinc-600 mb-2">
          <span>
            {currentDomainIndex + 1} / {totalDomains} 영역
          </span>
          <span>{progressPercent}% 완료</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* 도메인 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-900">{currentDomain.label}</h2>
        <p className="text-sm text-zinc-500 mt-1">{currentDomain.description}</p>
      </div>

      {/* 문항 목록 */}
      <div className="space-y-6">
        {domainItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-zinc-800 mb-4">
                <span className="text-primary font-bold mr-2">{item.number}.</span>
                {item.text}
              </p>
              <div className="space-y-2">
                {item.options.map((option) => {
                  const isSelected = responses[item.id] === option.value
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
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
                        className="w-4 h-4 text-primary focus:ring-primary"
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

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3 mt-8">
        {currentDomainIndex > 0 && (
          <Button
            variant="outline"
            type="button"
            onClick={handlePrev}
            className="flex-1"
          >
            이전
          </Button>
        )}

        {currentDomainIndex < totalDomains - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!answeredInCurrentDomain}
            className="flex-1"
          >
            다음 영역
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!answeredInCurrentDomain || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? '결과 계산 중...' : '결과 확인하기'}
          </Button>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">
        {questionnaire.footer_disclaimer}
      </p>
    </div>
  )
}
