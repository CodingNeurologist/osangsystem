// ============================================================
// PHQ-9 안전 프로토콜 배너 (20점 이상 시 필수 표시)
// ============================================================

import Link from 'next/link'
import { Phone, Heart, Activity } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface SafetyProtocolBannerProps {
  score: number
  crisisLine?: string
  crisisLineName?: string
  crisisLineHours?: string
  hospitalMessage?: string
}

export default function SafetyProtocolBanner({
  score,
  crisisLine = '1577-0199',
  crisisLineName = '정신건강위기상담전화',
  crisisLineHours = '24시간 운영',
  hospitalMessage = '오상신경외과에서도 상담을 받으실 수 있습니다.',
}: SafetyProtocolBannerProps) {
  // PHQ-9 20점 이상: 위기 대응 필수 표시
  if (score >= 20) {
    return (
      <Alert
        variant="destructive"
        className="border-red-300 bg-red-50"
        aria-live="assertive"
        aria-label="긴급 위기 안내"
      >
        <Phone className="h-4 w-4" />
        <AlertTitle className="text-red-800">
          지금 많이 힘드시죠. 혼자 감당하지 않으셔도 됩니다.
        </AlertTitle>
        <AlertDescription className="text-red-700">
          <p className="mb-3">
            점수가 높게 나왔습니다. 전문적인 도움을 받으시길 강력히 권장합니다.
          </p>
          <div className="space-y-2">
            <a
              href={`tel:${crisisLine}`}
              className="flex items-center gap-2 bg-red-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-red-700 transition-colors"
              aria-label={`${crisisLineName} ${crisisLine}에 전화하기`}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <div>
                <p className="font-semibold">{crisisLineName}</p>
                <p className="text-red-100 text-xs">{crisisLine} · {crisisLineHours}</p>
              </div>
            </a>
            <p className="text-xs text-red-600">{hospitalMessage}</p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // PHQ-9 15~19점: 병원 방문 강력 권고
  if (score >= 15) {
    return (
      <Alert className="border-orange-300 bg-orange-50">
        <Activity className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">전문의 상담을 받아보세요</AlertTitle>
        <AlertDescription className="text-orange-700">
          <p>
            중증 수준의 우울 증상이 나타나고 있습니다. 가능한 빨리 전문의와 상담하시기 바랍니다.
          </p>
          <p className="text-xs text-orange-600 mt-2">{hospitalMessage}</p>
        </AlertDescription>
      </Alert>
    )
  }

  // PHQ-9 10~14점: 상담 권장
  if (score >= 10) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Activity className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">전문의 상담을 고려해 보세요</AlertTitle>
        <AlertDescription className="text-yellow-700">
          중등도 수준의 우울 증상이 있습니다. 전문의 상담을 통해 더 나은 관리 방법을 찾아보세요.
        </AlertDescription>
      </Alert>
    )
  }

  // PHQ-9 5~9점: 자기 관리 도구 안내
  if (score >= 5) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Heart className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">자기 관리를 계속해 보세요</AlertTitle>
        <AlertDescription className="text-blue-700">
          <p>
            경미한 증상이 있습니다. 호흡 훈련과 감사일기 작성이 도움이 될 수 있습니다.
          </p>
          <div className="flex gap-2 mt-3">
            <Link href="/app/breathing" className="text-xs text-blue-600 underline">
              호흡 가이드
            </Link>
            <span className="text-blue-300">·</span>
            <Link href="/app/journal" className="text-xs text-blue-600 underline">
              감사일기
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
