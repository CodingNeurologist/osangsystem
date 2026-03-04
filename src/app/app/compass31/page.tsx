import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '정밀 자율신경 검사 (COMPASS-31)',
}

const DOMAINS = [
  '기립성 저혈압 관련 증상',
  '혈관운동 증상',
  '분비 기능 관련 증상',
  '위장관 증상',
  '방광 관련 증상',
  '동공 및 시각 증상',
]

export default function Compass31Page() {
  return (
    <div className="space-y-6 slide-up">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            정밀 자율신경 검사
          </CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            COMPASS-31 기반 자율신경 기능 평가 설문입니다.
            6개 영역, 총 31개 문항으로 구성되어 있으며 약 10분 소요됩니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 안내 박스 */}
          <div className="rounded-lg p-4 text-sm space-y-1 bg-primary/5 text-zinc-700">
            <p>이 설문은 의료 전문가의 진단을 대체하지 않습니다.</p>
            <p>결과는 참고 목적으로만 활용하시고, 증상이 지속되면 의료진과 상담하세요.</p>
          </div>

          {/* 영역 목록 */}
          <div className="space-y-2">
            {DOMAINS.map((domain, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Badge className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs p-0">
                  {i + 1}
                </Badge>
                <span className="text-foreground">{domain}</span>
              </div>
            ))}
          </div>

          <Button className="w-full py-4" size="lg" asChild>
            <Link href="/app/compass31/survey">검사 시작하기</Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            본 결과는 전문 의료인의 진단을 대체하지 않습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
