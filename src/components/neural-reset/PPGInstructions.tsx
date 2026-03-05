'use client'

import { Camera, Fingerprint, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PPGInstructionsProps {
  onStart: () => void
  isCameraSupported: boolean
}

const STEPS = [
  {
    icon: Fingerprint,
    title: '손가락 배치',
    description: '후면 카메라 렌즈 위에 검지를 가볍게 올려주세요. 플래시도 함께 덮이도록 해주세요.',
  },
  {
    icon: Camera,
    title: '자세 유지',
    description: '플래시가 켜지면 손가락을 움직이지 말고 가만히 유지해 주세요.',
  },
  {
    icon: Timer,
    title: '측정 시간',
    description: '보정 10초 + 측정 약 90초, 총 2분 정도 소요됩니다.',
  },
]

export default function PPGInstructions({ onStart, isCameraSupported }: PPGInstructionsProps) {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-xl font-semibold text-zinc-900">심박변이도 측정</h1>
          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
            베타
          </Badge>
        </div>
        <p className="text-sm text-zinc-500">
          카메라를 이용하여 맥박을 감지하고 심박변이도(HRV)를 분석합니다
        </p>
      </div>

      {/* 일러스트 */}
      <div className="flex justify-center py-4">
        <div className="relative w-48 h-48">
          {/* 간단한 손가락+카메라 일러스트 (SVG) */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* 폰 바디 */}
            <rect x="50" y="20" width="100" height="160" rx="12" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="2" />
            {/* 카메라 렌즈 */}
            <circle cx="100" cy="50" r="14" fill="#27272a" />
            <circle cx="100" cy="50" r="10" fill="#3f3f46" />
            <circle cx="100" cy="50" r="6" fill="#52525b" />
            {/* 플래시 */}
            <circle cx="120" cy="38" r="5" fill="#fbbf24" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* 손가락 */}
            <ellipse cx="100" cy="55" rx="30" ry="22" fill="#fecaca" opacity="0.7" />
            <ellipse cx="100" cy="55" rx="26" ry="18" fill="#fca5a5" opacity="0.5" />
            {/* 맥박 표시 */}
            <path d="M60 130 L75 130 L80 120 L90 140 L100 110 L110 145 L115 125 L120 130 L140 130"
              fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>
      </div>

      {/* 단계별 안내 */}
      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm shrink-0">
              <step.icon className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-zinc-800">{step.title}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 주의사항 */}
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
        <p className="text-xs text-amber-700 leading-relaxed">
          이 기능은 의료기기가 아니며, 참고용으로만 사용하세요.
          정확한 HRV 측정을 위해서는 전문 의료장비를 이용해 주세요.
        </p>
      </div>

      {/* 시작 버튼 */}
      <Button
        onClick={onStart}
        disabled={!isCameraSupported}
        className="w-full h-12"
        size="lg"
      >
        {isCameraSupported ? '측정 시작' : '카메라를 지원하지 않는 브라우저입니다'}
      </Button>
    </div>
  )
}
