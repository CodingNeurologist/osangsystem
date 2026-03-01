'use client'

import { useState } from 'react'
import type { MusicTrack, MusicSourceType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Trash2 } from 'lucide-react'

interface MusicTrackManagerProps {
  initialTracks: MusicTrack[]
}

interface TrackForm {
  title: string
  description: string
  source_type: MusicSourceType
  source_url: string
  category: string
  sort_order: number
}

const EMPTY_FORM: TrackForm = {
  title: '',
  description: '',
  source_type: 'youtube',
  source_url: '',
  category: 'meditation',
  sort_order: 0,
}

export default function MusicTrackManager({ initialTracks }: MusicTrackManagerProps) {
  const [tracks, setTracks] = useState<MusicTrack[]>(initialTracks)
  const [form, setForm] = useState<TrackForm>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleFormChange(field: keyof TrackForm, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleCreate() {
    if (!form.title.trim()) {
      setError('제목을 입력하세요.')
      return
    }
    if (form.source_type === 'youtube' && !form.source_url.trim()) {
      setError('YouTube URL을 입력하세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const res = await fetch('/api/admin/music', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || null,
        source_type: form.source_type,
        source_url: form.source_type === 'youtube' ? form.source_url.trim() : null,
        category: form.category,
        sort_order: Number(form.sort_order),
      }),
    })

    if (res.ok) {
      const created = await res.json() as MusicTrack
      setTracks((prev) => [created, ...prev])
      setForm(EMPTY_FORM)
    } else {
      const data = await res.json()
      setError(data.error ?? '생성에 실패했습니다.')
    }

    setIsSubmitting(false)
  }

  async function handleToggleActive(track: MusicTrack) {
    setTogglingId(track.id)

    const res = await fetch('/api/admin/music', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: track.id, is_active: !track.is_active }),
    })

    if (res.ok) {
      const updated = await res.json() as MusicTrack
      setTracks((prev) => prev.map((t) => (t.id === track.id ? updated : t)))
    }

    setTogglingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('이 트랙을 삭제하시겠습니까?')) return

    setDeletingId(id)

    const res = await fetch(`/api/admin/music?id=${id}`, { method: 'DELETE' })

    if (res.ok) {
      setTracks((prev) => prev.filter((t) => t.id !== id))
    }

    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {/* 새 트랙 추가 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-zinc-800">새 트랙 추가</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="track-title">제목 *</Label>
              <Input
                id="track-title"
                type="text"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="트랙 제목"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="track-desc">설명</Label>
              <Input
                id="track-desc"
                type="text"
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="트랙 설명 (선택)"
                maxLength={300}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="track-type">유형 *</Label>
              <Select
                value={form.source_type}
                onValueChange={(value) => handleFormChange('source_type', value as MusicSourceType)}
              >
                <SelectTrigger id="track-type">
                  <SelectValue placeholder="소스 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.source_type === 'youtube' && (
              <div className="space-y-1.5">
                <Label htmlFor="track-url">YouTube URL *</Label>
                <Input
                  id="track-url"
                  type="url"
                  value={form.source_url}
                  onChange={(e) => handleFormChange('source_url', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="track-category">카테고리</Label>
                <Input
                  id="track-category"
                  type="text"
                  value={form.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  placeholder="meditation"
                  maxLength={50}
                />
              </div>
              <div className="w-24 space-y-1.5">
                <Label htmlFor="track-order">정렬 순서</Label>
                <Input
                  id="track-order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => handleFormChange('sort_order', Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? '추가 중...' : '트랙 추가'}
          </Button>
        </CardContent>
      </Card>

      {/* 트랙 목록 */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-zinc-800">트랙 목록 ({tracks.length})</CardTitle>
        </CardHeader>

        {tracks.length === 0 ? (
          <CardContent>
            <p className="text-center text-sm text-zinc-400 py-8">등록된 트랙이 없습니다.</p>
          </CardContent>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {tracks.map((track) => (
              <li key={track.id} className="px-6 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-800 text-sm truncate">{track.title}</p>
                    <Badge
                      variant={track.is_active ? 'default' : 'secondary'}
                      className={
                        track.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-100'
                      }
                    >
                      {track.is_active ? '활성' : '비활성'}
                    </Badge>
                  </div>
                  {track.description && (
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{track.description}</p>
                  )}
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {track.source_type.toUpperCase()}
                    {track.source_url && ` · ${track.source_url.slice(0, 40)}...`}
                    {' · 순서 '}{track.sort_order}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`toggle-${track.id}`} className="text-xs text-zinc-500 sr-only">
                      {track.is_active ? '비활성화' : '활성화'}
                    </Label>
                    <Switch
                      id={`toggle-${track.id}`}
                      checked={track.is_active}
                      onCheckedChange={() => handleToggleActive(track)}
                      disabled={togglingId === track.id}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(track.id)}
                    disabled={deletingId === track.id}
                    className="text-red-400 hover:text-red-600 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">삭제</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
