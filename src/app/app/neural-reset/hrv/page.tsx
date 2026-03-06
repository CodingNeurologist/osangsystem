'use client'

import { useCallback } from 'react'
import PPGMeasurement from '@/components/neural-reset/PPGMeasurement'
import type { HRVResult } from '@/lib/ppg/types'

export default function HRVPage() {
  const handleSessionComplete = useCallback(
    async (durationSec: number, result: HRVResult) => {
      // 1. 기존 reset_sessions에 세션 기록 (스트릭/배지용)
      const sessionPromise = fetch('/api/neural-reset/session', {
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
      }).catch(() => {})

      // 2. HRV 상세 측정 이력 저장 (추이 분석용)
      const hrvPromise = fetch('/api/neural-reset/hrv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mean_hr: result.timeDomain.meanHR,
          sdnn: result.timeDomain.sdnn,
          rmssd: result.timeDomain.rmssd,
          pnn50: result.timeDomain.pnn50,
          min_hr: result.timeDomain.minHR,
          max_hr: result.timeDomain.maxHR,
          nn_count: result.timeDomain.nnCount,
          lf_power: result.frequencyDomain?.lfPower ?? null,
          hf_power: result.frequencyDomain?.hfPower ?? null,
          lf_hf_ratio: result.frequencyDomain?.lfHfRatio ?? null,
          ectopic_count: result.arrhythmia.ectopicCount,
          ectopic_ratio: result.arrhythmia.ectopicRatio,
          arrhythmia_burden: result.arrhythmia.burden,
          confidence_score: result.confidenceScore,
          confidence_label: result.confidenceLabel,
          valid_beat_count: result.validBeatCount,
          clean_signal_ratio: result.cleanSignalRatio,
          measurement_duration: durationSec,
          interpretation_level: result.interpretation.level,
          interpretation_title: result.interpretation.title,
          rr_intervals: result.rrIntervals,
        }),
      }).catch(() => {})

      await Promise.all([sessionPromise, hrvPromise])
    },
    [],
  )

  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto">
      <PPGMeasurement onSessionComplete={handleSessionComplete} />
    </div>
  )
}
