// ============================================================
// 자율신경 스트레스 자가체크 설문 데이터
// ============================================================

import type {
  StressCheckCategory,
  StressCheckLifestyleQuestion,
  StressCheckSeverity,
} from '@/types'

// ----------------------------------------------------------
// 8개 카테고리 정의
// ----------------------------------------------------------

export const STRESS_CHECK_CATEGORIES: StressCheckCategory[] = [
  {
    id: 'sleep',
    name: '수면습관',
    icon: 'Moon',
    description: '수면과 관련된 습관을 점검합니다',
    weight: 0.8,
    items: [
      { id: 'sleep-1', text: '수면시간이 매우 불규칙하다' },
      { id: 'sleep-2', text: '교대근무를 하고 있다' },
      { id: 'sleep-3', text: '자다가 자주 깬다' },
      { id: 'sleep-4', text: '코골이가 심하거나 수면무호흡이 있다는 얘기를 들었다' },
      { id: 'sleep-5', text: '자려고 하면 다리가 불편하다 (하지불안 증상)' },
      { id: 'sleep-6', text: '자기 직전까지 일을 하다가 잔다' },
      { id: 'sleep-7', text: '자기 전에 휴대폰을 1시간 이상 보다가 잠에 든다' },
    ],
  },
  {
    id: 'mood',
    name: '기분/감정',
    icon: 'Heart',
    description: '최근 기분과 감정 상태를 점검합니다',
    weight: 1.2,
    items: [
      { id: 'mood-1', text: '우울함' },
      { id: 'mood-2', text: '불안, 긴장, 초조' },
      { id: 'mood-3', text: '공황발작을 겪은 적이 있다' },
      { id: 'mood-4', text: '짜증이 나거나 분노조절이 안 된다' },
      { id: 'mood-5', text: '감정기복이 심하다' },
      { id: 'mood-6', text: '스트레스가 감당이 안 되고 있는 것 같다' },
      { id: 'mood-7', text: '잡념이나 생각이 끊임없이 괴롭힌다' },
      { id: 'mood-8', text: '강박사고가 있다' },
    ],
  },
  {
    id: 'brain',
    name: '뇌기능/인지',
    icon: 'Brain',
    description: '인지 기능과 신경학적 증상을 점검합니다',
    weight: 1.2,
    items: [
      { id: 'brain-1', text: '집중력이 저하되고 산만하다. 실수가 잦다' },
      { id: 'brain-2', text: '기억력이 떨어지고 건망증이 심하다' },
      { id: 'brain-3', text: '복잡한 생각을 하거나 계획을 세우는 게 어렵다' },
      { id: 'brain-4', text: '머리가 멍하고 맑지가 않다' },
      { id: 'brain-5', text: '두통' },
      { id: 'brain-6', text: '어지럼증' },
      { id: 'brain-7', text: '하지 불안 증상' },
      { id: 'brain-8', text: '걸을 때 중심이 잘 잡히지 않는 것 같다' },
    ],
  },
  {
    id: 'cardiovascular',
    name: '순환기계',
    icon: 'Activity',
    description: '심혈관 및 순환계 증상을 점검합니다',
    weight: 1.2,
    items: [
      { id: 'cardio-1', text: '가슴 두근거림' },
      { id: 'cardio-2', text: '심장이 불규칙하게 뛴다' },
      { id: 'cardio-3', text: '호흡이 가쁘거나 가슴이 답답하다' },
      { id: 'cardio-4', text: '갑자기 상체나 얼굴에 열이 오른다' },
      { id: 'cardio-5', text: '손발이 많이 차다' },
      { id: 'cardio-6', text: '앉았다가 일어날 때 어지럽다' },
      { id: 'cardio-7', text: '흉통이 생긴다' },
      { id: 'cardio-8', text: '과도하게 땀이 난다' },
    ],
  },
  {
    id: 'digestive',
    name: '소화기계',
    icon: 'Utensils',
    description: '소화기 관련 증상을 점검합니다',
    weight: 1.0,
    items: [
      { id: 'digest-1', text: '자주 속이 더부룩하다' },
      { id: 'digest-2', text: '식사 후 위가 멈춘 것 같이 답답하다' },
      { id: 'digest-3', text: '위산 역류 증상이 있다' },
      { id: 'digest-4', text: '이유 없이 구역질이 나거나 구토를 한다' },
      { id: 'digest-5', text: '설사를 자주 한다' },
      { id: 'digest-6', text: '변비가 잘 생긴다' },
      { id: 'digest-7', text: '스트레스를 받으면 배가 아프다' },
      { id: 'digest-8', text: '명치 부위가 딱딱하게 굳은 것 같다' },
    ],
  },
  {
    id: 'urogenital',
    name: '비뇨생식기계',
    icon: 'Droplets',
    description: '비뇨기 및 생식기 관련 증상을 점검합니다',
    weight: 0.8,
    items: [
      { id: 'uro-1', text: '소변이 자주 마렵다' },
      { id: 'uro-2', text: '소변 때문에 자주 잠에서 깬다' },
      { id: 'uro-3', text: '갑자기 소변을 참기 어려울 때가 있다' },
      { id: 'uro-4', text: '성관계를 하는 데 문제가 있다' },
      { id: 'uro-5', text: '생리 주기가 불규칙하다' },
      { id: 'uro-6', text: '다낭성난소증후군을 진단받은 적이 있다' },
    ],
  },
  {
    id: 'musculoskeletal',
    name: '근골격/통증',
    icon: 'Bone',
    description: '근골격계 및 통증 관련 증상을 점검합니다',
    weight: 0.8,
    items: [
      { id: 'muscle-1', text: '지속되거나 자주 발생하는 통증 부위가 있다' },
      { id: 'muscle-2', text: '온몸에 통증이 있다' },
      { id: 'muscle-3', text: '통증이 이곳저곳을 돌아다니는 것 같다' },
      { id: 'muscle-4', text: '이유 없이 저릿저릿하거나 따끔거리는 등 이상 감각이 있다' },
    ],
  },
  {
    id: 'immune',
    name: '면역/호르몬',
    icon: 'Shield',
    description: '면역 및 호르몬 관련 증상을 점검합니다',
    weight: 0.8,
    items: [
      { id: 'immune-1', text: '입술 포진이 자주 생기거나 대상포진이 생긴 적이 있다' },
      { id: 'immune-2', text: '탈모' },
      { id: 'immune-3', text: '두드러기, 아토피 등 알레르기성 피부질환' },
      { id: 'immune-4', text: '알레르기성 비염' },
      { id: 'immune-5', text: '질염이나 방광염 등이 자주 발생' },
      { id: 'immune-6', text: '몸이 잘 붓는다' },
      { id: 'immune-7', text: '이유 없이 살이 찐다' },
      { id: 'immune-8', text: '염증이 잘 생기는 것 같다' },
      { id: 'immune-9', text: '감염성 질환에 취약한 것 같다' },
    ],
  },
]

// ----------------------------------------------------------
// 라이프스타일 질문
// ----------------------------------------------------------

export const LIFESTYLE_QUESTIONS: StressCheckLifestyleQuestion[] = [
  {
    id: 'exercise',
    text: '운동 습관을 골라주세요',
    type: 'single',
    options: [
      '운동은 전혀 하지 않는다',
      '가끔 운동한다',
      '주 1-2회 운동한다',
      '주 3회 이상 규칙적으로 운동한다',
    ],
  },
  {
    id: 'caffeine',
    text: '카페인을 섭취하고 있나요?',
    type: 'single',
    options: [
      '전혀 하지 않는다',
      '어쩌다가 한번씩',
      '매일 1-2잔',
      '매일 3잔 이상',
    ],
  },
]

// ----------------------------------------------------------
// 중증도 기준
// ----------------------------------------------------------

export const STRESS_CHECK_SEVERITY_LEVELS: Array<{
  min: number
  max: number
  level: StressCheckSeverity
  label: string
  interpretation: string
}> = [
  {
    min: 0,
    max: 20,
    level: 'normal',
    label: '정상',
    interpretation: '현재 자율신경 관련 증상이 적은 편입니다. 건강한 생활습관을 유지하세요.',
  },
  {
    min: 21,
    max: 40,
    level: 'caution',
    label: '주의',
    interpretation: '일부 영역에서 증상이 확인됩니다. 생활습관 개선과 스트레스 관리를 권합니다.',
  },
  {
    min: 41,
    max: 60,
    level: 'attention',
    label: '관심필요',
    interpretation: '여러 영역에서 증상이 확인됩니다. 자율신경 진료를 받아보시는 것을 고려해보세요.',
  },
  {
    min: 61,
    max: 100,
    level: 'consult',
    label: '전문상담 권장',
    interpretation: '다수의 영역에서 증상이 뚜렷합니다. 자율신경 전문 진료를 받아보시기를 권합니다.',
  },
]

// ----------------------------------------------------------
// 카테고리 순서 및 아이콘 매핑
// ----------------------------------------------------------

export const CATEGORY_ORDER = [
  'sleep',
  'mood',
  'brain',
  'cardiovascular',
  'digestive',
  'urogenital',
  'musculoskeletal',
  'immune',
] as const

export const CATEGORY_LABELS: Record<string, string> = {
  sleep: '수면습관',
  mood: '기분/감정',
  brain: '뇌기능/인지',
  cardiovascular: '순환기계',
  digestive: '소화기계',
  urogenital: '비뇨생식기계',
  musculoskeletal: '근골격/통증',
  immune: '면역/호르몬',
}

export const SEVERITY_CONFIG: Record<
  StressCheckSeverity,
  { label: string; variant: 'secondary' | 'outline' | 'default' | 'destructive'; color: string }
> = {
  normal: { label: '정상', variant: 'secondary', color: 'text-green-700' },
  caution: { label: '주의', variant: 'outline', color: 'text-yellow-700' },
  attention: { label: '관심필요', variant: 'default', color: 'text-orange-700' },
  consult: { label: '전문상담 권장', variant: 'destructive', color: 'text-red-700' },
}
