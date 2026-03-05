/**
 * 소마틱 운동 일러스트 매니페스트
 * 6개 운동 × 41개 스텝 전체 목록
 *
 * 각 스텝에 대해:
 * - basePose: 기본 자세 (standing / sitting / lying)
 * - highlights: 강조할 신체 부위
 * - motionType: 동작 유형
 * - description: 일러스트 설명
 */

export interface IllustrationSpec {
  exerciseId: string
  stepIndex: number
  basePose: 'standing' | 'sitting' | 'lying'
  highlights: string[]
  motionType: 'tap' | 'shake' | 'press' | 'circle' | 'stretch' | 'breathe' | 'squeeze' | 'gaze' | 'cover' | 'none'
  faceState: 'neutral' | 'eyes-closed' | 'mouth-open' | 'peaceful' | 'squeeze'
  armsState: 'default' | 'crossed-chest' | 'raised' | 'hands-on-eyes' | 'fists' | 'tapping-head' | 'tapping-face' | 'tapping-arm-l' | 'tapping-arm-r' | 'tapping-chest' | 'tapping-ribs' | 'tapping-thighs' | 'shaking-off' | 'ear-massage' | 'earlobe-pull' | 'tragus-press' | 'neck-stroke' | 'collarbone-circle'
  description: string
}

export const ILLUSTRATION_MANIFEST: IllustrationSpec[] = [
  // ═══════════════════════════════════════
  // 1. 바디 태핑 (body-tapping) — 8 스텝
  // ═══════════════════════════════════════
  {
    exerciseId: 'body-tapping',
    stepIndex: 0,
    basePose: 'standing',
    highlights: ['head-top'],
    motionType: 'tap',
    faceState: 'neutral',
    armsState: 'tapping-head',
    description: '양손 끝으로 머리 정수리를 톡톡 두드리는 모습',
  },
  {
    exerciseId: 'body-tapping',
    stepIndex: 1,
    basePose: 'standing',
    highlights: ['face'],
    motionType: 'tap',
    faceState: 'eyes-closed',
    armsState: 'tapping-face',
    description: '이마, 관자놀이, 뺨, 턱을 두드리는 모습',
  },
  {
    exerciseId: 'body-tapping',
    stepIndex: 2,
    basePose: 'standing',
    highlights: ['left-arm'],
    motionType: 'tap',
    faceState: 'neutral',
    armsState: 'tapping-arm-l',
    description: '오른손으로 왼쪽 어깨→팔 아래로 두드리는 모습',
  },
  {
    exerciseId: 'body-tapping',
    stepIndex: 3,
    basePose: 'standing',
    highlights: ['right-arm'],
    motionType: 'tap',
    faceState: 'neutral',
    armsState: 'tapping-arm-r',
    description: '왼손으로 오른쪽 어깨→팔 아래로 두드리는 모습',
  },
  {
    exerciseId: 'body-tapping',
    stepIndex: 4,
    basePose: 'standing',
    highlights: ['chest'],
    motionType: 'tap',
    faceState: 'neutral',
    armsState: 'tapping-chest',
    description: '가슴 중앙(흉선)을 주먹으로 두드리는 모습',
  },
  {
    exerciseId: 'body-tapping',
    stepIndex: 5,
    basePose: 'standing',
    highlights: ['ribs'],
    motionType: 'tap',
    faceState: 'neutral',
    armsState: 'tapping-ribs',
    description: '양옆 갈비뼈 아래를 손바닥으로 두드리는 모습',
  },
  {
    exerciseId: 'body-tapping',
    stepIndex: 6,
    basePose: 'standing',
    highlights: ['thighs'],
    motionType: 'tap',
    faceState: 'neutral',
    armsState: 'tapping-thighs',
    description: '허벅지 앞쪽을 양손으로 두드리는 모습',
  },
  {
    exerciseId: 'body-tapping',
    stepIndex: 7,
    basePose: 'standing',
    highlights: ['whole-body'],
    motionType: 'shake',
    faceState: 'peaceful',
    armsState: 'shaking-off',
    description: '온몸을 가볍게 털어내며 마무리하는 모습',
  },

  // ═══════════════════════════════════════
  // 2. 나무 흔들기 (tree-shaking) — 6 스텝
  // ═══════════════════════════════════════
  {
    exerciseId: 'tree-shaking',
    stepIndex: 0,
    basePose: 'standing',
    highlights: ['legs'],
    motionType: 'none',
    faceState: 'neutral',
    armsState: 'default',
    description: '양발 어깨너비, 무릎 살짝 구부린 자세',
  },
  {
    exerciseId: 'tree-shaking',
    stepIndex: 1,
    basePose: 'standing',
    highlights: ['legs'],
    motionType: 'shake',
    faceState: 'neutral',
    armsState: 'default',
    description: '무릎 구부렸다 펴며 위아래 흔드는 모습',
  },
  {
    exerciseId: 'tree-shaking',
    stepIndex: 2,
    basePose: 'standing',
    highlights: ['arms', 'shoulders'],
    motionType: 'shake',
    faceState: 'neutral',
    armsState: 'raised',
    description: '팔과 어깨도 크게 흔드는 모습',
  },
  {
    exerciseId: 'tree-shaking',
    stepIndex: 3,
    basePose: 'standing',
    highlights: ['whole-body'],
    motionType: 'shake',
    faceState: 'mouth-open',
    armsState: 'raised',
    description: '입 벌리고 소리내며 흔드는 모습, 음파 표시',
  },
  {
    exerciseId: 'tree-shaking',
    stepIndex: 4,
    basePose: 'standing',
    highlights: [],
    motionType: 'shake',
    faceState: 'eyes-closed',
    armsState: 'default',
    description: '흔들림 줄이며 자연스럽게 멈추는 모습',
  },
  {
    exerciseId: 'tree-shaking',
    stepIndex: 5,
    basePose: 'standing',
    highlights: [],
    motionType: 'none',
    faceState: 'eyes-closed',
    armsState: 'default',
    description: '완전히 멈추고 눈 감은 채 고요한 모습',
  },

  // ═══════════════════════════════════════
  // 3. 점진적 근이완 (pmr) — 9 스텝
  // ═══════════════════════════════════════
  {
    exerciseId: 'pmr',
    stepIndex: 0,
    basePose: 'sitting',
    highlights: [],
    motionType: 'breathe',
    faceState: 'eyes-closed',
    armsState: 'default',
    description: '편안한 자세로 앉아 심호흡하는 모습',
  },
  {
    exerciseId: 'pmr',
    stepIndex: 1,
    basePose: 'sitting',
    highlights: ['hands'],
    motionType: 'squeeze',
    faceState: 'neutral',
    armsState: 'fists',
    description: '양손 꽉 쥐고 힘주는 모습, 손 강조',
  },
  {
    exerciseId: 'pmr',
    stepIndex: 2,
    basePose: 'sitting',
    highlights: ['biceps'],
    motionType: 'squeeze',
    faceState: 'neutral',
    armsState: 'fists',
    description: '이두근에 힘주는 모습, 팔 근육 강조',
  },
  {
    exerciseId: 'pmr',
    stepIndex: 3,
    basePose: 'sitting',
    highlights: ['shoulders'],
    motionType: 'squeeze',
    faceState: 'neutral',
    armsState: 'default',
    description: '어깨를 귀 쪽으로 올린 모습, 어깨 강조',
  },
  {
    exerciseId: 'pmr',
    stepIndex: 4,
    basePose: 'sitting',
    highlights: ['face'],
    motionType: 'squeeze',
    faceState: 'squeeze',
    armsState: 'default',
    description: '얼굴 근육 오므린 모습',
  },
  {
    exerciseId: 'pmr',
    stepIndex: 5,
    basePose: 'sitting',
    highlights: ['abdomen'],
    motionType: 'squeeze',
    faceState: 'neutral',
    armsState: 'default',
    description: '배에 힘주는 모습, 복부 강조',
  },
  {
    exerciseId: 'pmr',
    stepIndex: 6,
    basePose: 'sitting',
    highlights: ['thighs'],
    motionType: 'squeeze',
    faceState: 'neutral',
    armsState: 'default',
    description: '허벅지에 힘주는 모습',
  },
  {
    exerciseId: 'pmr',
    stepIndex: 7,
    basePose: 'sitting',
    highlights: ['calves'],
    motionType: 'stretch',
    faceState: 'neutral',
    armsState: 'default',
    description: '발가락 당겨 종아리 긴장하는 모습',
  },
  {
    exerciseId: 'pmr',
    stepIndex: 8,
    basePose: 'sitting',
    highlights: [],
    motionType: 'breathe',
    faceState: 'peaceful',
    armsState: 'default',
    description: '온몸 이완 상태, 평화로운 호흡',
  },

  // ═══════════════════════════════════════
  // 4. 나비 포옹 (butterfly-hug) — 4 스텝
  // ═══════════════════════════════════════
  {
    exerciseId: 'butterfly-hug',
    stepIndex: 0,
    basePose: 'sitting',
    highlights: ['shoulders'],
    motionType: 'none',
    faceState: 'neutral',
    armsState: 'crossed-chest',
    description: '양팔 교차, 양손이 반대쪽 어깨에 닿은 자세',
  },
  {
    exerciseId: 'butterfly-hug',
    stepIndex: 1,
    basePose: 'sitting',
    highlights: ['shoulders'],
    motionType: 'tap',
    faceState: 'eyes-closed',
    armsState: 'crossed-chest',
    description: '눈 감고 번갈아 어깨 두드리는 모습',
  },
  {
    exerciseId: 'butterfly-hug',
    stepIndex: 2,
    basePose: 'sitting',
    highlights: ['shoulders'],
    motionType: 'tap',
    faceState: 'eyes-closed',
    armsState: 'crossed-chest',
    description: '리듬 유지, 안전한 기억 떠올리는 모습 (생각 풍선)',
  },
  {
    exerciseId: 'butterfly-hug',
    stepIndex: 3,
    basePose: 'sitting',
    highlights: [],
    motionType: 'none',
    faceState: 'peaceful',
    armsState: 'crossed-chest',
    description: '두드림 멈추고 양손 어깨에 올린 채 고요한 모습',
  },

  // ═══════════════════════════════════════
  // 5. 미주신경 마사지 (vagus-massage) — 7 스텝
  // ═══════════════════════════════════════
  {
    exerciseId: 'vagus-massage',
    stepIndex: 0,
    basePose: 'sitting',
    highlights: [],
    motionType: 'none',
    faceState: 'neutral',
    armsState: 'default',
    description: '편안한 자세로 앉은 모습, 어깨·턱 이완',
  },
  {
    exerciseId: 'vagus-massage',
    stepIndex: 1,
    basePose: 'sitting',
    highlights: ['behind-ears'],
    motionType: 'circle',
    faceState: 'eyes-closed',
    armsState: 'ear-massage',
    description: '귓바퀴 뒤를 원형으로 마사지하는 모습',
  },
  {
    exerciseId: 'vagus-massage',
    stepIndex: 2,
    basePose: 'sitting',
    highlights: ['earlobes'],
    motionType: 'press',
    faceState: 'eyes-closed',
    armsState: 'earlobe-pull',
    description: '귓불을 잡고 아래로 당기는 모습',
  },
  {
    exerciseId: 'vagus-massage',
    stepIndex: 3,
    basePose: 'sitting',
    highlights: ['tragus'],
    motionType: 'press',
    faceState: 'eyes-closed',
    armsState: 'tragus-press',
    description: '귀 안쪽 이주를 부드럽게 누르는 모습',
  },
  {
    exerciseId: 'vagus-massage',
    stepIndex: 4,
    basePose: 'sitting',
    highlights: ['neck-sides'],
    motionType: 'press',
    faceState: 'eyes-closed',
    armsState: 'neck-stroke',
    description: '목 옆면을 위에서 아래로 쓸어내리는 모습',
  },
  {
    exerciseId: 'vagus-massage',
    stepIndex: 5,
    basePose: 'sitting',
    highlights: ['collarbone'],
    motionType: 'circle',
    faceState: 'eyes-closed',
    armsState: 'collarbone-circle',
    description: '쇄골 위 움푹한 부분 원형 마사지하는 모습',
  },
  {
    exerciseId: 'vagus-massage',
    stepIndex: 6,
    basePose: 'sitting',
    highlights: [],
    motionType: 'breathe',
    faceState: 'peaceful',
    armsState: 'default',
    description: '깊은 호흡으로 마무리하는 평화로운 모습',
  },

  // ═══════════════════════════════════════
  // 6. 안구 운동 리셋 (eye-reset) — 7 스텝
  // ═══════════════════════════════════════
  {
    exerciseId: 'eye-reset',
    stepIndex: 0,
    basePose: 'sitting',
    highlights: ['eyes'],
    motionType: 'gaze',
    faceState: 'neutral',
    armsState: 'default',
    description: '고개 고정, 눈만 오른쪽 끝까지 보는 모습',
  },
  {
    exerciseId: 'eye-reset',
    stepIndex: 1,
    basePose: 'sitting',
    highlights: ['eyes'],
    motionType: 'gaze',
    faceState: 'neutral',
    armsState: 'default',
    description: '눈만 왼쪽 끝까지 보는 모습',
  },
  {
    exerciseId: 'eye-reset',
    stepIndex: 2,
    basePose: 'sitting',
    highlights: ['eyes'],
    motionType: 'gaze',
    faceState: 'neutral',
    armsState: 'default',
    description: '위→아래 시선 이동하는 모습',
  },
  {
    exerciseId: 'eye-reset',
    stepIndex: 3,
    basePose: 'sitting',
    highlights: ['eyes'],
    motionType: 'gaze',
    faceState: 'neutral',
    armsState: 'default',
    description: '시계 방향 원 그리며 눈 돌리는 모습',
  },
  {
    exerciseId: 'eye-reset',
    stepIndex: 4,
    basePose: 'sitting',
    highlights: ['eyes'],
    motionType: 'gaze',
    faceState: 'neutral',
    armsState: 'default',
    description: '반시계 방향 원 그리는 모습',
  },
  {
    exerciseId: 'eye-reset',
    stepIndex: 5,
    basePose: 'sitting',
    highlights: ['hands', 'eyes'],
    motionType: 'cover',
    faceState: 'eyes-closed',
    armsState: 'hands-on-eyes',
    description: '따뜻한 손바닥을 감은 눈 위에 올리는 모습 (파밍)',
  },
  {
    exerciseId: 'eye-reset',
    stepIndex: 6,
    basePose: 'sitting',
    highlights: [],
    motionType: 'breathe',
    faceState: 'eyes-closed',
    armsState: 'hands-on-eyes',
    description: '어둠 속 눈 이완, 천천히 호흡하는 모습',
  },
]

/** 운동 ID로 해당 운동의 일러스트 스펙 목록 가져오기 */
export function getIllustrationSpecs(exerciseId: string): IllustrationSpec[] {
  return ILLUSTRATION_MANIFEST.filter((s) => s.exerciseId === exerciseId)
}

/** 특정 운동의 특정 스텝 일러스트 스펙 가져오기 */
export function getStepIllustration(exerciseId: string, stepIndex: number): IllustrationSpec | undefined {
  return ILLUSTRATION_MANIFEST.find((s) => s.exerciseId === exerciseId && s.stepIndex === stepIndex)
}
