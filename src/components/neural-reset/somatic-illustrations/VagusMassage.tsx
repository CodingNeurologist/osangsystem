import { C } from './constants'

/** 원형 마사지 표시 */
function CircleMassage({ cx, cy, r = 6 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.highlight} strokeWidth="1.5" strokeDasharray="3 2" opacity={0.7}>
        <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={r + 4} fill={C.highlightGlow} opacity={0.3}>
        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

/** 호흡 곡선 표시 */
function BreathCurves({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g opacity={0.5}>
      <path d={`M${cx - 8} ${cy} Q${cx} ${cy - 10} ${cx + 8} ${cy}`} stroke={C.breathe} strokeWidth="2" fill="none" strokeLinecap="round">
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="3s" repeatCount="indefinite" />
      </path>
      <path d={`M${cx - 6} ${cy - 4} Q${cx} ${cy - 12} ${cx + 6} ${cy - 4}`} stroke={C.breathe} strokeWidth="1.5" fill="none" strokeLinecap="round">
        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" begin="0.5s" repeatCount="indefinite" />
      </path>
    </g>
  )
}

/** 앉아있는 기본 + 머리 크게 (귀/목 디테일) */
function VagusBase({ faceState, children }: { faceState: 'neutral' | 'eyes-closed' | 'peaceful'; children?: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="110" r="95" fill={C.warmBg} />

      {/* 의자 */}
      <ellipse cx="100" cy="185" rx="42" ry="10" fill="#E8E0D8" />
      <rect x="58" y="173" rx="8" width="84" height="14" fill="#E8E0D8" />

      {/* 다리 */}
      <path d="M82 173 Q80 190 82 204" stroke={C.bottom} strokeWidth="15" strokeLinecap="round" fill="none" />
      <path d="M118 173 Q120 190 118 204" stroke={C.bottom} strokeWidth="15" strokeLinecap="round" fill="none" />

      {/* 몸통 */}
      <rect x="74" y="108" rx="14" width="52" height="68" fill={C.top} />
      {/* 목 — 좀더 길게, 양옆 보이게 */}
      <rect x="88" y="92" rx="6" width="24" height="20" fill={C.skin} />

      {/* 머리 — 약간 크게 (디테일용) */}
      <circle cx="100" cy="60" r="34" fill={C.skin} />
      <path d="M66 52 Q66 22 100 18 Q134 22 134 52" fill={C.hair} />
      <path d="M68 52 Q68 26 100 22 Q132 26 132 52" fill={C.hairLight} opacity={0.3} />

      {/* 귀 */}
      <ellipse cx="66" cy="62" rx="6" ry="9" fill={C.skin} />
      <ellipse cx="66" cy="62" rx="4" ry="6" fill={C.skinShadow} opacity={0.3} />
      <ellipse cx="134" cy="62" rx="6" ry="9" fill={C.skin} />
      <ellipse cx="134" cy="62" rx="4" ry="6" fill={C.skinShadow} opacity={0.3} />

      {/* 얼굴 표정 */}
      {faceState === 'neutral' && (
        <>
          <circle cx="88" cy="58" r="3" fill={C.eye} />
          <circle cx="112" cy="58" r="3" fill={C.eye} />
          <circle cx="89" cy="57" r="1" fill="white" />
          <circle cx="113" cy="57" r="1" fill="white" />
          <path d="M93 70 Q100 76 107 70" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {faceState === 'eyes-closed' && (
        <>
          <path d="M84 58 Q88 61 92 58" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M108 58 Q112 61 116 58" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M93 70 Q100 76 107 70" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {faceState === 'peaceful' && (
        <>
          <path d="M84 57 Q88 60 92 57" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M108 57 Q112 60 116 57" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M94 70 Q100 74 106 70" stroke={C.mouth} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}

      <circle cx="80" cy="66" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="66" r="5" fill={C.cheek} opacity={0.4} />

      {children}

      {/* 발 */}
      <ellipse cx="82" cy="208" rx="11" ry="5" fill={C.bottomShadow} />
      <ellipse cx="118" cy="208" rx="11" ry="5" fill={C.bottomShadow} />
    </svg>
  )
}

/** 스텝 0: 편안한 자세 */
function VagusReady() {
  return (
    <VagusBase faceState="neutral">
      <path d="M74 116 Q60 126 54 148" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M126 116 Q140 126 146 148" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="52" cy="150" r="7" fill={C.skin} />
      <circle cx="148" cy="150" r="7" fill={C.skin} />
    </VagusBase>
  )
}

/** 스텝 1: 귓바퀴 뒤 마사지 */
function VagusEarBehind() {
  return (
    <VagusBase faceState="eyes-closed">
      {/* 양손 귀 뒤로 */}
      <path d="M74 116 Q60 100 60 72" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M126 116 Q140 100 140 72" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="70" r="7" fill={C.skin} />
      <circle cx="140" cy="70" r="7" fill={C.skin} />

      {/* 귀 뒤 강조 + 원형 마사지 */}
      <CircleMassage cx={60} cy={68} r={8} />
      <CircleMassage cx={140} cy={68} r={8} />
    </VagusBase>
  )
}

/** 스텝 2: 귓불 당기기 */
function VagusEarlobe() {
  return (
    <VagusBase faceState="eyes-closed">
      {/* 양손 귓불 잡기 */}
      <path d="M74 116 Q56 100 60 76" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M126 116 Q144 100 140 76" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="74" r="7" fill={C.skin} />
      <circle cx="140" cy="74" r="7" fill={C.skin} />

      {/* 귓불 강조 */}
      <circle cx="66" cy="72" r="6" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="134" cy="72" r="6" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.7;0.5;0.7" dur="1.2s" repeatCount="indefinite" />
      </circle>

      {/* 아래 방향 화살표 */}
      <g opacity={0.5}>
        <path d="M56 72 L56 82" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" />
        <path d="M53 79 L56 84 L59 79" stroke={C.motionAccent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M144 72 L144 82" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" />
        <path d="M141 79 L144 84 L147 79" stroke={C.motionAccent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>
    </VagusBase>
  )
}

/** 스텝 3: 이주(tragus) 누르기 */
function VagusTragus() {
  return (
    <VagusBase faceState="eyes-closed">
      {/* 양손 귀 안쪽으로 */}
      <path d="M74 116 Q58 100 64 68" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M126 116 Q142 100 136 68" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* 검지 손가락 (작은 원) */}
      <circle cx="65" cy="66" r="5" fill={C.skin} />
      <circle cx="135" cy="66" r="5" fill={C.skin} />

      {/* 이주 강조 (귀 안쪽) */}
      <circle cx="68" cy="62" r="5" fill={C.highlight} opacity={0.5}>
        <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.3;0.5" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx="132" cy="62" r="5" fill={C.highlight} opacity={0.5}>
        <animate attributeName="r" values="5;7;5" dur="1s" begin="0.3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.3;0.5" dur="1s" begin="0.3s" repeatCount="indefinite" />
      </circle>
    </VagusBase>
  )
}

/** 스텝 4: 목 옆면 쓸어내리기 */
function VagusNeck() {
  return (
    <VagusBase faceState="eyes-closed">
      {/* 양손 목 옆 */}
      <path d="M74 116 Q64 105 72 92" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M126 116 Q136 105 128 92" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="72" cy="90" r="7" fill={C.skin} />
      <circle cx="128" cy="90" r="7" fill={C.skin} />

      {/* 목 옆 강조 */}
      <rect x="80" y="88" rx="4" width="8" height="20" fill={C.highlightGlow} opacity={0.4}>
        <animate attributeName="opacity" values="0.4;0.6;0.4" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="112" y="88" rx="4" width="8" height="20" fill={C.highlightGlow} opacity={0.4}>
        <animate attributeName="opacity" values="0.6;0.4;0.6" dur="1s" repeatCount="indefinite" />
      </rect>

      {/* 아래 방향 화살표 */}
      <g opacity={0.5}>
        <path d="M78 92 L78 106" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" />
        <path d="M75 103 L78 108 L81 103" stroke={C.motionAccent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M122 92 L122 106" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" />
        <path d="M119 103 L122 108 L125 103" stroke={C.motionAccent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>
    </VagusBase>
  )
}

/** 스텝 5: 쇄골 위 마사지 */
function VagusCollarbone() {
  return (
    <VagusBase faceState="eyes-closed">
      {/* 양손 쇄골 부위 */}
      <path d="M74 116 Q66 112 72 108" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M126 116 Q134 112 128 108" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="72" cy="107" r="6" fill={C.skin} />
      <circle cx="128" cy="107" r="6" fill={C.skin} />

      {/* 쇄골 강조 + 원형 마사지 */}
      <CircleMassage cx={78} cy={108} r={7} />
      <CircleMassage cx={122} cy={108} r={7} />

      {/* 쇄골 라인 표시 */}
      <path d="M78 110 Q100 114 122 110" stroke={C.skinShadow} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.4} />
    </VagusBase>
  )
}

/** 스텝 6: 깊은 호흡 마무리 */
function VagusBreathFinish() {
  return (
    <VagusBase faceState="peaceful">
      {/* 평화 글로우 */}
      <ellipse cx="100" cy="120" rx="48" ry="65" fill={C.peaceful} opacity={0.2}>
        <animate attributeName="opacity" values="0.2;0.35;0.2" dur="3s" repeatCount="indefinite" />
      </ellipse>

      <path d="M74 116 Q60 128 54 150" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M126 116 Q140 128 146 150" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="52" cy="152" r="7" fill={C.skin} />
      <circle cx="148" cy="152" r="7" fill={C.skin} />

      <BreathCurves cx={100} cy={82} />

      {/* 반짝임 */}
      <g opacity={0.4}>
        <circle cx="55" cy="45" r="2" fill={C.peaceful}>
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="145" cy="45" r="2" fill={C.peaceful}>
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    </VagusBase>
  )
}

export function VagusMassageIllustration({ step }: { step: number }) {
  switch (step) {
    case 0: return <VagusReady />
    case 1: return <VagusEarBehind />
    case 2: return <VagusEarlobe />
    case 3: return <VagusTragus />
    case 4: return <VagusNeck />
    case 5: return <VagusCollarbone />
    case 6: return <VagusBreathFinish />
    default: return <VagusReady />
  }
}
