import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Phone, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: '치료 안내',
}

const TREATMENT_SECTIONS = [
  {
    id: 'what',
    title: '자율신경실조증이란?',
    content: `자율신경계는 심장 박동, 혈압, 소화, 체온 조절 등 우리 몸의 자동적인 기능을 담당합니다.
자율신경실조증은 이 자율신경계가 제 기능을 하지 못해 다양한 신체 증상이 나타나는 상태입니다.

주요 증상으로는 어지럼증, 두근거림, 발한 이상, 소화 불량, 피로감, 두통 등이 있으며,
증상이 다양하고 비특이적이어서 진단이 어려울 수 있습니다.`,
  },
  {
    id: 'when',
    title: '언제 병원을 방문해야 할까요?',
    content: `다음과 같은 경우에는 전문의 진료를 권장합니다:

• 어지럼증이나 실신이 자주 발생하는 경우
• 두근거림이나 흉통이 지속되는 경우
• 일상생활에 지장을 줄 만큼 피로감이 심한 경우
• 소화 장애가 만성적으로 지속되는 경우
• 기존 치료에도 증상이 호전되지 않는 경우`,
  },
  {
    id: 'treatment',
    title: '치료 방법',
    content: `자율신경실조증 치료는 원인과 증상에 따라 다양한 방법을 적용합니다:

생활 습관 교정
규칙적인 수면, 균형 잡힌 식사, 적절한 수분 섭취, 규칙적인 운동이 도움이 됩니다.

스트레스 관리
명상, 호흡 훈련, 이완 요법 등이 자율신경계 안정에 효과적입니다.

약물 치료
증상에 따라 혈압 조절제, 항불안제 등을 처방받을 수 있습니다.

재활 치료
전정 재활, 물리 치료 등 맞춤형 재활 프로그램을 진행할 수 있습니다.`,
  },
  {
    id: 'selfcare',
    title: '자가 관리 방법',
    content: `일상에서 실천할 수 있는 자가 관리 방법입니다:

• 규칙적인 시간에 기상하고 취침하세요
• 충분한 수분 섭취 (하루 2L 이상)를 유지하세요
• 갑자기 일어설 때는 천천히 자세를 바꾸세요
• 카페인과 알코올 섭취를 줄이세요
• 오상케어의 호흡 가이드와 명상음악을 활용하세요`,
  },
]

export default function TreatmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">치료 안내</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          자율신경실조증과 스트레스 관련 치료에 대한 정보를 안내드립니다.
        </p>
      </div>

      {/* 병원 연락처 카드 */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <h2 className="font-semibold text-foreground mb-2">오상신경외과 진료 예약</h2>
          <p className="text-sm text-muted-foreground mb-3">
            증상이 걱정되신다면 전문의 상담을 받아보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild className="w-full sm:w-auto">
              <a href="tel:1599-5453">
                <Phone className="h-4 w-4 mr-2" />
                전화 예약 (1599-5453)
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/app/contact">
                연락처 전체 보기
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 위기 상담 안내 */}
      <Alert variant="destructive" className="bg-red-50 border-red-300">
        <AlertDescription>
          <p className="font-semibold text-sm">정신건강 위기 상담이 필요하신가요?</p>
          <p className="text-sm mt-1">
            정신건강위기상담전화{' '}
            <a href="tel:1577-0199" className="font-semibold underline">
              1577-0199
            </a>
            {' '}(24시간 운영)
          </p>
        </AlertDescription>
      </Alert>

      {/* 치료 안내 콘텐츠 */}
      <div className="space-y-4">
        {TREATMENT_SECTIONS.map((section) => (
          <Card key={section.id}>
            <CardContent className="pt-6">
              <h2 className="font-semibold text-zinc-800 mb-3">{section.title}</h2>
              <p className="text-sm text-zinc-600 whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 면책 고지 */}
      <p className="text-xs text-center text-muted-foreground mt-4">
        본 내용은 일반적인 건강 정보 제공을 목적으로 하며, 전문 의료인의 진단 및 치료를
        대체하지 않습니다. 개인 증상에 대한 정확한 진단은 반드시 의료기관을 방문하시기 바랍니다.
      </p>
    </div>
  )
}
