import type { CheckinRecommendation, CheckinSeverity, DailyCheckin } from '@/types'

/**
 * 체크인 총점(4-20) 기반 severity 판정
 */
export function getCheckinSeverity(totalScore: number): CheckinSeverity {
  if (totalScore <= 5) return 'crisis'
  if (totalScore <= 10) return 'caution'
  if (totalScore <= 15) return 'normal'
  return 'good'
}

/**
 * 체크인 총점 계산 (body + mood + energy + stress)
 */
export function getCheckinTotal(checkin: DailyCheckin): number {
  return checkin.body_score + checkin.mood_score + checkin.energy_score + checkin.stress_score
}

/**
 * severity에 따른 맞춤 활동 추천
 */
export function getRecommendations(
  totalScore: number,
  recentActivities: string[] = []
): CheckinRecommendation[] {
  const severity = getCheckinSeverity(totalScore)
  const all: CheckinRecommendation[] = []

  switch (severity) {
    case 'crisis':
      // 위기: 안전 프로토콜은 별도 배너로 처리, 여기서는 가벼운 활동만
      all.push(
        {
          activityType: 'breathing',
          title: '4-7-8 호흡',
          description: '미주신경을 활성화하여 마음을 안정시켜 보세요',
          route: '/app/neural-reset/breathing?pattern=4-7-8',
          duration: '2분',
        },
        {
          activityType: 'sos',
          title: '긴급 안정 가이드',
          description: '지금 바로 사용할 수 있는 단계별 안정 가이드',
          route: '/app/neural-reset/sos',
          duration: '5분',
        }
      )
      break
    case 'caution':
      all.push(
        {
          activityType: 'breathing',
          title: '공명 호흡',
          description: '자율신경을 안정시키는 공명 주파수 호흡',
          route: '/app/neural-reset/breathing?pattern=coherence',
          duration: '3분',
        },
        {
          activityType: 'somatic',
          title: '나비 포옹',
          description: '양측성 자극으로 정서를 안정시켜 보세요',
          route: '/app/neural-reset/somatic',
          duration: '1분',
        },
        {
          activityType: 'meditation',
          title: '명상음악',
          description: '바이노럴 비트로 마음을 가라앉혀 보세요',
          route: '/app/neural-reset/music',
          duration: '10분',
        }
      )
      break
    case 'normal':
      all.push(
        {
          activityType: 'breathing',
          title: '이완 호흡',
          description: '하루의 긴장을 풀어주는 기본 이완 호흡',
          route: '/app/neural-reset/breathing?pattern=relaxation',
          duration: '2분',
        },
        {
          activityType: 'somatic',
          title: '바디 태핑',
          description: '온몸을 가볍게 두드려 에너지를 활성화하세요',
          route: '/app/neural-reset/somatic',
          duration: '2분',
        },
        {
          activityType: 'meditation',
          title: '명상음악',
          description: '자연의 소리와 함께 휴식을 취해 보세요',
          route: '/app/neural-reset/music',
          duration: '10분',
        },
        {
          activityType: 'journal',
          title: '감사일기',
          description: '오늘 감사한 일을 기록해 보세요',
          route: '/app/neural-reset/journal',
          duration: '3분',
        }
      )
      break
    case 'good':
      all.push(
        {
          activityType: 'journal',
          title: '감사일기',
          description: '좋은 하루를 기록으로 남겨 보세요',
          route: '/app/neural-reset/journal',
          duration: '3분',
        },
        {
          activityType: 'meditation',
          title: '명상음악',
          description: '편안한 음악으로 마무리해 보세요',
          route: '/app/neural-reset/music',
          duration: '10분',
        },
        {
          activityType: 'breathing',
          title: '박스 호흡',
          description: '집중력을 높이는 균형 호흡',
          route: '/app/neural-reset/breathing?pattern=box',
          duration: '3분',
        }
      )
      break
  }

  // 최근 이미 한 활동은 우선순위 낮춤
  return all
    .sort((a, b) => {
      const aRecent = recentActivities.includes(a.activityType) ? 1 : 0
      const bRecent = recentActivities.includes(b.activityType) ? 1 : 0
      return aRecent - bRecent
    })
    .slice(0, 3)
}

/**
 * severity에 따른 한국어 라벨
 */
export function getCheckinSeverityLabel(severity: CheckinSeverity): string {
  switch (severity) {
    case 'good':
      return '양호'
    case 'normal':
      return '보통'
    case 'caution':
      return '주의'
    case 'crisis':
      return '위기'
  }
}

/**
 * severity에 따른 색상 클래스
 */
export function getCheckinSeverityColor(severity: CheckinSeverity): string {
  switch (severity) {
    case 'good':
      return 'text-emerald-600 bg-emerald-50'
    case 'normal':
      return 'text-blue-600 bg-blue-50'
    case 'caution':
      return 'text-amber-600 bg-amber-50'
    case 'crisis':
      return 'text-red-600 bg-red-50'
  }
}
