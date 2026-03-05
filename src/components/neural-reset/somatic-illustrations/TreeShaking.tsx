import { C } from './constants'

/** 기본 서있는 몸체 (다리/몸통/목/머리) — 팔 제외 */
function StandingBase({ faceState, kneesBent = false, children }: { faceState: 'neutral' | 'eyes-closed' | 'mouth-open' | 'peaceful'; kneesBent?: boolean; children?: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="120" r="95" fill={C.warmBg} />

      {/* 다리 — 무릎 구부린 상태 */}
      {kneesBent ? (
        <>
          <path d="M88 165 Q82 185 85 200 Q86 210 88 218" stroke={C.bottom} strokeWidth="16" strokeLinecap="round" fill="none" />
          <path d="M112 165 Q118 185 115 200 Q114 210 112 218" stroke={C.bottom} strokeWidth="16" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <rect x="80" y="165" rx="8" width="16" height="50" fill={C.bottom} />
          <rect x="104" y="165" rx="8" width="16" height="50" fill={C.bottom} />
        </>
      )}

      {/* 몸통 */}
      <rect x="72" y="100" rx="14" width="56" height="70" fill={C.top} />
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
      {faceState === 'mouth-open' && (
        <>
          <circle cx="88" cy="60" r="3" fill={C.eye} />
          <circle cx="112" cy="60" r="3" fill={C.eye} />
          <circle cx="89" cy="59" r="1" fill="white" />
          <circle cx="113" cy="59" r="1" fill="white" />
          <ellipse cx="100" cy="74" rx="6" ry="5" fill={C.mouth} />
        </>
      )}
      {faceState === 'peaceful' && (
        <>
          <path d="M84 59 Q88 62 92 59" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M108 59 Q112 62 116 59" stroke={C.eye} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M94 72 Q100 76 106 72" stroke={C.mouth} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* 볼 */}
      <circle cx="80" cy="68" r="5" fill={C.cheek} opacity={0.4} />
      <circle cx="120" cy="68" r="5" fill={C.cheek} opacity={0.4} />

      {/* 자식 요소 (팔, 이펙트 등) */}
      {children}

      {/* 발 */}
      <ellipse cx="88" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
      <ellipse cx="112" cy="218" rx="12" ry="6" fill={C.bottomShadow} />
    </svg>
  )
}

/** 스텝 0: 기본 자세 (어깨너비, 무릎 살짝 구부린) */
function TreeShakeReady() {
  return (
    <StandingBase faceState="neutral" kneesBent>
      {/* 팔 내린 상태 */}
      <path d="M72 108 Q55 118 48 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q145 118 152 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="46" cy="142" r="7" fill={C.skin} />
      <circle cx="154" cy="142" r="7" fill={C.skin} />
      {/* 화살표 — 무릎 위치 */}
      <path d="M60 190 L60 200" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" markerEnd="url(#arrowDown)" />
      <defs>
        <marker id="arrowDown" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6" fill={C.motionAccent} />
        </marker>
      </defs>
    </StandingBase>
  )
}

/** 스텝 1: 위아래 흔들기 */
function TreeShakeBounce() {
  return (
    <StandingBase faceState="neutral" kneesBent>
      <path d="M72 108 Q55 118 48 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q145 118 152 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="46" cy="142" r="7" fill={C.skin} />
      <circle cx="154" cy="142" r="7" fill={C.skin} />
      {/* 위아래 화살표 */}
      <g opacity={0.6}>
        <path d="M168 100 L168 80" stroke={C.motionAccent} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M164 84 L168 78 L172 84" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M168 140 L168 160" stroke={C.motionAccent} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M164 156 L168 162 L172 156" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
      {/* 다리 흔들림 효과 */}
      <g>
        <line x1="74" y1="178" x2="72" y2="183" stroke={C.motion} strokeWidth="2" strokeLinecap="round" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="0.5s" repeatCount="indefinite" />
        </line>
        <line x1="126" y1="178" x2="128" y2="183" stroke={C.motion} strokeWidth="2" strokeLinecap="round" opacity="0.5">
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="0.5s" repeatCount="indefinite" />
        </line>
      </g>
    </StandingBase>
  )
}

/** 스텝 2: 팔·어깨도 흔들기 */
function TreeShakeArms() {
  return (
    <StandingBase faceState="neutral" kneesBent>
      {/* 강조 — 어깨/팔 */}
      <ellipse cx="60" cy="108" rx="18" ry="10" fill={C.highlightGlow} opacity={0.4}>
        <animate attributeName="opacity" values="0.4;0.6;0.4" dur="0.8s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="140" cy="108" rx="18" ry="10" fill={C.highlightGlow} opacity={0.4}>
        <animate attributeName="opacity" values="0.6;0.4;0.6" dur="0.8s" repeatCount="indefinite" />
      </ellipse>

      {/* 팔 올린 상태 흔들기 */}
      <path d="M72 108 Q48 100 38 110" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none">
        <animate attributeName="d" values="M72 108 Q48 100 38 110;M72 108 Q48 104 38 106;M72 108 Q48 100 38 110" dur="0.6s" repeatCount="indefinite" />
      </path>
      <path d="M128 108 Q152 100 162 110" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none">
        <animate attributeName="d" values="M128 108 Q152 100 162 110;M128 108 Q152 104 162 106;M128 108 Q152 100 162 110" dur="0.6s" begin="0.15s" repeatCount="indefinite" />
      </path>
      <circle cx="36" cy="112" r="7" fill={C.skin}>
        <animate attributeName="cy" values="112;108;112" dur="0.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="164" cy="112" r="7" fill={C.skin}>
        <animate attributeName="cy" values="112;108;112" dur="0.6s" begin="0.15s" repeatCount="indefinite" />
      </circle>
    </StandingBase>
  )
}

/** 스텝 3: 소리내며 흔들기 */
function TreeShakeWithSound() {
  return (
    <StandingBase faceState="mouth-open" kneesBent>
      {/* 전신 활력 글로우 */}
      <ellipse cx="100" cy="130" rx="55" ry="80" fill={C.highlightGlow} opacity={0.2}>
        <animate attributeName="opacity" values="0.2;0.35;0.2" dur="0.8s" repeatCount="indefinite" />
      </ellipse>

      {/* 팔 크게 흔들기 */}
      <path d="M72 108 Q42 90 32 100" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none">
        <animate attributeName="d" values="M72 108 Q42 90 32 100;M72 108 Q42 95 32 95;M72 108 Q42 90 32 100" dur="0.5s" repeatCount="indefinite" />
      </path>
      <path d="M128 108 Q158 90 168 100" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none">
        <animate attributeName="d" values="M128 108 Q158 90 168 100;M128 108 Q158 95 168 95;M128 108 Q158 90 168 100" dur="0.5s" begin="0.12s" repeatCount="indefinite" />
      </path>
      <circle cx="30" cy="102" r="7" fill={C.skin}>
        <animate attributeName="cy" values="102;97;102" dur="0.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="170" cy="102" r="7" fill={C.skin}>
        <animate attributeName="cy" values="102;97;102" dur="0.5s" begin="0.12s" repeatCount="indefinite" />
      </circle>

      {/* 음파 효과 */}
      <g opacity={0.5}>
        <path d="M115 72 Q122 70 125 65" stroke={C.motionAccent} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d="M120 76 Q130 72 135 64" stroke={C.motionAccent} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.3;0.5;0.3" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d="M125 80 Q136 76 142 66" stroke={C.motionAccent} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="0.8s" begin="0.2s" repeatCount="indefinite" />
        </path>
      </g>
    </StandingBase>
  )
}

/** 스텝 4: 서서히 멈추기 */
function TreeShakeSlowDown() {
  return (
    <StandingBase faceState="eyes-closed" kneesBent>
      <path d="M72 108 Q55 112 48 130" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q145 112 152 130" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="46" cy="132" r="7" fill={C.skin} />
      <circle cx="154" cy="132" r="7" fill={C.skin} />
      {/* 작은 흔들림 라인 (작아지는 느낌) */}
      <g opacity={0.3}>
        <line x1="38" y1="128" x2="36" y2="132" stroke={C.motion} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="162" y1="128" x2="164" y2="132" stroke={C.motion} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </StandingBase>
  )
}

/** 스텝 5: 완전 정지, 고요 */
function TreeShakeStill() {
  return (
    <StandingBase faceState="peaceful">
      {/* 평화로운 글로우 */}
      <ellipse cx="100" cy="130" rx="45" ry="70" fill={C.peaceful} opacity={0.25}>
        <animate attributeName="opacity" values="0.25;0.35;0.25" dur="3s" repeatCount="indefinite" />
      </ellipse>

      <path d="M72 108 Q55 118 48 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M128 108 Q145 118 152 140" stroke={C.skin} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="46" cy="142" r="7" fill={C.skin} />
      <circle cx="154" cy="142" r="7" fill={C.skin} />

      {/* 작은 별 반짝임 — 평화 표시 */}
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
    </StandingBase>
  )
}

export function TreeShakingIllustration({ step }: { step: number }) {
  switch (step) {
    case 0: return <TreeShakeReady />
    case 1: return <TreeShakeBounce />
    case 2: return <TreeShakeArms />
    case 3: return <TreeShakeWithSound />
    case 4: return <TreeShakeSlowDown />
    case 5: return <TreeShakeStill />
    default: return <TreeShakeReady />
  }
}
