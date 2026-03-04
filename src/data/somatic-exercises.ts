import type { SomaticExercise } from '@/types'

export const SOMATIC_EXERCISES: SomaticExercise[] = [
  {
    id: 'body-tapping',
    name: '바디 태핑',
    description: '온몸을 가볍게 두드려 신체 감각을 깨우고 에너지를 활성화합니다.',
    duration: '2분',
    durationSec: 120,
    effect: '신체 각성, 에너지 활성화',
    difficulty: '쉬움',
    icon: 'hand',
    tags: ['에너지', '각성', '간편'],
    steps: [
      {
        instruction: '양손 끝으로 머리 정수리를 가볍게 톡톡 두드립니다.',
        durationSec: 15,
      },
      {
        instruction: '이마, 관자놀이, 뺨, 턱 순서로 얼굴을 부드럽게 두드립니다.',
        durationSec: 15,
      },
      {
        instruction: '한 손으로 반대쪽 어깨부터 팔 아래로 쓸어내리듯 두드립니다.',
        durationSec: 15,
      },
      {
        instruction: '반대쪽도 같은 방법으로 어깨에서 손끝까지 두드립니다.',
        durationSec: 15,
      },
      {
        instruction: '가슴 중앙(흉선 부위)을 주먹으로 부드럽게 두드립니다.',
        durationSec: 15,
      },
      {
        instruction: '양옆 갈비뼈 아래를 손바닥으로 가볍게 두드립니다.',
        durationSec: 15,
      },
      {
        instruction: '허벅지 앞쪽을 양손으로 위에서 아래로 두드립니다.',
        durationSec: 15,
      },
      {
        instruction: '마지막으로 온몸을 가볍게 털어내며 마무리합니다.',
        durationSec: 15,
      },
    ],
  },
  {
    id: 'tree-shaking',
    name: '나무 흔들기',
    description: '서서 온몸을 흔들어 긴장과 교감신경 에너지를 방출합니다.',
    duration: '2분',
    durationSec: 120,
    effect: '긴장 해소, 교감신경 방출',
    difficulty: '쉬움',
    icon: 'tree-pine',
    tags: ['긴장해소', '활력', '간편'],
    steps: [
      {
        instruction: '양발을 어깨너비로 벌리고 편안하게 서세요. 무릎을 살짝 구부립니다.',
        durationSec: 10,
      },
      {
        instruction: '발을 바닥에 붙인 채로 무릎을 가볍게 구부렸다 펴며 몸을 위아래로 흔듭니다.',
        durationSec: 25,
      },
      {
        instruction: '흔들림을 점차 키워, 팔과 어깨도 자연스럽게 흔들리게 합니다.',
        durationSec: 25,
      },
      {
        instruction: '입을 벌리고 "아~" 소리를 내며 흔들어 보세요. 소리와 함께 긴장이 빠져나갑니다.',
        durationSec: 25,
      },
      {
        instruction: '흔들림을 서서히 줄이며, 몸이 자연스럽게 멈추도록 합니다.',
        durationSec: 20,
      },
      {
        instruction: '완전히 멈추고, 눈을 감은 채 몸 안의 감각을 느껴 봅니다.',
        durationSec: 15,
      },
    ],
  },
  {
    id: 'pmr',
    name: '점진적 근이완',
    description: '근육 그룹을 순서대로 긴장-이완하여 전신 이완과 수면을 유도합니다.',
    duration: '5분',
    durationSec: 300,
    effect: '전신 이완, 수면 유도',
    difficulty: '보통',
    icon: 'bed',
    tags: ['이완', '수면', '전신'],
    steps: [
      {
        instruction: '편안한 자세로 앉거나 누워 주세요. 천천히 3번 심호흡합니다.',
        durationSec: 20,
      },
      {
        instruction: '양손을 꽉 쥐고 5초간 힘을 줍니다… 이제 힘을 풀고 이완을 느낍니다.',
        durationSec: 30,
      },
      {
        instruction: '양팔에 힘을 주어 이두근을 5초간 긴장시킵니다… 이제 힘을 풀어 줍니다.',
        durationSec: 30,
      },
      {
        instruction: '어깨를 귀 쪽으로 올려 5초간 긴장합니다… 천천히 내리며 이완합니다.',
        durationSec: 30,
      },
      {
        instruction: '얼굴 근육을 모두 오므려 5초간 힘을 줍니다… 이제 풀어 줍니다.',
        durationSec: 30,
      },
      {
        instruction: '배에 힘을 주어 5초간 긴장합니다… 힘을 풀며 배가 부드러워지는 걸 느낍니다.',
        durationSec: 30,
      },
      {
        instruction: '양 허벅지에 힘을 주어 5초간 긴장합니다… 천천히 풀어 줍니다.',
        durationSec: 30,
      },
      {
        instruction: '발가락을 몸 쪽으로 당겨 종아리를 5초간 긴장합니다… 이제 풀어 줍니다.',
        durationSec: 30,
      },
      {
        instruction: '온몸이 이완된 상태를 느끼며, 천천히 호흡합니다. 원하는 만큼 머물러 주세요.',
        durationSec: 70,
      },
    ],
  },
  {
    id: 'butterfly-hug',
    name: '나비 포옹',
    description: '양팔을 교차하여 어깨를 번갈아 두드리는 양측성 자극으로 정서를 안정시킵니다.',
    duration: '1분',
    durationSec: 60,
    effect: '양측성 자극, 정서 안정',
    difficulty: '쉬움',
    icon: 'heart',
    tags: ['정서안정', '불안완화', '간편'],
    steps: [
      {
        instruction: '양팔을 가슴 앞에서 교차하여, 양손이 반대쪽 어깨에 닿게 합니다.',
        durationSec: 10,
      },
      {
        instruction: '눈을 감고, 왼손 → 오른손 순으로 어깨를 번갈아 가볍게 두드립니다.',
        durationSec: 20,
      },
      {
        instruction: '리듬을 유지하며, 마음속으로 안전한 장소나 편안한 기억을 떠올립니다.',
        durationSec: 20,
      },
      {
        instruction: '천천히 두드리는 속도를 줄이고, 양손을 어깨에 올린 채 멈춥니다.',
        durationSec: 10,
      },
    ],
  },
  {
    id: 'vagus-massage',
    name: '미주신경 마사지',
    description: '귀와 목 부위를 자극하여 미주신경을 활성화하고 심박을 안정시킵니다.',
    duration: '3분',
    durationSec: 180,
    effect: '미주신경 자극, 심박 안정',
    difficulty: '보통',
    icon: 'ear',
    tags: ['미주신경', '심박안정', '이완'],
    steps: [
      {
        instruction: '편안한 자세로 앉아 주세요. 어깨와 턱의 힘을 빼세요.',
        durationSec: 10,
      },
      {
        instruction: '양쪽 귓바퀴 뒤편(유양돌기 아래)을 검지와 중지로 천천히 원을 그리며 마사지합니다.',
        durationSec: 30,
      },
      {
        instruction: '귓불을 부드럽게 잡고 아래로 당기며 천천히 돌립니다.',
        durationSec: 30,
      },
      {
        instruction: '귀 안쪽 오목한 부분(이주)을 검지로 부드럽게 눌렀다 뗍니다.',
        durationSec: 30,
      },
      {
        instruction: '목 옆면(흉쇄유돌근)을 엄지와 검지로 위에서 아래로 부드럽게 쓸어내립니다.',
        durationSec: 30,
      },
      {
        instruction: '쇄골 바로 위 움푹한 부분을 검지로 가볍게 원을 그리며 마사지합니다.',
        durationSec: 30,
      },
      {
        instruction: '천천히 깊게 숨을 들이쉬고 내쉬며 마무리합니다.',
        durationSec: 20,
      },
    ],
  },
  {
    id: 'eye-reset',
    name: '안구 운동 리셋',
    description: '안구 움직임으로 시각 피로를 완화하고 부교감신경 이완 반응을 유도합니다.',
    duration: '2분',
    durationSec: 120,
    effect: '시각 피로 완화, 이완 반응',
    difficulty: '쉬움',
    icon: 'eye',
    tags: ['눈피로', '이완', '간편'],
    steps: [
      {
        instruction: '편안하게 앉아 고개를 고정합니다. 눈만 움직여 천천히 오른쪽 끝까지 봅니다.',
        durationSec: 10,
      },
      {
        instruction: '천천히 왼쪽 끝까지 시선을 이동합니다. 3회 반복합니다.',
        durationSec: 20,
      },
      {
        instruction: '위 → 아래로 천천히 시선을 이동합니다. 3회 반복합니다.',
        durationSec: 20,
      },
      {
        instruction: '시계 방향으로 크게 원을 그리듯 눈을 돌립니다. 3회 반복합니다.',
        durationSec: 20,
      },
      {
        instruction: '반시계 방향으로도 3회 반복합니다.',
        durationSec: 20,
      },
      {
        instruction: '손바닥을 비벼 따뜻하게 만든 뒤, 감은 눈 위에 가볍게 올립니다 (파밍).',
        durationSec: 20,
      },
      {
        instruction: '어둠 속에서 눈의 이완을 느끼며 천천히 호흡합니다.',
        durationSec: 10,
      },
    ],
  },
]

export function getExerciseById(id: string): SomaticExercise | undefined {
  return SOMATIC_EXERCISES.find((e) => e.id === id)
}
