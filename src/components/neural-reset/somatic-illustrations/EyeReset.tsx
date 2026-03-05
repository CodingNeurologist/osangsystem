import { C } from './constants'

/** 큰 눈 클로즈업 기본 — 안구 운동 전용 */
function EyeBase({ eyeState, children }: { eyeState: 'right' | 'left' | 'up-down' | 'circle-cw' | 'circle-ccw' | 'closed' | 'covered'; children?: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="100" r="95" fill={C.warmBg} />

      {/* 얼굴 — 크게 클로즈업 */}
      <circle cx="100" cy="105" r="68" fill={C.skin} />
      {/* 머리카락 */}
      <path d="M32 90 Q32 30 100 25 Q168 30 168 90" fill={C.hair} />
      <path d="M36 90 Q36 36 100 30 Q164 36 164 90" fill={C.hairLight} opacity={0.3} />

      {/* 귀 */}
      <ellipse cx="32" cy="105" rx="6" ry="10" fill={C.skin} />
      <ellipse cx="168" cy="105" rx="6" ry="10" fill={C.skin} />

      {/* 볼 */}
      <circle cx="62" cy="120" r="8" fill={C.cheek} opacity={0.35} />
      <circle cx="138" cy="120" r="8" fill={C.cheek} opacity={0.35} />

      {/* 입 (항상 미소) */}
      {eyeState !== 'covered' && (
        <path d="M88 135 Q100 142 112 135" stroke={C.mouth} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}

      {/* 눈 — 상태별 분기 */}
      {eyeState === 'right' && (
        <>
          {/* 눈 흰자 */}
          <ellipse cx="76" cy="100" rx="16" ry="12" fill="white" />
          <ellipse cx="124" cy="100" rx="16" ry="12" fill="white" />
          {/* 눈동자 — 오른쪽 */}
          <circle cx="84" cy="100" r="6" fill={C.eye} />
          <circle cx="132" cy="100" r="6" fill={C.eye} />
          <circle cx="85" cy="99" r="2" fill="white" />
          <circle cx="133" cy="99" r="2" fill="white" />
          {/* 방향 화살표 */}
          <g opacity={0.5}>
            <path d="M150 100 L170 100" stroke={C.motionAccent} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M165 96 L172 100 L165 104" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        </>
      )}

      {eyeState === 'left' && (
        <>
          <ellipse cx="76" cy="100" rx="16" ry="12" fill="white" />
          <ellipse cx="124" cy="100" rx="16" ry="12" fill="white" />
          <circle cx="68" cy="100" r="6" fill={C.eye} />
          <circle cx="116" cy="100" r="6" fill={C.eye} />
          <circle cx="69" cy="99" r="2" fill="white" />
          <circle cx="117" cy="99" r="2" fill="white" />
          <g opacity={0.5}>
            <path d="M50 100 L30 100" stroke={C.motionAccent} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M35 96 L28 100 L35 104" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        </>
      )}

      {eyeState === 'up-down' && (
        <>
          <ellipse cx="76" cy="100" rx="16" ry="12" fill="white" />
          <ellipse cx="124" cy="100" rx="16" ry="12" fill="white" />
          {/* 눈동자 — 위쪽 위치 + 위아래 애니메이션 */}
          <circle cx="76" cy="96" r="6" fill={C.eye}>
            <animate attributeName="cy" values="94;106;94" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="124" cy="96" r="6" fill={C.eye}>
            <animate attributeName="cy" values="94;106;94" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="77" cy="95" r="2" fill="white">
            <animate attributeName="cy" values="93;105;93" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="125" cy="95" r="2" fill="white">
            <animate attributeName="cy" values="93;105;93" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* 위아래 화살표 */}
          <g opacity={0.4}>
            <path d="M100 70 L100 60" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" />
            <path d="M97 64 L100 58 L103 64" stroke={C.motionAccent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M100 130 L100 140" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" />
            <path d="M97 136 L100 142 L103 136" stroke={C.motionAccent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        </>
      )}

      {eyeState === 'circle-cw' && (
        <>
          <ellipse cx="76" cy="100" rx="16" ry="12" fill="white" />
          <ellipse cx="124" cy="100" rx="16" ry="12" fill="white" />
          {/* 눈동자 — 원형 운동 */}
          <circle cx="76" cy="94" r="6" fill={C.eye}>
            <animate attributeName="cx" values="82;76;70;76;82" dur="2s" repeatCount="indefinite" />
            <animate attributeName="cy" values="100;106;100;94;100" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="124" cy="94" r="6" fill={C.eye}>
            <animate attributeName="cx" values="130;124;118;124;130" dur="2s" repeatCount="indefinite" />
            <animate attributeName="cy" values="100;106;100;94;100" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* 시계방향 원 화살표 */}
          <g opacity={0.35}>
            <circle cx="100" cy="100" r="28" fill="none" stroke={C.motionAccent} strokeWidth="1.5" strokeDasharray="5 3" />
            <path d="M128 100 L130 94 L124 96" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        </>
      )}

      {eyeState === 'circle-ccw' && (
        <>
          <ellipse cx="76" cy="100" rx="16" ry="12" fill="white" />
          <ellipse cx="124" cy="100" rx="16" ry="12" fill="white" />
          {/* 눈동자 — 반시계 방향 */}
          <circle cx="76" cy="94" r="6" fill={C.eye}>
            <animate attributeName="cx" values="70;76;82;76;70" dur="2s" repeatCount="indefinite" />
            <animate attributeName="cy" values="100;106;100;94;100" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="124" cy="94" r="6" fill={C.eye}>
            <animate attributeName="cx" values="118;124;130;124;118" dur="2s" repeatCount="indefinite" />
            <animate attributeName="cy" values="100;106;100;94;100" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* 반시계방향 원 화살표 */}
          <g opacity={0.35}>
            <circle cx="100" cy="100" r="28" fill="none" stroke={C.motionAccent} strokeWidth="1.5" strokeDasharray="5 3" />
            <path d="M72 100 L70 94 L76 96" stroke={C.motionAccent} strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        </>
      )}

      {eyeState === 'closed' && (
        <>
          {/* 감은 눈 위에 따뜻한 손바닥 */}
          <path d="M62 98 Q76 104 90 98" stroke={C.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M110 98 Q124 104 138 98" stroke={C.eye} strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* 따뜻한 손바닥 — 눈 위에 올리는 중 */}
          <ellipse cx="76" cy="95" rx="22" ry="14" fill={C.skin} opacity={0.8} />
          <ellipse cx="124" cy="95" rx="22" ry="14" fill={C.skin} opacity={0.8} />

          {/* 온기 표시 */}
          <g opacity={0.4}>
            <path d="M68 80 Q72 74 76 80" stroke={C.highlight} strokeWidth="1.5" fill="none" strokeLinecap="round">
              <animate attributeName="opacity" values="0.4;0.2;0.4" dur="2s" repeatCount="indefinite" />
            </path>
            <path d="M116 80 Q120 74 124 80" stroke={C.highlight} strokeWidth="1.5" fill="none" strokeLinecap="round">
              <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
            </path>
          </g>
        </>
      )}

      {eyeState === 'covered' && (
        <>
          {/* 손바닥 완전히 덮기 */}
          <ellipse cx="76" cy="96" rx="24" ry="16" fill={C.skin} />
          <ellipse cx="124" cy="96" rx="24" ry="16" fill={C.skin} />
          {/* 손가락 디테일 */}
          <path d="M56 90 Q58 86 62 88" stroke={C.skinShadow} strokeWidth="1" fill="none" opacity={0.3} />
          <path d="M144 90 Q142 86 138 88" stroke={C.skinShadow} strokeWidth="1" fill="none" opacity={0.3} />

          {/* 입 (평화로운) */}
          <path d="M92 135 Q100 139 108 135" stroke={C.mouth} strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* 평화 글로우 */}
          <ellipse cx="100" cy="100" rx="60" ry="55" fill={C.peaceful} opacity={0.15}>
            <animate attributeName="opacity" values="0.15;0.25;0.15" dur="3s" repeatCount="indefinite" />
          </ellipse>

          {/* 호흡 표시 */}
          <g opacity={0.4}>
            <path d="M90 148 Q100 140 110 148" stroke={C.breathe} strokeWidth="2" fill="none" strokeLinecap="round">
              <animate attributeName="opacity" values="0.4;0.15;0.4" dur="3s" repeatCount="indefinite" />
            </path>
          </g>
        </>
      )}

      {children}
    </svg>
  )
}

/** 스텝 0: 오른쪽 시선 */
function EyeRight() {
  return <EyeBase eyeState="right" />
}

/** 스텝 1: 왼쪽 시선 */
function EyeLeft() {
  return <EyeBase eyeState="left" />
}

/** 스텝 2: 위아래 시선 */
function EyeUpDown() {
  return <EyeBase eyeState="up-down" />
}

/** 스텝 3: 시계 방향 원 */
function EyeCircleCW() {
  return <EyeBase eyeState="circle-cw" />
}

/** 스텝 4: 반시계 방향 원 */
function EyeCircleCCW() {
  return <EyeBase eyeState="circle-ccw" />
}

/** 스텝 5: 파밍 (따뜻한 손바닥 올리기) */
function EyePalming() {
  return <EyeBase eyeState="closed" />
}

/** 스텝 6: 어둠 속 이완 */
function EyeRest() {
  return <EyeBase eyeState="covered" />
}

export function EyeResetIllustration({ step }: { step: number }) {
  switch (step) {
    case 0: return <EyeRight />
    case 1: return <EyeLeft />
    case 2: return <EyeUpDown />
    case 3: return <EyeCircleCW />
    case 4: return <EyeCircleCCW />
    case 5: return <EyePalming />
    case 6: return <EyeRest />
    default: return <EyeRight />
  }
}
