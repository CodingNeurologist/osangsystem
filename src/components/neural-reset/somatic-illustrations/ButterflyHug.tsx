import { C } from './constants'

/** 앉아서 팔 교차한 기본 캐릭터 */
function ButterflyBase({ faceState, showTap = false, showThought = false, showPeace = false, children }: {
  faceState: 'neutral' | 'eyes-closed' | 'peaceful'
  showTap?: boolean
  showThought?: boolean
  showPeace?: boolean
  children?: React.ReactNode
}) {
  return (
    <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="110" r="95" fill={C.warmBg} />

      {showPeace && (
        <ellipse cx="100" cy="120" rx="50" ry="68" fill={C.peaceful} opacity={0.2}>
          <animate attributeName="opacity" values="0.2;0.35;0.2" dur="3s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* 의자 */}
      <ellipse cx="100" cy="180" rx="45" ry="12" fill="#E8E0D8" />
      <rect x="55" y="168" rx="10" width="90" height="14" fill="#E8E0D8" />

      {/* 다리 */}
      <path d="M80 168 Q78 185 80 200" stroke={C.bottom} strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d="M120 168 Q122 185 120 200" stroke={C.bottom} strokeWidth="16" strokeLinecap="round" fill="none" />

      {/* 몸통 */}
      <rect x="72" y="100" rx="14" width="56" height="72" fill={C.top} />
      {/* 목 */}
      <rect x="90" y="90" rx="5" width="20" height="14" fill={C.skin} />
      {/* 머리 */}
      <circle cx="100" cy="62" r="30" fill={C.skin} />
      <path d="M70 55 Q70 28 100 25 Q130 28 130 55" fill={C.hair} />
      <path d="M72 55 Q72 32 100 29 Q128 32 128 55" fill={C.hairLight} opacity={0.3} />

      {/* 얼굴 표정 */}
      {faceState === 'neutral' && (
        <>
          <circle cx="88" cy="60" r="3" fill={C.eye} />
          <circle cx="112" cy="60" r="3" fill={C.eye} />
          <circle cx="89" cy="59" r="1" fill="white" />
          <circle cx="113" cy="59" r="1" fill="white" />
          <path d="M93 72 Q100 78 107 72" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {faceState === 'eyes-closed' && (
        <>
          <path d="M84 60 Q88 63 92 60" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M108 60 Q112 63 116 60" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M93 72 Q100 78 107 72" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {faceState === 'peaceful' && (
        <>
          <path d="M84 59 Q88 62 92 59" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M108 59 Q112 62 116 59" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M94 72 Q100 76 106 72" stroke={C.mouth} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}

      <circle cx="80" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="68" r="5" fill={C.cheek} opacity={0.4} />

      {/* 팔 교차 (나비 포옹 자세) */}
      {/* 어깨 강조 */}
      {showTap && (
        <>
          <circle cx="72" cy="106" r="10" fill={C.highlightGlow} opacity={0.4}>
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="128" cy="106" r="10" fill={C.highlightGlow} opacity={0.4}>
            <animate attributeName="opacity" values="0.7;0.4;0.7" dur="0.8s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* 왼팔 → 오른어깨 */}
      <path d="M72 108 Q85 100 120 105" stroke={C.skin} strokeWidth="11" strokeLinecap="round" fill="none" />
      {/* 오른팔 → 왼어깨 */}
      <path d="M128 108 Q115 100 80 105" stroke={C.skin} strokeWidth="11" strokeLinecap="round" fill="none" />
      {/* 손 (어깨 위) */}
      <circle cx="122" cy="104" r="7" fill={C.skin} />
      <circle cx="78" cy="104" r="7" fill={C.skin} />

      {/* 탭 표시 */}
      {showTap && (
        <g>
          <circle cx="122" cy="104" r="8" fill={C.highlight} opacity={0.4}>
            <animate attributeName="r" from="8" to="16" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="78" cy="104" r="8" fill={C.highlight} opacity={0.4}>
            <animate attributeName="r" from="8" to="16" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* 생각 풍선 */}
      {showThought && (
        <g>
          <ellipse cx="152" cy="42" rx="26" ry="18" fill="white" stroke="#E0D8D0" strokeWidth="1.5" />
          <circle cx="138" cy="62" r="4" fill="white" stroke="#E0D8D0" strokeWidth="1" />
          <circle cx="134" cy="72" r="2.5" fill="white" stroke="#E0D8D0" strokeWidth="1" />
          {/* 풍선 안 하트 */}
          <path d="M146 38 Q146 34 150 34 Q154 34 154 38 Q154 42 150 46 Q146 42 146 38Z" fill={C.cheek} opacity={0.6} />
          <circle cx="158" cy="42" r="3" fill={C.peaceful} opacity={0.6} />
        </g>
      )}

      {children}

      {/* 발 */}
      <ellipse cx="80" cy="204" rx="12" ry="5" fill={C.bottomShadow} />
      <ellipse cx="120" cy="204" rx="12" ry="5" fill={C.bottomShadow} />
    </svg>
  )
}

/** 스텝 0: 양팔 교차, 준비 자세 */
function ButterflyReady() {
  return <ButterflyBase faceState="neutral" />
}

/** 스텝 1: 눈 감고 번갈아 두드리기 */
function ButterflyTapping() {
  return <ButterflyBase faceState="eyes-closed" showTap />
}

/** 스텝 2: 리듬 유지, 안전 기억 떠올리기 */
function ButterflyWithThought() {
  return <ButterflyBase faceState="eyes-closed" showTap showThought />
}

/** 스텝 3: 멈추고 고요 */
function ButterflyPeace() {
  return (
    <ButterflyBase faceState="peaceful" showPeace>
      {/* 반짝임 */}
      <g opacity={0.4}>
        <circle cx="55" cy="85" r="2" fill={C.peaceful}>
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="145" cy="85" r="2" fill={C.peaceful}>
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="38" r="2" fill={C.peaceful}>
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </g>
    </ButterflyBase>
  )
}

export function ButterflyHugIllustration({ step }: { step: number }) {
  switch (step) {
    case 0: return <ButterflyReady />
    case 1: return <ButterflyTapping />
    case 2: return <ButterflyWithThought />
    case 3: return <ButterflyPeace />
    default: return <ButterflyReady />
  }
}
