import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JournalEditor from '@/components/journal/JournalEditor'
import type { JournalEntry } from '@/types'

export const metadata: Metadata = {
  title: '감사일기 | 오상케어',
  description: '오늘 감사한 일을 기록해 보세요',
}

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, content, mood, prompt_category, prompt_text, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="px-4 py-6 max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">감사일기</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          오늘 감사한 일을 기록해 보세요. 작은 것도 괜찮습니다.
        </p>
      </div>
      <JournalEditor entries={(entries as JournalEntry[]) ?? []} />
    </div>
  )
}
