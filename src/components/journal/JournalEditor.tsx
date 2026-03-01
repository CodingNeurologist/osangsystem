'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { JournalEntry } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

const JOURNAL_PROMPTS = [
  '오늘 가장 감사한 일은 무엇인가요?',
  '오늘 나를 미소 짓게 한 작은 순간은?',
  '오늘 나를 도와준 사람이 있었나요?',
  '내가 당연하게 여기지만 사실은 감사한 것은?',
  '오늘 잘 해낸 일이 있나요?',
]

interface JournalEditorProps {
  entries: JournalEntry[]
}

export default function JournalEditor({ entries: initialEntries }: JournalEditorProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [content, setContent] = useState('')
  const [prompt] = useState(
    JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave() {
    if (!content.trim()) return
    setIsSaving(true)
    setSaveError(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ content: content.trim() })
      .select()
      .single()

    if (error) {
      setSaveError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } else if (data) {
      setEntries([data as JournalEntry, ...entries])
      setContent('')
    }

    setIsSaving(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)

    if (!error) {
      setEntries(entries.filter((e) => e.id !== id))
    }
  }

  return (
    <div className="space-y-5">
      {/* 새 일기 작성 */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="text-sm text-zinc-500 italic">{prompt}</p>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘의 감사한 일을 자유롭게 적어보세요..."
            className="min-h-[120px] resize-none text-sm leading-relaxed"
            maxLength={2000}
            aria-label="감사일기 내용"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">{content.length} / 2000</span>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!content.trim() || isSaving}
              size="sm"
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
          {saveError && (
            <p className="text-xs text-destructive" role="alert">{saveError}</p>
          )}
        </CardContent>
      </Card>

      {/* 이전 일기 목록 */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-zinc-700 text-sm">이전 기록</h3>
          {entries.map((entry) => (
            <Card key={entry.id} className="bg-zinc-50 border-zinc-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-400 mb-1.5">
                      {new Date(entry.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
                      {entry.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(entry.id)}
                    className="text-zinc-300 hover:text-destructive flex-shrink-0"
                    aria-label="일기 삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <p className="text-center text-zinc-400 text-sm py-6">
          아직 작성한 일기가 없습니다.
        </p>
      )}
    </div>
  )
}
