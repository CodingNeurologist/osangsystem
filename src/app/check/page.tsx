import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Moon,
  Heart,
  Brain,
  Activity,
  Utensils,
  Droplets,
  Bone,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '자율신경 스트레스 자가체크',
}

const ICON_MAP: Record<string, LucideIcon> = {
  Moon,
  Heart,
  Brain,
  Activity,
  Utensils,
  Droplets,
  Bone,
  Shield,
}

const CATEGORIES = [
  { icon: 'Moon', name: '수면습관', color: 'bg-indigo-50 text-indigo-600' },
  { icon: 'Heart', name: '기분/감정', color: 'bg-rose-50 text-rose-600' },
  { icon: 'Brain', name: '뇌기능/인지', color: 'bg-violet-50 text-violet-600' },
  { icon: 'Activity', name: '순환기계', color: 'bg-red-50 text-red-600' },
  { icon: 'Utensils', name: '소화기계', color: 'bg-amber-50 text-amber-600' },
  { icon: 'Droplets', name: '비뇨생식기계', color: 'bg-cyan-50 text-cyan-600' },
  { icon: 'Bone', name: '근골격/통증', color: 'bg-orange-50 text-orange-600' },
  { icon: 'Shield', name: '면역/호르몬', color: 'bg-emerald-50 text-emerald-600' },
]

export default function CheckPage() {
  return (
    <div className="min-h-screen px-4 py-10 bg-zinc-50">
      <div className="max-w-md mx-auto space-y-6 fade-in">
        {/* 로고 헤더 */}
        <div className="text-center pt-4 pb-2">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <img src="/logo-horizontal.png" alt="오상케어" className="h-8 w-auto object-contain" />
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              자율신경 스트레스 자가체크
            </CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              8개 영역의 자율신경 관련 증상을 간편하게 점검해보세요.
              체크리스트 형식으로 약 3-5분 소요됩니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 안내 박스 */}
            <div className="rounded-lg p-4 text-sm space-y-1 bg-primary/5 text-zinc-700">
              <p>이 체크리스트는 의료 전문가의 진단을 대체하지 않습니다.</p>
              <p>결과는 참고 목적으로만 활용하시고, 증상이 지속되면 의료진과 상담하세요.</p>
            </div>

            {/* 카테고리 프리뷰 */}
            <div className="grid grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.icon] ?? Activity
                return (
                  <div key={cat.name} className="flex flex-col items-center gap-1.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] text-zinc-500 text-center leading-tight">
                      {cat.name}
                    </span>
                  </div>
                )
              })}
            </div>

            <Button className="w-full py-4" size="lg" asChild>
              <Link href="/check/survey">자가체크 시작하기</Link>
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              본 결과는 전문 의료인의 진단을 대체하지 않습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
