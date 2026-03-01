import type { Metadata } from 'next'
import BreathingGuide from '@/components/breathing/BreathingGuide'

export const metadata: Metadata = {
  title: '호흡 가이드',
}

export default function BreathingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          호흡 가이드
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          4초 들이쉬고 6초 내쉬는 이완 호흡으로 마음을 안정시켜 보세요.
        </p>
      </div>
      <BreathingGuide />
    </div>
  )
}
