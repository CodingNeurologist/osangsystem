'use client'

import { Camera, Fingerprint, Timer, Lightbulb } from 'lucide-react'
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
    description: '후면 카메라 렌즈와 플래시를 동시에 덮도록 검지 또는 중지 첫째 마디를 가볍게 올려주세요.',
  },
  {
    icon: Lightbulb,
    title: '플래시 위치 확인',
    description: '최근 스마트폰은 카메라와 플래시가 떨어져 있습니다. 손가락 면적을 넓게 대어 플래시 빛이 손가락을 통과해 카메라에 도달하도록 해주세요.',
  },
  {
    icon: Camera,
    title: '자세 유지',
    description: '플래시가 켜지면 손가락을 움직이지 말고 가만히 유지해 주세요. 팔꿈치를 테이블에 올려놓으면 안정적입니다.',
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
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* 폰 바디 */}
            <rect x="50" y="20" width="100" height="160" rx="12" fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="2" />
            {/* 카메라 렌즈 */}
            <circle cx="85" cy="50" r="14" fill="#27272a" />
            <circle cx="85" cy="50" r="10" fill="#3f3f46" />
            <circle cx="85" cy="50" r="6" fill="#52525b" />
            {/* 플래시 (카메라와 떨어진 위치) */}
            <circle cx="120" cy="42" r="6" fill="#fbbf24" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* 카메라-플래시 사이 거리 표시 화살표 */}
            <line x1="95" y1="46" x2="112" y2="43" stroke="#a1a1aa" strokeWidth="0.8" strokeDasharray="2 2" />
            {/* 손가락 (넓게 덮는 모양) */}
            <ellipse cx="102" cy="52" rx="38" ry="24" fill="#fecaca" opacity="0.6" />
            <ellipse cx="102" cy="52" rx="34" ry="20" fill="#fca5a5" opacity="0.4" />
            {/* 빛 투과 표시 */}
            <path d="M120 42 Q110 48 85 50" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.5" strokeDasharray="3 3">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
            </path>
            {/* 맥박 표시 */}
            <path d="M60 135 L75 135 L80 125 L90 145 L100 115 L110 150 L115 130 L120 135 L140 135"
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

      {/* 측정 팁 */}
      <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 space-y-2">
        <p className="text-xs font-medium text-sky-700">측정 정확도를 높이려면</p>
        <ul className="text-xs text-sky-600 leading-relaxed space-y-1">
          <li>- 카메라 프리뷰가 균일한 붉은색으로 보이면 올바른 위치입니다</li>
          <li>- 너무 세게 누르면 혈류가 차단됩니다. 살짝 얹는 느낌으로 대세요</li>
          <li>- 팔꿈치를 고정하면 손떨림을 줄일 수 있습니다</li>
          <li>- 측정 중 말하거나 움직이지 마세요</li>
        </ul>
      </div>

      {/* 주의사항 */}
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
        <p className="text-xs text-amber-700 leading-relaxed">
          이 기능은 의료기기가 아니며, 참고용으로만 사용하세요.
          정확한 HRV 측정을 위해서는 전문 의료장비를 이용해 주세요.
          부정맥이 있는 경우 측정이 어려울 수 있습니다.
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
