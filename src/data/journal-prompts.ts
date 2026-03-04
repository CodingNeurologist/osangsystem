import type { JournalPrompt, JournalPromptCategory } from '@/types'

export const JOURNAL_PROMPT_CATEGORIES: Record<JournalPromptCategory, string> = {
  gratitude: '감사',
  achievement: '성취',
  relationship: '관계',
  nature: '자연',
  selfcare: '자기 돌봄',
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  // 감사
  { text: '오늘 가장 감사한 일은 무엇인가요?', category: 'gratitude' },
  { text: '당연하게 여겼지만 사실 감사한 것 한 가지는?', category: 'gratitude' },
  { text: '오늘 누군가에게 받은 작은 친절이 있었나요?', category: 'gratitude' },
  { text: '건강하게 하루를 보낸 것 중 감사한 부분은?', category: 'gratitude' },
  { text: '오늘 먹은 음식 중 맛있었던 것은 무엇인가요?', category: 'gratitude' },
  { text: '집이라는 공간에서 가장 편안한 순간은 언제인가요?', category: 'gratitude' },

  // 성취
  { text: '오늘 해낸 일 중 가장 뿌듯한 것은?', category: 'achievement' },
  { text: '작지만 꾸준히 노력하고 있는 것이 있다면?', category: 'achievement' },
  { text: '지난주보다 나아진 점이 있나요?', category: 'achievement' },
  { text: '오늘 용기를 낸 순간이 있었나요?', category: 'achievement' },
  { text: '최근 새롭게 배운 것이 있다면?', category: 'achievement' },
  { text: '어려웠지만 잘 넘긴 상황이 있었나요?', category: 'achievement' },

  // 관계
  { text: '오늘 나를 미소 짓게 한 사람은 누구인가요?', category: 'relationship' },
  { text: '고마운 마음을 전하고 싶은 사람이 있나요?', category: 'relationship' },
  { text: '누군가와 나눈 따뜻한 대화가 있었나요?', category: 'relationship' },
  { text: '내 곁에 있어줘서 고마운 사람은 누구인가요?', category: 'relationship' },
  { text: '오늘 누군가를 도와준 일이 있나요?', category: 'relationship' },
  { text: '함께 있으면 편안해지는 사람은 누구인가요?', category: 'relationship' },

  // 자연
  { text: '오늘 하늘을 올려다본 순간이 있었나요?', category: 'nature' },
  { text: '산책하며 느낀 계절의 변화가 있나요?', category: 'nature' },
  { text: '자연 속에서 편안함을 느낀 기억이 있나요?', category: 'nature' },
  { text: '오늘 들은 소리 중 가장 좋았던 것은?', category: 'nature' },
  { text: '창밖 풍경에서 발견한 작은 아름다움은?', category: 'nature' },
  { text: '바람, 햇살, 비 등 날씨에서 느낀 감각이 있나요?', category: 'nature' },

  // 자기 돌봄
  { text: '오늘 나를 위해 한 일이 있나요?', category: 'selfcare' },
  { text: '몸이 보내는 신호에 귀 기울인 순간이 있었나요?', category: 'selfcare' },
  { text: '마음이 편안했던 시간은 언제인가요?', category: 'selfcare' },
  { text: '충분히 쉬었다고 느낀 순간이 있나요?', category: 'selfcare' },
  { text: '나에게 해주고 싶은 따뜻한 한마디는?', category: 'selfcare' },
  { text: '오늘 나의 몸 상태는 어떤가요? 어떤 돌봄이 필요할까요?', category: 'selfcare' },
]

export function getRandomPrompt(category?: JournalPromptCategory): JournalPrompt {
  const filtered = category
    ? JOURNAL_PROMPTS.filter((p) => p.category === category)
    : JOURNAL_PROMPTS
  return filtered[Math.floor(Math.random() * filtered.length)]
}

export function getPromptsByCategory(category: JournalPromptCategory): JournalPrompt[] {
  return JOURNAL_PROMPTS.filter((p) => p.category === category)
}
