'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { SurveyType, Questionnaire } from '@/types'
import TrackingSurvey from './TrackingSurvey'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import phq9Data from '@/data/questionnaire-phq9.json'
import gad7Data from '@/data/questionnaire-gad7.json'
import asrsData from '@/data/questionnaire-asrs.json'

const QUESTIONNAIRES: Record<SurveyType, Questionnaire> = {
  phq9: phq9Data as unknown as Questionnaire,
  gad7: gad7Data as unknown as Questionnaire,
  asrs: asrsData as unknown as Questionnaire,
}

const SURVEY_OPTIONS = [
  {
    type: 'phq9' as SurveyType,
    label: 'PHQ-9',
    description: '우울 증상 선별 검사',
    items: 9,
    minutes: 3,
  },
  {
    type: 'gad7' as SurveyType,
    label: 'GAD-7',
    description: '불안 장애 선별 검사',
    items: 7,
    minutes: 3,
  },
  {
    type: 'asrs' as SurveyType,
    label: 'ASRS',
    description: 'ADHD 자가보고 척도',
    items: 18,
    minutes: 5,
  },
]

export default function SurveySelector() {
  const [selectedType, setSelectedType] = useState<SurveyType | null>(null)

  if (selectedType) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelectedType(null)}
          className="text-sm text-zinc-500 hover:text-zinc-700 mb-5 flex items-center gap-1"
        >
          &larr; 설문 선택으로 돌아가기
        </button>
        <TrackingSurvey
          questionnaire={QUESTIONNAIRES[selectedType]}
          surveyType={selectedType}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {SURVEY_OPTIONS.map((option) => (
        <Card
          key={option.type}
          className="cursor-pointer transition-colors hover:bg-zinc-50"
          onClick={() => setSelectedType(option.type)}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-800">{option.label}</h3>
                <p className="text-sm text-zinc-600 mt-0.5">{option.description}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {option.items}문항 · 약 {option.minutes}분
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-400" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="pt-2">
        <p className="text-xs text-center text-muted-foreground">
          설문 응답은 언제든 가능하며, 주기는 자유롭게 선택하세요.
        </p>
      </div>
    </div>
  )
}
