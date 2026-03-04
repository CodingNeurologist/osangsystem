'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback } from 'react'
import BreathingGuide from '@/components/breathing/BreathingGuide'

function BreathingContent() {
  const searchParams = useSearchParams()
  const patternId = searchParams.get('pattern') ?? undefined

  const handleSessionComplete = useCallback(async (patternId: string, cycles: number, durationSec: number) => {
    try {
      await fetch('/api/neural-reset/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'breathing',
          activity_detail: { pattern: patternId, cycles },
          duration_sec: durationSec,
          completed: true,
        }),
      })
    } catch {
      // 세션 기록 실패는 무시 (사용자 경험에 영향 없음)
    }
  }, [])

  return (
    <BreathingGuide
      initialPatternId={patternId}
      onSessionComplete={handleSessionComplete}
    />
  )
}

export default function BreathingPage() {
  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto">
      <Suspense fallback={<div className="h-96" />}>
        <BreathingContent />
      </Suspense>
    </div>
  )
}
