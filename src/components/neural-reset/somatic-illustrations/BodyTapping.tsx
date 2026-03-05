import { C } from './constants'

/** 탭 효과 파동 표시 */
function TapRipples({ cx, cy, r = 8 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={C.highlight} opacity={0.5}>
        <animate attributeName="r" from={r} to={r + 12} dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.5" to="0" dur="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={r} fill={C.highlight} opacity={0.3}>
        <animate attributeName="r" from={r} to={r + 8} dur="0.8s" begin="0.3s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.3" to="0" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

/** 작은 별/반짝임 효과 */
function Sparkle({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <line x1={cx - 4} y1={cy} x2={cx + 4} y2={cy} stroke={C.highlight} strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
      </line>
      <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 4} stroke={C.highlight} strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
      </line>
    </g>
  )
}

/** 흔들림 라인 표시 */
function ShakeLines({ cx, cy, size = 'md' }: { cx: number; cy: number; size?: 'sm' | 'md' }) {
  const d = size === 'sm' ? 6 : 10
  return (
    <g opacity={0.5}>
      <line x1={cx - d - 4} y1={cy - 3} x2={cx - d - 4} y2={cy + 3} stroke={C.motion} strokeWidth="2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="0.4s" repeatCount="indefinite" />
      </line>
      <line x1={cx + d + 4} y1={cy - 3} x2={cx + d + 4} y2={cy + 3} stroke={C.motion} strokeWidth="2" strokeLinecap="round">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="0.4s" repeatCount="indefinite" />
      </line>
    </g>
  )
}

/** 서있는 기본 캐릭터 (머리 두드리기) */
function StandingFigureTapHead() {
  return (
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* 배경 원 */}
      <circle cx="100" cy="120" r="95" fill={C.warmBg} />

      {/* 다리 */}
      <rect x="80" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="104" y="165" rx="8" width="16" height="50" fill={C.bottom} />

      {/* 몸통 */}
      <rect x="72" y="100" rx="14" width="56" height="70" fill={C.top} />
      <rect x="72" y="100" rx="14" width="56" height="70" fill={C.topShadow} opacity={0.2} />

      {/* 목 */}
      <rect x="90" y="90" rx="5" width="20" height="14" fill={C.skin} />

      {/* 머리 - 강조 글로우 */}
      <circle cx="100" cy="62" r="34" fill={C.highlightGlow} opacity={0.6}>
        <animate attributeName="r" values="34;36;34" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* 머리 */}
      <circle cx="100" cy="62" r="30" fill={C.skin} />
      {/* 머리카락 */}
      <path d="M70 55 Q70 28 100 25 Q130 28 130 55" fill={C.hair} />
      <path d="M72 55 Q72 32 100 29 Q128 32 128 55" fill={C.hairLight} opacity={0.3} />
      {/* 눈 */}
      <circle cx="88" cy="60" r="3" fill={C.eye} />
      <circle cx="112" cy="60" r="3" fill={C.eye} />
      <circle cx="89" cy="59" r="1" fill="white" />
      <circle cx="113" cy="59" r="1" fill="white" />
      {/* 볼 */}
      <circle cx="80" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      {/* 입 */}
      <path d="M93 72 Q100 78 107 72" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* 양팔 올려서 머리 두드리기 */}
      <path d="M72 110 Q55 95 65 65 Q68 55 78 48" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 110 Q145 95 135 65 Q132 55 122 48" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* 손 */}
      <circle cx="78" cy="46" r="7" fill={C.skin} />
      <circle cx="122" cy="46" r="7" fill={C.skin} />

      {/* 탭 이펙트 */}
      <TapRipples cx={90} cy={38} r={6} />
      <TapRipples cx={110} cy={38} r={6} />

      {/* 발 */}
      <ellipse cx="88" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
      <ellipse cx="112" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
    </svg>
  )
}

/** 서있는 기본 캐릭터 (얼굴 두드리기) */
function StandingFigureTapFace() {
  return (
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="120" r="95" fill={C.warmBg} />
      <rect x="80" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="104" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="72" y="100" rx="14" width="56" height="70" fill={C.top} />
      <rect x="90" y="90" rx="5" width="20" height="14" fill={C.skin} />

      {/* 머리 */}
      <circle cx="100" cy="62" r="30" fill={C.skin} />
      <path d="M70 55 Q70 28 100 25 Q130 28 130 55" fill={C.hair} />
      <path d="M72 55 Q72 32 100 29 Q128 32 128 55" fill={C.hairLight} opacity={0.3} />

      {/* 눈 감은 상태 */}
      <path d="M84 60 Q88 63 92 60" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M108 60 Q112 63 116 60" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <path d="M93 72 Q100 78 107 72" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* 얼굴 강조 */}
      <circle cx="100" cy="65" r="20" fill={C.highlightGlow} opacity={0.4}>
        <animate attributeName="opacity" values="0.4;0.6;0.4" dur="1.2s" repeatCount="indefinite" />
      </circle>

      {/* 양손 얼굴 옆에서 두드리기 */}
      <path d="M72 110 Q58 95 62 78 Q63 72 68 68" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 110 Q142 95 138 78 Q137 72 132 68" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="68" cy="66" r="7" fill={C.skin} />
      <circle cx="132" cy="66" r="7" fill={C.skin} />

      <TapRipples cx={75} cy={62} r={5} />
      <TapRipples cx={125} cy={62} r={5} />

      <ellipse cx="88" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
      <ellipse cx="112" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
    </svg>
  )
}

/** 서있는 캐릭터 (왼쪽 팔 두드리기) */
function StandingFigureTapLeftArm() {
  return (
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="120" r="95" fill={C.warmBg} />
      <rect x="80" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="104" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="72" y="100" rx="14" width="56" height="70" fill={C.top} />
      <rect x="90" y="90" rx="5" width="20" height="14" fill={C.skin} />
      <circle cx="100" cy="62" r="30" fill={C.skin} />
      <path d="M70 55 Q70 28 100 25 Q130 28 130 55" fill={C.hair} />
      <circle cx="88" cy="60" r="3" fill={C.eye} />
      <circle cx="112" cy="60" r="3" fill={C.eye} />
      <circle cx="89" cy="59" r="1" fill="white" />
      <circle cx="113" cy="59" r="1" fill="white" />
      <circle cx="80" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <path d="M93 72 Q100 78 107 72" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* 왼팔 (내려진 상태) + 강조 */}
      <path d="M72 108 Q52 112 42 135 Q38 145 40 158" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M72 108 Q52 112 42 135 Q38 145 40 158" stroke={C.highlight} strokeWidth="16" strokeLinecap="round" fill="none" opacity={0.3}>
        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="1s" repeatCount="indefinite" />
      </path>

      {/* 오른손 왼팔 어깨→손 방향으로 두드리기 */}
      <path d="M128 108 Q140 100 60 125" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="58" cy="126" r="7" fill={C.skin} />

      {/* 탭 이펙트 (어깨→팔 따라) */}
      <TapRipples cx={55} cy={120} r={5} />
      <Sparkle cx={48} cy={140} />

      <ellipse cx="88" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
      <ellipse cx="112" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
    </svg>
  )
}

/** 서있는 캐릭터 (오른쪽 팔 두드리기) */
function StandingFigureTapRightArm() {
  return (
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="120" r="95" fill={C.warmBg} />
      <rect x="80" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="104" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="72" y="100" rx="14" width="56" height="70" fill={C.top} />
      <rect x="90" y="90" rx="5" width="20" height="14" fill={C.skin} />
      <circle cx="100" cy="62" r="30" fill={C.skin} />
      <path d="M70 55 Q70 28 100 25 Q130 28 130 55" fill={C.hair} />
      <circle cx="88" cy="60" r="3" fill={C.eye} />
      <circle cx="112" cy="60" r="3" fill={C.eye} />
      <circle cx="89" cy="59" r="1" fill="white" />
      <circle cx="113" cy="59" r="1" fill="white" />
      <circle cx="80" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <path d="M93 72 Q100 78 107 72" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* 오른팔 (내려진 상태) + 강조 */}
      <path d="M128 108 Q148 112 158 135 Q162 145 160 158" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q148 112 158 135 Q162 145 160 158" stroke={C.highlight} strokeWidth="16" strokeLinecap="round" fill="none" opacity={0.3}>
        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="1s" repeatCount="indefinite" />
      </path>

      {/* 왼손 오른팔 두드리기 */}
      <path d="M72 108 Q60 100 140 125" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="142" cy="126" r="7" fill={C.skin} />

      <TapRipples cx={145} cy={120} r={5} />
      <Sparkle cx={152} cy={140} />

      <ellipse cx="88" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
      <ellipse cx="112" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
    </svg>
  )
}

/** 서있는 캐릭터 (가슴 두드리기) */
function StandingFigureTapChest() {
  return (
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="120" r="95" fill={C.warmBg} />
      <rect x="80" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="104" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="72" y="100" rx="14" width="56" height="70" fill={C.top} />
      <rect x="90" y="90" rx="5" width="20" height="14" fill={C.skin} />
      <circle cx="100" cy="62" r="30" fill={C.skin} />
      <path d="M70 55 Q70 28 100 25 Q130 28 130 55" fill={C.hair} />
      <circle cx="88" cy="60" r="3" fill={C.eye} />
      <circle cx="112" cy="60" r="3" fill={C.eye} />
      <circle cx="89" cy="59" r="1" fill="white" />
      <circle cx="113" cy="59" r="1" fill="white" />
      <circle cx="80" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <path d="M93 72 Q100 78 107 72" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* 가슴 강조 */}
      <circle cx="100" cy="118" r="16" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="r" values="16;19;16" dur="1s" repeatCount="indefinite" />
      </circle>

      {/* 왼팔 (몸 옆) */}
      <path d="M72 108 Q55 115 48 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />

      {/* 오른 주먹 → 가슴 두드리기 */}
      <path d="M128 108 Q118 105 105 112" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="104" cy="113" r="8" fill={C.skin} />
      <circle cx="104" cy="113" r="5" fill={C.skinShadow} />

      <TapRipples cx={100} cy={118} r={8} />

      <ellipse cx="88" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
      <ellipse cx="112" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
    </svg>
  )
}

/** 서있는 캐릭터 (갈비뼈 두드리기) */
function StandingFigureTapRibs() {
  return (
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="120" r="95" fill={C.warmBg} />
      <rect x="80" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="104" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="72" y="100" rx="14" width="56" height="70" fill={C.top} />
      <rect x="90" y="90" rx="5" width="20" height="14" fill={C.skin} />
      <circle cx="100" cy="62" r="30" fill={C.skin} />
      <path d="M70 55 Q70 28 100 25 Q130 28 130 55" fill={C.hair} />
      <circle cx="88" cy="60" r="3" fill={C.eye} />
      <circle cx="112" cy="60" r="3" fill={C.eye} />
      <circle cx="89" cy="59" r="1" fill="white" />
      <circle cx="113" cy="59" r="1" fill="white" />
      <circle cx="80" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <path d="M93 72 Q100 78 107 72" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* 갈비뼈 양옆 강조 */}
      <ellipse cx="68" cy="140" rx="10" ry="14" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="1s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="132" cy="140" rx="10" ry="14" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="1s" begin="0.3s" repeatCount="indefinite" />
      </ellipse>

      {/* 양손 갈비뼈 두드리기 */}
      <path d="M72 108 Q60 118 65 138" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="65" cy="140" r="8" fill={C.skin} />
      <path d="M128 108 Q140 118 135 138" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="135" cy="140" r="8" fill={C.skin} />

      <TapRipples cx={65} cy={140} r={6} />
      <TapRipples cx={135} cy={140} r={6} />

      <ellipse cx="88" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
      <ellipse cx="112" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
    </svg>
  )
}

/** 서있는 캐릭터 (허벅지 두드리기) */
function StandingFigureTapThighs() {
  return (
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="120" r="95" fill={C.warmBg} />
      <rect x="80" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="104" y="165" rx="8" width="16" height="50" fill={C.bottom} />

      {/* 허벅지 강조 */}
      <rect x="76" y="165" rx="10" width="22" height="30" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="101" y="165" rx="10" width="22" height="30" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="1s" begin="0.3s" repeatCount="indefinite" />
      </rect>

      <rect x="72" y="100" rx="14" width="56" height="70" fill={C.top} />
      <rect x="90" y="90" rx="5" width="20" height="14" fill={C.skin} />
      <circle cx="100" cy="62" r="30" fill={C.skin} />
      <path d="M70 55 Q70 28 100 25 Q130 28 130 55" fill={C.hair} />
      <circle cx="88" cy="60" r="3" fill={C.eye} />
      <circle cx="112" cy="60" r="3" fill={C.eye} />
      <circle cx="89" cy="59" r="1" fill="white" />
      <circle cx="113" cy="59" r="1" fill="white" />
      <circle cx="80" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <path d="M93 72 Q100 78 107 72" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* 양손 허벅지 두드리기 (팔을 아래로) */}
      <path d="M72 108 Q58 130 72 170" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="73" cy="172" r="8" fill={C.skin} />
      <path d="M128 108 Q142 130 128 170" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="127" cy="172" r="8" fill={C.skin} />

      <TapRipples cx={80} cy={178} r={6} />
      <TapRipples cx={120} cy={178} r={6} />

      <ellipse cx="88" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
      <ellipse cx="112" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
    </svg>
  )
}

/** 서있는 캐릭터 (마무리 - 전신 털어내기) */
function StandingFigureShakeOff() {
  return (
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="120" r="95" fill={C.warmBg} />

      {/* 전신 글로우 */}
      <ellipse cx="100" cy="140" rx="50" ry="75" fill={C.peaceful} opacity={0.3}>
        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
      </ellipse>

      <rect x="80" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="104" y="165" rx="8" width="16" height="50" fill={C.bottom} />
      <rect x="72" y="100" rx="14" width="56" height="70" fill={C.top} />
      <rect x="90" y="90" rx="5" width="20" height="14" fill={C.skin} />
      <circle cx="100" cy="62" r="30" fill={C.skin} />
      <path d="M70 55 Q70 28 100 25 Q130 28 130 55" fill={C.hair} />
      {/* 편안한 눈 */}
      <path d="M84 60 Q88 63 92 60" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M108 60 Q112 63 116 60" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <path d="M93 72 Q100 78 107 72" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* 양팔 옆으로 벌려 털어내기 */}
      <path d="M72 108 Q50 112 38 120" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q150 112 162 120" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="36" cy="122" r="7" fill={C.skin} />
      <circle cx="164" cy="122" r="7" fill={C.skin} />

      {/* 반짝임 효과 */}
      <Sparkle cx={40} cy={105} />
      <Sparkle cx={160} cy={105} />
      <Sparkle cx={55} cy={90} />
      <Sparkle cx={145} cy={90} />
      <Sparkle cx={100} cy={42} />

      {/* 흔들림 라인 */}
      <ShakeLines cx={36} cy={122} size="sm" />
      <ShakeLines cx={164} cy={122} size="sm" />

      <ellipse cx="88" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
      <ellipse cx="112" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
    </svg>
  )
}

export function BodyTappingIllustration({ step }: { step: number }) {
  switch (step) {
    case 0: return <StandingFigureTapHead />
    case 1: return <StandingFigureTapFace />
    case 2: return <StandingFigureTapLeftArm />
    case 3: return <StandingFigureTapRightArm />
    case 4: return <StandingFigureTapChest />
    case 5: return <StandingFigureTapRibs />
    case 6: return <StandingFigureTapThighs />
    case 7: return <StandingFigureShakeOff />
    default: return <StandingFigureTapHead />
  }
}
