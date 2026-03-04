// ============================================================
// COMPASS-31 설문 데이터 정의
// 참고: Sletten DM, Suarez GA, Low PA, Mandrekar J, Singer W.
//       Mayo Clin Proc. 2012;87(12):1196-1201.
// ============================================================

import type { Survey, SurveyQuestion, ScoringRule } from '@/types'

// ----------------------------------------------------------
// 6개 영역 가중치
// weight = Weighted Max / Raw Max
// ----------------------------------------------------------
// | Domain             | Items    | Raw Max | Weighted Max | Weight  |
// |--------------------|----------|---------|--------------|---------|
// | orthostatic        | Q1-Q4   |   10    |      40      | 4.0000  |
// | vasomotor          | Q5-Q7   |    6    |       5      | 0.8333  |
// | secretomotor       | Q8-Q11  |    7    |      15      | 2.1429  |
// | gastrointestinal   | Q12-Q23 |   28    |      25      | 0.8929  |
// | bladder            | Q24-Q26 |    9    |      10      | 1.1111  |
// | pupillomotor       | Q27-Q31 |   15    |       5      | 0.3333  |
// | Total              | 31      |         |     100      |         |

const DOMAIN_WEIGHTS: Record<string, number> = {
  orthostatic: 4.0,
  vasomotor: 0.8333,
  secretomotor: 2.1429,
  gastrointestinal: 0.8929,
  bladder: 1.1111,
  pupillomotor: 0.3333,
}

// ----------------------------------------------------------
// 중증도 분류 기준
// ----------------------------------------------------------
const SCORING_RULES: ScoringRule[] = [
  {
    minScore: 0,
    maxScore: 20,
    severity: 'minimal',
    interpretation: '자율신경 기능이 대체로 양호한 수준입니다.',
  },
  {
    minScore: 21,
    maxScore: 40,
    severity: 'mild',
    interpretation:
      '경미한 자율신경 기능 변화가 있습니다. 생활습관 점검을 권고합니다.',
  },
  {
    minScore: 41,
    maxScore: 60,
    severity: 'moderate',
    interpretation:
      '중등도의 자율신경 기능 변화가 있습니다. 전문의 상담을 권고합니다.',
  },
  {
    minScore: 61,
    maxScore: 100,
    severity: 'severe',
    interpretation:
      '뚜렷한 자율신경 기능 변화가 있습니다. 빠른 전문의 상담을 권고합니다.',
  },
]

// ----------------------------------------------------------
// 31문항 정의
// ----------------------------------------------------------
const QUESTIONS: SurveyQuestion[] = [
  // ====================================
  // Domain 1: Orthostatic Intolerance (기립성) — Q1~Q4
  // ====================================
  {
    id: 'c31-1',
    text: '지난 1년간, 앉거나 누운 자세에서 일어설 때 어지럽거나, 눈앞이 캄캄해지거나, 머리가 멍해진 적이 있습니까?',
    type: 'single',
    options: ['예', '아니오'],
    optionScores: [1, 0],
    domain: 'orthostatic',
    required: true,
  },
  {
    id: 'c31-2',
    text: '일어설 때 이런 증상이 얼마나 자주 있었습니까?',
    type: 'single',
    options: ['드물게', '가끔', '자주', '거의 항상'],
    optionScores: [0, 1, 2, 3],
    domain: 'orthostatic',
    showIf: { questionId: 'c31-1', equals: '예' },
    required: true,
  },
  {
    id: 'c31-3',
    text: '이 증상은 어느 정도로 심합니까?',
    type: 'single',
    options: ['가벼움', '중간 정도', '심함'],
    optionScores: [1, 2, 3],
    domain: 'orthostatic',
    showIf: { questionId: 'c31-1', equals: '예' },
    required: true,
  },
  {
    id: 'c31-4',
    text: '지난 1년간, 이 증상은 어떻게 변했습니까?',
    type: 'single',
    options: [
      '많이 나빠졌다',
      '다소 나빠졌다',
      '비슷하다',
      '다소 좋아졌다',
      '많이 좋아졌다',
      '완전히 없어졌다',
    ],
    optionScores: [3, 2, 1, 0, 0, 0],
    domain: 'orthostatic',
    showIf: { questionId: 'c31-1', equals: '예' },
    required: true,
  },

  // ====================================
  // Domain 2: Vasomotor (혈관운동) — Q5~Q7
  // ====================================
  {
    id: 'c31-5',
    text: '지난 1년간, 피부색이 빨갛게, 하얗게, 또는 보라색으로 변한 적이 있습니까?',
    type: 'single',
    options: ['예', '아니오'],
    optionScores: [1, 0],
    domain: 'vasomotor',
    required: true,
  },
  {
    id: 'c31-6',
    text: '어느 부위에서 피부색 변화가 나타났습니까?',
    type: 'multiple',
    options: ['손', '발'],
    domain: 'vasomotor',
    showIf: { questionId: 'c31-5', equals: '예' },
    required: true,
  },
  {
    id: 'c31-7',
    text: '지난 1년간, 피부색 변화는 어떻게 변했습니까?',
    type: 'single',
    options: [
      '많이 나빠졌다',
      '다소 나빠졌다',
      '비슷하다',
      '다소 좋아졌다',
      '많이 좋아졌다',
      '완전히 없어졌다',
    ],
    optionScores: [3, 2, 1, 0, 0, 0],
    domain: 'vasomotor',
    showIf: { questionId: 'c31-5', equals: '예' },
    required: true,
  },

  // ====================================
  // Domain 3: Secretomotor (분비운동) — Q8~Q11
  // ====================================
  {
    id: 'c31-8',
    text: '지난 5년간, 전체적인 땀 분비량에 변화가 있었습니까?',
    type: 'single',
    options: [
      '땀이 훨씬 많아졌다',
      '땀이 다소 많아졌다',
      '변화 없다',
      '땀이 다소 줄었다',
      '땀이 훨씬 줄었다',
    ],
    optionScores: [1, 0, 0, 1, 2],
    domain: 'secretomotor',
    required: true,
  },
  {
    id: 'c31-9',
    text: '눈이 지나치게 건조합니까?',
    type: 'single',
    options: ['예', '아니오'],
    optionScores: [1, 0],
    domain: 'secretomotor',
    required: true,
  },
  {
    id: 'c31-10',
    text: '입이 지나치게 건조합니까?',
    type: 'single',
    options: ['예', '아니오'],
    optionScores: [1, 0],
    domain: 'secretomotor',
    required: true,
  },
  {
    id: 'c31-11',
    text: '가장 오래된 건조 증상(눈 또는 입)은 어떻게 변했습니까?',
    type: 'single',
    options: [
      '건조 증상이 없었다',
      '많이 나빠졌다',
      '다소 나빠졌다',
      '비슷하다',
      '다소 좋아졌다',
      '많이 좋아졌다',
      '완전히 없어졌다',
    ],
    optionScores: [0, 3, 2, 1, 0, 0, 0],
    domain: 'secretomotor',
    required: true,
  },

  // ====================================
  // Domain 4: Gastrointestinal (소화기) — Q12~Q23
  // ====================================
  {
    id: 'c31-12',
    text: '지난 1년간, 포만감이 예전보다 빨리 느껴집니까?',
    type: 'single',
    options: [
      '매우 빨라졌다',
      '다소 빨라졌다',
      '변화 없다',
      '다소 늦어졌다',
      '매우 늦어졌다',
    ],
    optionScores: [2, 1, 0, 0, 0],
    domain: 'gastrointestinal',
    required: true,
  },
  {
    id: 'c31-13',
    text: '식사 후 더부룩하거나 배가 부풀어 오르는 느낌이 있습니까?',
    type: 'single',
    options: ['없다', '가끔', '자주'],
    optionScores: [0, 1, 2],
    domain: 'gastrointestinal',
    required: true,
  },
  {
    id: 'c31-14',
    text: '식사 후 메스꺼움이나 구토가 있습니까?',
    type: 'single',
    options: ['없다', '가끔', '자주'],
    optionScores: [0, 1, 2],
    domain: 'gastrointestinal',
    required: true,
  },
  {
    id: 'c31-15',
    text: '복부 경련이나 복통이 있습니까?',
    type: 'single',
    options: ['없다', '가끔', '자주'],
    optionScores: [0, 1, 2],
    domain: 'gastrointestinal',
    required: true,
  },
  {
    id: 'c31-16',
    text: '지난 1년간, 설사가 있었습니까?',
    type: 'single',
    options: ['예', '아니오'],
    optionScores: [1, 0],
    domain: 'gastrointestinal',
    required: true,
  },
  {
    id: 'c31-17',
    text: '설사가 얼마나 자주 있었습니까?',
    type: 'single',
    options: ['드물게', '가끔', '자주', '거의 항상'],
    optionScores: [0, 1, 2, 3],
    domain: 'gastrointestinal',
    showIf: { questionId: 'c31-16', equals: '예' },
    required: true,
  },
  {
    id: 'c31-18',
    text: '설사 증상은 어느 정도로 심합니까?',
    type: 'single',
    options: ['가벼움', '중간 정도', '심함'],
    optionScores: [1, 2, 3],
    domain: 'gastrointestinal',
    showIf: { questionId: 'c31-16', equals: '예' },
    required: true,
  },
  {
    id: 'c31-19',
    text: '지난 1년간, 설사 증상은 어떻게 변했습니까?',
    type: 'single',
    options: [
      '많이 나빠졌다',
      '다소 나빠졌다',
      '비슷하다',
      '다소 좋아졌다',
      '많이 좋아졌다',
      '완전히 없어졌다',
    ],
    optionScores: [3, 2, 1, 0, 0, 0],
    domain: 'gastrointestinal',
    showIf: { questionId: 'c31-16', equals: '예' },
    required: true,
  },
  {
    id: 'c31-20',
    text: '지난 1년간, 변비가 있었습니까?',
    type: 'single',
    options: ['예', '아니오'],
    optionScores: [1, 0],
    domain: 'gastrointestinal',
    required: true,
  },
  {
    id: 'c31-21',
    text: '변비가 얼마나 자주 있었습니까?',
    type: 'single',
    options: ['드물게', '가끔', '자주', '거의 항상'],
    optionScores: [0, 1, 2, 3],
    domain: 'gastrointestinal',
    showIf: { questionId: 'c31-20', equals: '예' },
    required: true,
  },
  {
    id: 'c31-22',
    text: '변비 증상은 어느 정도로 심합니까?',
    type: 'single',
    options: ['가벼움', '중간 정도', '심함'],
    optionScores: [1, 2, 3],
    domain: 'gastrointestinal',
    showIf: { questionId: 'c31-20', equals: '예' },
    required: true,
  },
  {
    id: 'c31-23',
    text: '지난 1년간, 변비 증상은 어떻게 변했습니까?',
    type: 'single',
    options: [
      '많이 나빠졌다',
      '다소 나빠졌다',
      '비슷하다',
      '다소 좋아졌다',
      '많이 좋아졌다',
      '완전히 없어졌다',
    ],
    optionScores: [3, 2, 1, 0, 0, 0],
    domain: 'gastrointestinal',
    showIf: { questionId: 'c31-20', equals: '예' },
    required: true,
  },

  // ====================================
  // Domain 5: Bladder (방광) — Q24~Q26
  // ====================================
  {
    id: 'c31-24',
    text: '소변을 참기 어려운 적이 있습니까?',
    type: 'single',
    options: ['없다', '드물게', '가끔', '자주'],
    optionScores: [0, 1, 2, 3],
    domain: 'bladder',
    required: true,
  },
  {
    id: 'c31-25',
    text: '소변을 보기 힘들거나 소변 줄기가 약한 적이 있습니까?',
    type: 'single',
    options: ['없다', '드물게', '가끔', '자주'],
    optionScores: [0, 1, 2, 3],
    domain: 'bladder',
    required: true,
  },
  {
    id: 'c31-26',
    text: '소변을 본 후에도 잔뇨감이 남는 경우가 있습니까?',
    type: 'single',
    options: ['없다', '드물게', '가끔', '자주'],
    optionScores: [0, 1, 2, 3],
    domain: 'bladder',
    required: true,
  },

  // ====================================
  // Domain 6: Pupillomotor (동공운동) — Q27~Q31
  // ====================================
  {
    id: 'c31-27',
    text: '밝은 빛이 불편하게 느껴진 적이 있습니까?',
    type: 'single',
    options: ['전혀 없다', '드물게', '가끔', '자주'],
    optionScores: [0, 1, 2, 3],
    domain: 'pupillomotor',
    required: true,
  },
  {
    id: 'c31-28',
    text: '밝은 빛에 대한 민감함은 어느 정도입니까?',
    type: 'single',
    options: ['가벼움', '중간 정도', '심함'],
    optionScores: [1, 2, 3],
    domain: 'pupillomotor',
    showIf: { questionId: 'c31-27', notEquals: '전혀 없다' },
    required: true,
  },
  {
    id: 'c31-29',
    text: '눈의 초점을 맞추기 어려운 적이 있습니까?',
    type: 'single',
    options: ['전혀 없다', '드물게', '가끔', '자주'],
    optionScores: [0, 1, 2, 3],
    domain: 'pupillomotor',
    required: true,
  },
  {
    id: 'c31-30',
    text: '초점 문제는 어느 정도입니까?',
    type: 'single',
    options: ['가벼움', '중간 정도', '심함'],
    optionScores: [1, 2, 3],
    domain: 'pupillomotor',
    showIf: { questionId: 'c31-29', notEquals: '전혀 없다' },
    required: true,
  },
  {
    id: 'c31-31',
    text: '가장 불편한 눈 증상은 어떻게 변했습니까?',
    type: 'single',
    options: [
      '눈 증상이 없었다',
      '많이 나빠졌다',
      '다소 나빠졌다',
      '비슷하다',
      '다소 좋아졌다',
      '많이 좋아졌다',
      '완전히 없어졌다',
    ],
    optionScores: [0, 3, 2, 1, 0, 0, 0],
    domain: 'pupillomotor',
    required: true,
  },
]

// ----------------------------------------------------------
// COMPASS-31 설문 정의 (export)
// ----------------------------------------------------------
export const COMPASS31_SURVEY: Survey = {
  id: 'compass-31',
  title: 'COMPASS-31 자율신경 기능 평가',
  description:
    '지난 1년간 경험한 자율신경 관련 증상에 대해 응답해 주세요. 총 31문항이며, 일부 문항은 이전 답변에 따라 건너뛸 수 있습니다.',
  questions: QUESTIONS,
  scoringRules: SCORING_RULES,
  scoringType: 'weighted',
  domainWeights: DOMAIN_WEIGHTS,
  repeatable: true,
}

// ----------------------------------------------------------
// 영역 라벨 & 최대 가중 점수 (결과 시각화용)
// ----------------------------------------------------------
export const DOMAIN_LABELS: Record<string, string> = {
  orthostatic: '기립성',
  vasomotor: '혈관운동',
  secretomotor: '분비운동',
  gastrointestinal: '소화기',
  bladder: '방광',
  pupillomotor: '동공운동',
}

export const DOMAIN_MAX_WEIGHTED: Record<string, number> = {
  orthostatic: 40,
  vasomotor: 5,
  secretomotor: 15,
  gastrointestinal: 25,
  bladder: 10,
  pupillomotor: 5,
}

// 영역 순서 (시각화에서 사용)
export const DOMAIN_ORDER = [
  'orthostatic',
  'vasomotor',
  'secretomotor',
  'gastrointestinal',
  'bladder',
  'pupillomotor',
] as const
