'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { JournalEntry, JournalPromptCategory } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Trash2, RefreshCw } from 'lucide-react'
import { JOURNAL_PROMPT_CATEGORIES, getRandomPrompt, getPromptsByCategory } from '@/data/journal-prompts'

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: '매우 나쁨' },
  { value: 2, emoji: '😔', label: '나쁨' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 4, emoji: '🙂', label: '좋음' },
  { value: 5, emoji: '😊', label: '매우 좋음' },
]

interface JournalEditorProps {
  entries: JournalEntry[]
}

export default function JournalEditor({ entries: initialEntries }: JournalEditorProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<JournalPromptCategory | null>(null)
  const [prompt, setPrompt] = useState(getRandomPrompt())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function refreshPrompt() {
    setPrompt(getRandomPrompt(selectedCategory ?? undefined))
  }

  function handleCategorySelect(category: JournalPromptCategory) {
    if (selectedCategory === category) {
      setSelectedCategory(null)
      setPrompt(getRandomPrompt())
    } else {
      setSelectedCategory(category)
      const prompts = getPromptsByCategory(category)
      setPrompt(prompts[Math.floor(Math.random() * prompts.length)])
    }
  }

  async function handleSave() {
    if (!content.trim()) return
    setIsSaving(true)
    setSaveError(null)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        content: content.trim(),
        mood,
        prompt_category: prompt.category,
        prompt_text: prompt.text,
      })
      .select()
      .single()

    if (error) {
      setSaveError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } else if (data) {
      setEntries([data as JournalEntry, ...entries])
      setContent('')
      setMood(null)
      refreshPrompt()

      // 세션 기록 (실패해도 무시)
      try {
        await fetch('/api/neural-reset/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_type: 'journal',
            activity_detail: { mood, prompt_category: prompt.category },
            completed: true,
          }),
        })
      } catch {
        // 무시
      }
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
      {/* 무드 선택 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-zinc-700">지금 기분은 어떤가요?</p>
        <div className="flex gap-2">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setMood(mood === option.value ? null : option.value)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                mood === option.value
                  ? 'bg-zinc-900 scale-105'
                  : 'bg-zinc-50 hover:bg-zinc-100'
              }`}
              aria-label={option.label}
            >
              <span className="text-xl">{option.emoji}</span>
              <span className={`text-[10px] ${mood === option.value ? 'text-zinc-300' : 'text-zinc-400'}`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.entries(JOURNAL_PROMPT_CATEGORIES) as [JournalPromptCategory, string][]).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => handleCategorySelect(key)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                selectedCategory === key
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* 새 일기 작성 */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500 italic flex-1">{prompt.text}</p>
            <button
              onClick={refreshPrompt}
              className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
              aria-label="다른 질문 보기"
            >
              <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
            </button>
          </div>
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
                    <div className="flex items-center gap-2 mb-1.5">
                      {entry.mood && (
                        <span className="text-base">
                          {MOOD_OPTIONS.find((m) => m.value === entry.mood)?.emoji}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400">
                        {new Date(entry.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
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
