'use client'

import { useCallback } from 'react'
import PPGMeasurement from '@/components/neural-reset/PPGMeasurement'
import type { HRVResult } from '@/lib/ppg/types'

export default function HRVPage() {
  const handleSessionComplete = useCallback(
    async (durationSec: number, result: HRVResult) => {
      try {
        await fetch('/api/neural-reset/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_type: 'hrv',
            activity_detail: {
              meanHR: result.timeDomain.meanHR,
              rmssd: result.timeDomain.rmssd,
              sdnn: result.timeDomain.sdnn,
              pnn50: result.timeDomain.pnn50,
              confidence: result.confidenceScore,
              validBeats: result.validBeatCount,
              arrhythmiaBurden: result.arrhythmia.burden,
              ectopicRatio: result.arrhythmia.ectopicRatio,
            },
            duration_sec: durationSec,
            completed: true,
          }),
        })
      } catch {
        // 세션 기록 실패 무시
      }
    },
    [],
  )

  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto">
      <PPGMeasurement onSessionComplete={handleSessionComplete} />
    </div>
  )
}
