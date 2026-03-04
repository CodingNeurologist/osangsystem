import type { BadgeDefinition } from '@/types'

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-step',
    name: '첫 걸음',
    description: '뉴럴리셋 여정을 시작했습니다',
    icon: 'Footprints',
    condition: '첫 번째 활동 완료',
  },
  {
    id: 'streak-3',
    name: '3일 연속',
    description: '꾸준함의 시작',
    icon: 'Flame',
    condition: '3일 스트릭 달성',
  },
  {
    id: 'streak-7',
    name: '7일 연속',
    description: '한 주를 함께했습니다',
    icon: 'Flame',
    condition: '7일 스트릭 달성',
  },
  {
    id: 'streak-30',
    name: '30일 연속',
    description: '한 달의 변화',
    icon: 'Trophy',
    condition: '30일 스트릭 달성',
  },
  {
    id: 'breathing-master',
    name: '호흡 마스터',
    description: '호흡의 힘을 알게 되었습니다',
    icon: 'Wind',
    condition: '호흡 세션 20회 완료',
  },
  {
    id: 'journal-writer',
    name: '일기 작가',
    description: '마음을 기록하는 습관',
    icon: 'BookHeart',
    condition: '감사일기 10회 작성',
  },
  {
    id: 'holistic-care',
    name: '전인 관리',
    description: '오늘 하루를 온전히 돌봤습니다',
    icon: 'Heart',
    condition: '같은 날 체크인+호흡+일기 모두 완료',
  },
  {
    id: 'improvement',
    name: '개선 확인',
    description: '눈에 보이는 변화',
    icon: 'TrendingUp',
    condition: '주간 평균 체크인 점수 3점 이상 향상',
  },
]

export function getBadgeById(badgeId: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === badgeId)
}
