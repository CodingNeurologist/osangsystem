import type { BreathingPattern } from '@/types'

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'relaxation',
    name: '이완 호흡',
    description: '길게 내쉬며 긴장을 풀어주는 기본 이완 호흡법입니다.',
    purpose: '기본 이완',
    inhale: 4,
    hold1: 0,
    exhale: 6,
    hold2: 0,
    defaultCycles: 6,
  },
  {
    id: '4-7-8',
    name: '4-7-8 호흡',
    description: '미주신경을 활성화하여 깊은 이완과 수면을 유도하는 호흡법입니다.',
    purpose: '미주신경 활성화, 수면 유도',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    defaultCycles: 4,
  },
  {
    id: 'box',
    name: '박스 호흡',
    description: '네이비 씰이 사용하는 호흡법으로, 교감-부교감 균형을 잡아줍니다.',
    purpose: '집중력, 균형',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    defaultCycles: 6,
  },
  {
    id: 'coherence',
    name: '공명 호흡',
    description: '분당 약 5.5회의 공명 주파수 호흡으로 심박변이도(HRV)를 최적화합니다.',
    purpose: 'HRV 최적화, 자율신경 안정',
    inhale: 5,
    hold1: 0,
    exhale: 5,
    hold2: 0,
    defaultCycles: 8,
  },
]

export const CYCLE_OPTIONS = [4, 6, 8, 10] as const
