import { C } from './constants'

/** 호흡 파동 표시 */
function BreathIndicator({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <path d={`M${cx - 10} ${cy} Q${cx} ${cy - 8} ${cx + 10} ${cy}`} stroke={C.breathe} strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.6}>
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
        <animate attributeName="d" values={`M${cx - 10} ${cy} Q${cx} ${cy - 8} ${cx + 10} ${cy};M${cx - 12} ${cy - 3} Q${cx} ${cy - 14} ${cx + 12} ${cy - 3};M${cx - 10} ${cy} Q${cx} ${cy - 8} ${cx + 10} ${cy}`} dur="3s" repeatCount="indefinite" />
      </path>
      <path d={`M${cx - 8} ${cy - 5} Q${cx} ${cy - 12} ${cx + 8} ${cy - 5}`} stroke={C.breathe} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.4}>
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" begin="0.5s" repeatCount="indefinite" />
      </path>
    </g>
  )
}

/** 긴장 표시 (지그재그 라인) */
function TensionMark({ cx, cy, size = 8 }: { cx: number; cy: number; size?: number }) {
  const s = size
  return (
    <g>
      <path d={`M${cx - s} ${cy} L${cx - s / 2} ${cy - s / 2} L${cx} ${cy} L${cx + s / 2} ${cy - s / 2} L${cx + s} ${cy}`} stroke={C.squeeze} strokeWidth="2" fill="none" strokeLinecap="round">
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="0.8s" repeatCount="indefinite" />
      </path>
    </g>
  )
}

/** 앉아있는 기본 캐릭터 */
function SittingBase({ faceState, children, showBreath = false }: { faceState: 'neutral' | 'eyes-closed' | 'squeeze' | 'peaceful'; children?: React.ReactNode; showBreath?: boolean }) {
  return (
    <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="110" r="95" fill={C.warmBg} />

      {/* 의자 (둥근 쿠션) */}
      <ellipse cx="100" cy="180" rx="45" ry="12" fill="#E8E0D8" />
      <rect x="55" y="168" rx="10" width="90" height="14" fill="#E8E0D8" />

      {/* 다리 (앞으로 뻗은) */}
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
      {faceState === 'squeeze' && (
        <>
          <path d="M84 59 Q88 62 92 59" stroke={C.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M108 59 Q112 62 116 59" stroke={C.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M92 73 Q100 70 108 73" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* 힘주는 주름 */}
          <line x1="82" y1="55" x2="80" y2="52" stroke={C.eye} strokeWidth="1" strokeLinecap="round" opacity={0.5} />
          <line x1="118" y1="55" x2="120" y2="52" stroke={C.eye} strokeWidth="1" strokeLinecap="round" opacity={0.5} />
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

      {showBreath && <BreathIndicator cx={100} cy={82} />}

      {children}

      {/* 발 */}
      <ellipse cx="80" cy="204" rx="12" ry="5" fill={C.bottomShadow} />
      <ellipse cx="120" cy="204" rx="12" ry="5" fill={C.bottomShadow} />
    </svg>
  )
}

/** 스텝 0: 심호흡 */
function PMRBreathing() {
  return (
    <SittingBase faceState="eyes-closed" showBreath>
      <ellipse cx="100" cy="130" rx="40" ry="60" fill={C.peaceful} opacity={0.2}>
        <animate attributeName="opacity" values="0.2;0.35;0.2" dur="3s" repeatCount="indefinite" />
      </ellipse>
      <path d="M72 108 Q60 120 55 145" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q140 120 145 145" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="53" cy="147" r="7" fill={C.skin} />
      <circle cx="147" cy="147" r="7" fill={C.skin} />
    </SittingBase>
  )
}

/** 스텝 1: 양손 꽉 쥐기 */
function PMRFists() {
  return (
    <SittingBase faceState="neutral">
      {/* 손 강조 글로우 */}
      <circle cx="60" cy="140" r="14" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="r" values="14;16;14" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx="140" cy="140" r="14" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="r" values="14;16;14" dur="1s" begin="0.2s" repeatCount="indefinite" />
      </circle>

      <path d="M72 108 Q60 120 58 138" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q140 120 142 138" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* 주먹 */}
      <circle cx="58" cy="140" r="9" fill={C.skin} />
      <circle cx="58" cy="140" r="6" fill={C.skinShadow} />
      <circle cx="142" cy="140" r="9" fill={C.skin} />
      <circle cx="142" cy="140" r="6" fill={C.skinShadow} />

      <TensionMark cx={58} cy={126} size={7} />
      <TensionMark cx={142} cy={126} size={7} />
    </SittingBase>
  )
}

/** 스텝 2: 이두근 긴장 */
function PMRBiceps() {
  return (
    <SittingBase faceState="neutral">
      {/* 팔 강조 */}
      <ellipse cx="58" cy="118" rx="12" ry="18" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="1s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="142" cy="118" rx="12" ry="18" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.7;0.5;0.7" dur="1s" repeatCount="indefinite" />
      </ellipse>

      {/* 팔 구부린 상태 */}
      <path d="M72 108 Q58 110 55 125 Q54 132 60 135" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q142 110 145 125 Q146 132 140 135" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="137" r="8" fill={C.skin} />
      <circle cx="60" cy="137" r="5" fill={C.skinShadow} />
      <circle cx="140" cy="137" r="8" fill={C.skin} />
      <circle cx="140" cy="137" r="5" fill={C.skinShadow} />

      <TensionMark cx={55} cy={108} />
      <TensionMark cx={145} cy={108} />
    </SittingBase>
  )
}

/** 스텝 3: 어깨 귀 쪽으로 */
function PMRShoulders() {
  return (
    <SittingBase faceState="neutral">
      {/* 어깨 강조 */}
      <ellipse cx="72" cy="100" rx="12" ry="10" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="1s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="128" cy="100" rx="12" ry="10" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.7;0.5;0.7" dur="1s" repeatCount="indefinite" />
      </ellipse>

      {/* 어깨 올린 팔 */}
      <path d="M72 102 Q58 98 52 115" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 102 Q142 98 148 115" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="117" r="7" fill={C.skin} />
      <circle cx="150" cy="117" r="7" fill={C.skin} />

      {/* 위쪽 화살표 (어깨 올리는 방향) */}
      <g opacity={0.5}>
        <path d="M62 100 L62 90" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" />
        <path d="M59 93 L62 88 L65 93" stroke={C.motionAccent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M138 100 L138 90" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" />
        <path d="M135 93 L138 88 L141 93" stroke={C.motionAccent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>

      <TensionMark cx={72} cy={92} size={6} />
      <TensionMark cx={128} cy={92} size={6} />
    </SittingBase>
  )
}

/** 스텝 4: 얼굴 오므리기 */
function PMRFace() {
  return (
    <SittingBase faceState="squeeze">
      {/* 얼굴 강조 */}
      <circle cx="100" cy="62" r="32" fill={C.highlightGlow} opacity={0.4}>
        <animate attributeName="r" values="32;34;32" dur="1s" repeatCount="indefinite" />
      </circle>

      <path d="M72 108 Q60 120 55 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q140 120 145 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="53" cy="142" r="7" fill={C.skin} />
      <circle cx="147" cy="142" r="7" fill={C.skin} />

      <TensionMark cx={100} cy={40} size={8} />
    </SittingBase>
  )
}

/** 스텝 5: 배 긴장 */
function PMRAbdomen() {
  return (
    <SittingBase faceState="neutral">
      {/* 복부 강조 */}
      <ellipse cx="100" cy="148" rx="20" ry="14" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="1s" repeatCount="indefinite" />
      </ellipse>

      <path d="M72 108 Q60 120 55 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q140 120 145 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="53" cy="142" r="7" fill={C.skin} />
      <circle cx="147" cy="142" r="7" fill={C.skin} />

      <TensionMark cx={100} cy={132} size={8} />
    </SittingBase>
  )
}

/** 스텝 6: 허벅지 긴장 */
function PMRThighs() {
  return (
    <SittingBase faceState="neutral">
      {/* 허벅지 강조 */}
      <rect x="68" y="164" rx="8" width="28" height="16" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="104" y="164" rx="8" width="28" height="16" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.7;0.5;0.7" dur="1s" repeatCount="indefinite" />
      </rect>

      <path d="M72 108 Q60 120 55 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q140 120 145 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="53" cy="142" r="7" fill={C.skin} />
      <circle cx="147" cy="142" r="7" fill={C.skin} />

      <TensionMark cx={82} cy={160} size={6} />
      <TensionMark cx={118} cy={160} size={6} />
    </SittingBase>
  )
}

/** 스텝 7: 종아리 긴장 */
function PMRCalves() {
  return (
    <SittingBase faceState="neutral">
      {/* 종아리 강조 */}
      <rect x="68" y="186" rx="8" width="24" height="16" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.5;0.7;0.5" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="108" y="186" rx="8" width="24" height="16" fill={C.highlightGlow} opacity={0.5}>
        <animate attributeName="opacity" values="0.7;0.5;0.7" dur="1s" repeatCount="indefinite" />
      </rect>

      <path d="M72 108 Q60 120 55 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q140 120 145 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="53" cy="142" r="7" fill={C.skin} />
      <circle cx="147" cy="142" r="7" fill={C.skin} />

      {/* 발가락 당기는 화살표 */}
      <g opacity={0.5}>
        <path d="M80 208 L80 198" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" />
        <path d="M77 201 L80 196 L83 201" stroke={C.motionAccent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M120 208 L120 198" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" />
        <path d="M117 201 L120 196 L123 201" stroke={C.motionAccent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>

      <TensionMark cx={80} cy={183} size={6} />
      <TensionMark cx={120} cy={183} size={6} />
    </SittingBase>
  )
}

/** 스텝 8: 전신 이완, 평화 */
function PMRRelaxed() {
  return (
    <SittingBase faceState="peaceful" showBreath>
      {/* 전신 평화 글로우 */}
      <ellipse cx="100" cy="130" rx="48" ry="65" fill={C.peaceful} opacity={0.25}>
        <animate attributeName="opacity" values="0.25;0.4;0.25" dur="3s" repeatCount="indefinite" />
      </ellipse>

      <path d="M72 108 Q58 125 52 148" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q142 125 148 148" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="150" r="7" fill={C.skin} />
      <circle cx="150" cy="150" r="7" fill={C.skin} />

      {/* 반짝임 */}
      <g opacity={0.4}>
        <circle cx="55" cy="88" r="2" fill={C.peaceful}>
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="145" cy="88" r="2" fill={C.peaceful}>
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="40" r="2" fill={C.peaceful}>
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </g>
    </SittingBase>
  )
}

export function PMRIllustration({ step }: { step: number }) {
  switch (step) {
    case 0: return <PMRBreathing />
    case 1: return <PMRFists />
    case 2: return <PMRBiceps />
    case 3: return <PMRShoulders />
    case 4: return <PMRFace />
    case 5: return <PMRAbdomen />
    case 6: return <PMRThighs />
    case 7: return <PMRCalves />
    case 8: return <PMRRelaxed />
    default: return <PMRBreathing />
  }
}
