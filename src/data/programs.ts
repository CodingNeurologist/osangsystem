export interface ProgramDay {
  day: number
  title: string
  activities: ProgramActivity[]
}

export interface ProgramActivity {
  type: 'checkin' | 'breathing' | 'somatic' | 'meditation' | 'journal'
  label: string
  route: string
  detail?: string
}

export interface ProgramDefinition {
  id: string
  name: string
  description: string
  durationDays: number
  weeks: ProgramWeek[]
}

export interface ProgramWeek {
  week: number
  theme: string
  days: ProgramDay[]
}

export const PROGRAMS: ProgramDefinition[] = [
  {
    id: 'ans-stabilization-4w',
    name: '자율신경 안정화 4주',
    description: '호흡, 신체 운동, 명상을 단계별로 경험하며 자율신경계를 안정시키는 프로그램입니다.',
    durationDays: 28,
    weeks: [
      {
        week: 1,
        theme: '호흡의 기초',
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          title: `${i + 1}일차 — 호흡에 집중하기`,
          activities: [
            { type: 'checkin' as const, label: '오늘의 컨디션', route: '/app/neural-reset/checkin' },
            { type: 'breathing' as const, label: '이완 호흡', route: '/app/neural-reset/breathing?pattern=relaxation', detail: '4-6초 이완 호흡 6회' },
            { type: 'journal' as const, label: '감사일기', route: '/app/neural-reset/journal' },
          ],
        })),
      },
      {
        week: 2,
        theme: '신체 인식',
        days: Array.from({ length: 7 }, (_, i) => {
          const somaticOptions = ['body-tapping', 'tree-shaking', 'butterfly-hug', 'eye-reset', 'vagus-massage', 'body-tapping', 'butterfly-hug']
          const somaticLabels = ['바디 태핑', '나무 흔들기', '나비 포옹', '안구 운동', '미주신경 마사지', '바디 태핑', '나비 포옹']
          return {
            day: i + 8,
            title: `${i + 8}일차 — 몸으로 느끼기`,
            activities: [
              { type: 'checkin' as const, label: '오늘의 컨디션', route: '/app/neural-reset/checkin' },
              { type: 'somatic' as const, label: somaticLabels[i], route: '/app/neural-reset/somatic', detail: somaticOptions[i] },
              { type: 'breathing' as const, label: '4-7-8 호흡', route: '/app/neural-reset/breathing?pattern=4-7-8', detail: '미주신경 활성화 호흡 4회' },
            ],
          }
        }),
      },
      {
        week: 3,
        theme: '이완 심화',
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 15,
          title: `${i + 15}일차 — 깊은 이완`,
          activities: [
            { type: 'checkin' as const, label: '오늘의 컨디션', route: '/app/neural-reset/checkin' },
            { type: 'meditation' as const, label: '명상음악 10분', route: '/app/neural-reset/music', detail: '바이노럴 비트 + 배경음' },
            { type: 'somatic' as const, label: '점진적 근이완', route: '/app/neural-reset/somatic', detail: 'pmr' },
          ],
        })),
      },
      {
        week: 4,
        theme: '통합 루틴',
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 22,
          title: `${i + 22}일차 — 나만의 루틴`,
          activities: [
            { type: 'checkin' as const, label: '오늘의 컨디션', route: '/app/neural-reset/checkin' },
            { type: 'breathing' as const, label: '공명 호흡', route: '/app/neural-reset/breathing?pattern=coherence', detail: 'HRV 최적화 호흡' },
            { type: 'journal' as const, label: '감사일기', route: '/app/neural-reset/journal' },
          ],
        })),
      },
    ],
  },
]

export function getProgramById(id: string): ProgramDefinition | undefined {
  return PROGRAMS.find((p) => p.id === id)
}
