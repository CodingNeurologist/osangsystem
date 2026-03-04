'use client'

import { useRouter } from 'next/navigation'
import SOSGuide from '@/components/neural-reset/SOSGuide'

export default function SOSPage() {
  const router = useRouter()

  const handleComplete = async (durationSec: number) => {
    try {
      await fetch('/api/neural-reset/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'sos',
          activityDetail: { type: 'grounding-breathing' },
          durationSec,
        }),
      })
    } catch {
      // 실패해도 UX 차단하지 않음
    }
    router.push('/app/neural-reset')
  }

  return (
    <SOSGuide
      onComplete={handleComplete}
      onClose={() => router.push('/app/neural-reset')}
    />
  )
}
