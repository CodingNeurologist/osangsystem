'use client'

import { C } from '@/components/neural-reset/somatic-illustrations/constants'

interface BreathingFaceProps {
  /** 'inhale' | 'exhale' | 'hold1' | 'hold2' | 'idle' | 'done' */
  phase: string
  /** 0~1 progress within current phase */
  progress: number
}

/**
 * 소마틱 일러스트와 동일한 그림체의 편안한 얼굴 SVG.
 * 흡기 시 코/입이 열리고, 호기 시 입을 오므려 내쉬는 애니메이션.
 */
export default function BreathingFace({ phase, progress }: BreathingFaceProps) {
  const isInhale = phase === 'inhale'
  const isExhale = phase === 'exhale'
  const isHold = phase === 'hold1' || phase === 'hold2'
  const isActive = isInhale || isExhale || isHold

  // 흡기: 가슴이 부풀어오르는 효과 (어깨가 약간 올라감)
  const shoulderLift = isInhale ? -2 * progress : isExhale ? -2 * (1 - progress) : isHold && phase === 'hold1' ? -2 : 0
  // 가슴 확장
  const chestExpand = isInhale ? 3 * progress : isExhale ? 3 * (1 - progress) : isHold && phase === 'hold1' ? 3 : 0

  return (
    <svg viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* 부드러운 배경 원 */}
      <circle cx="80" cy="95" r="78" fill={C.warmBg} />

      {/* 몸통 */}
      <rect
        x={52 - chestExpand / 2}
        y={120 + shoulderLift}
        rx="14"
        width={56 + chestExpand}
        height="60"
        fill={C.top}
      />
      <rect
        x={52 - chestExpand / 2}
        y={120 + shoulderLift}
        rx="14"
        width={56 + chestExpand}
        height="60"
        fill={C.topShadow}
        opacity={0.2}
      />

      {/* 어깨 라운딩 */}
      <ellipse cx={52 - chestExpand / 2 + 6} cy={126 + shoulderLift} rx="10" ry="8" fill={C.top} />
      <ellipse cx={108 + chestExpand / 2 - 6} cy={126 + shoulderLift} rx="10" ry="8" fill={C.top} />

      {/* 목 */}
      <rect x="70" y={108 + shoulderLift} rx="5" width="20" height="16" fill={C.skin} />

      {/* 머리 */}
      <circle cx="80" cy="65" r="32" fill={C.skin} />

      {/* 머리카락 */}
      <path d="M48 58 Q48 28 80 24 Q112 28 112 58" fill={C.hair} />
      <path d="M50 58 Q50 32 80 28 Q110 32 110 58" fill={C.hairLight} opacity={0.3} />

      {/* 눈 - 편안하게 감은 상태 */}
      {isActive ? (
        <>
          {/* 감은 눈 (편안한 곡선) */}
          <path d="M64 62 Q68 66 72 62" stroke={C.eye} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M88 62 Q92 66 96 62" stroke={C.eye} strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          {/* 뜬 눈 */}
          <circle cx="68" cy="62" r="3" fill={C.eye} />
          <circle cx="92" cy="62" r="3" fill={C.eye} />
          <circle cx="69" cy="61" r="1" fill="white" />
          <circle cx="93" cy="61" r="1" fill="white" />
        </>
      )}

      {/* 볼 터치 */}
      <ellipse cx="56" cy="72" rx="7" ry="4" fill={C.cheek} opacity={0.4} />
      <ellipse cx="104" cy="72" rx="7" ry="4" fill={C.cheek} opacity={0.4} />

      {/* 코 */}
      <path d="M78 68 Q80 73 82 68" stroke={C.skinShadow} strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* 입 - 호흡 상태에 따라 변화 */}
      {isInhale ? (
        // 들이쉬기: 입을 살짝 벌림 (코로 들이쉬는 느낌)
        <g>
          <ellipse cx="80" cy="80" rx={3 + progress * 2} ry={2 + progress * 2} fill={C.mouth} opacity={0.6} />
          {/* 코로 들이쉬는 공기 표시 */}
          <g opacity={0.3 + progress * 0.3}>
            <path d={`M74 ${65 - progress * 8} L78 68`} stroke={C.breathe} strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
            <path d={`M86 ${65 - progress * 8} L82 68`} stroke={C.breathe} strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
          </g>
        </g>
      ) : isExhale ? (
        // 내쉬기: 입을 오므려서 내쉼
        <g>
          <ellipse cx="80" cy="80" rx={4 - progress * 1.5} ry={3 - progress * 0.5} fill={C.mouth} opacity={0.7} />
          {/* 내쉬는 공기 표시 */}
          <g opacity={0.2 + progress * 0.4}>
            <circle cx="80" cy={86 + progress * 6} r={2 + progress * 2} fill={C.breathe} opacity={0.3}>
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="78" cy={90 + progress * 8} r={1.5 + progress * 1.5} fill={C.breathe} opacity={0.2}>
              <animate attributeName="opacity" values="0.2;0.05;0.2" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="83" cy={88 + progress * 10} r={1 + progress} fill={C.breathe} opacity={0.25}>
              <animate attributeName="opacity" values="0.25;0.08;0.25" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      ) : isHold ? (
        // 멈춤: 입을 살짝 다문 상태
        <path d="M74 80 Q80 82 86 80" stroke={C.mouth} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ) : (
        // 대기/완료: 살짝 미소
        <path d="M73 78 Q80 83 87 78" stroke={C.mouth} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}

      {/* 평화로운 빛 효과 (활성 시) */}
      {isActive && (
        <g opacity={0.15}>
          <circle cx="44" cy="48" r="2" fill={C.highlight}>
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="118" cy="52" r="1.5" fill={C.highlight}>
            <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="38" cy="90" r="1.5" fill={C.highlight}>
            <animate attributeName="opacity" values="0.2;0.05;0.2" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  )
}
