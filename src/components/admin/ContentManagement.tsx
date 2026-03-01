'use client'

import { useState } from 'react'
import {
  BookOpen,
  FileText,
  Youtube,
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Upload,
  Link as LinkIcon,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useEducationalContents } from '@/hooks/useEducationalContents'
import { createClient } from '@/lib/supabase/client'
import type { EducationalContent } from '@/types'
import ContentAssignModal from './ContentAssignModal'

const CATEGORIES = ['식단', '운동', '수면', '정신건강', '통증관리']

const categoryColors: Record<string, string> = {
  '식단': 'bg-emerald-500/10 text-emerald-600',
  '운동': 'bg-blue-500/10 text-blue-600',
  '수면': 'bg-indigo-500/10 text-indigo-600',
  '정신건강': 'bg-purple-500/10 text-purple-600',
  '통증관리': 'bg-rose-500/10 text-rose-600',
  'PDF': 'bg-orange-500/10 text-orange-600',
  '유튜브': 'bg-red-500/10 text-red-600',
}

type FormMode = 'markdown' | 'youtube' | 'pdf' | null

interface ContentForm {
  title: string
  category: string
  summary: string
  body: string
  tags: string
  visibility: 'public' | 'assigned'
  youtubeUrl: string
  file: File | null
}

const EMPTY_FORM: ContentForm = {
  title: '',
  category: '',
  summary: '',
  body: '',
  tags: '',
  visibility: 'assigned',
  youtubeUrl: '',
  file: null,
}

export default function ContentManagement() {
  const { contents, isLoading, addContent, updateContent, deleteContent } =
    useEducationalContents()
  const [search, setSearch] = useState('')
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [form, setForm] = useState<ContentForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [assignContentId, setAssignContentId] = useState<string | null>(null)
  const [ytLoading, setYtLoading] = useState(false)

  // 검색 필터
  const filtered = contents.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  function openCreateForm(mode: FormMode) {
    setFormMode(mode)
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      category: mode === 'youtube' ? '유튜브' : mode === 'pdf' ? 'PDF' : '',
      visibility: mode === 'youtube' ? 'public' : 'assigned',
    })
    setError(null)
  }

  function openEditForm(content: EducationalContent) {
    const isPdf = content.category === 'PDF'
    const isYoutube = content.category === '유튜브'
    setFormMode(isYoutube ? 'youtube' : isPdf ? 'pdf' : 'markdown')
    setEditingId(content.id)
    setForm({
      title: content.title,
      category: content.category,
      summary: content.summary,
      body: content.body,
      tags: content.tags.join(', '),
      visibility: content.visibility,
      youtubeUrl: isYoutube ? content.file_url ?? '' : '',
      file: null,
    })
    setError(null)
  }

  async function fetchYoutubeMetadata() {
    if (!form.youtubeUrl.trim()) return
    setYtLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/youtube-metadata`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ url: form.youtubeUrl }),
        }
      )
      const json = await res.json()
      if (json.success && json.data) {
        setForm((f) => ({
          ...f,
          title: json.data.title || f.title,
          body: json.data.duration || f.body,
          summary: json.data.author ? `채널: ${json.data.author}` : f.summary,
        }))
      }
    } catch {
      // 메타데이터 실패는 무시 — 수동 입력 가능
    }
    setYtLoading(false)
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError('제목을 입력하세요.')
      return
    }
    if (formMode === 'markdown' && !form.category) {
      setError('카테고리를 선택하세요.')
      return
    }
    if (formMode === 'youtube' && !form.youtubeUrl.trim()) {
      setError('YouTube URL을 입력하세요.')
      return
    }
    if (formMode === 'pdf' && !editingId && !form.file) {
      setError('PDF 파일을 선택하세요.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      let fileUrl: string | null = null

      // PDF 파일 업로드
      if (formMode === 'pdf' && form.file) {
        if (form.file.size > 20 * 1024 * 1024) {
          setError('파일 크기는 20MB 이하여야 합니다.')
          setSubmitting(false)
          return
        }
        const fileName = `${Date.now()}_${form.file.name}`
        const { error: uploadError } = await supabase.storage
          .from('educational-files')
          .upload(fileName, form.file)
        if (uploadError) throw uploadError
        fileUrl = fileName
      }

      const payload = {
        title: form.title.trim(),
        category:
          formMode === 'youtube'
            ? '유튜브'
            : formMode === 'pdf'
              ? 'PDF'
              : form.category,
        summary: form.summary.trim(),
        body: form.body.trim(),
        tags,
        file_url:
          formMode === 'youtube'
            ? form.youtubeUrl.trim()
            : formMode === 'pdf'
              ? fileUrl
              : null,
        visibility:
          formMode === 'youtube' ? ('public' as const) : form.visibility,
        created_by: user?.id ?? null,
      }

      if (editingId) {
        // PDF 수정 시 파일 미변경이면 file_url 유지
        if (formMode === 'pdf' && !form.file) {
          const { file_url: _skip, ...rest } = payload
          void _skip
          await updateContent(editingId, rest)
        } else {
          await updateContent(editingId, payload)
        }
      } else {
        await addContent(payload)
      }

      setFormMode(null)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!deleteDialogId) return
    try {
      await deleteContent(deleteDialogId)
    } catch {
      // ignore
    }
    setDeleteDialogId(null)
  }

  function getContentIcon(category: string) {
    if (category === '유튜브') return <Youtube className="h-4 w-4" />
    if (category === 'PDF') return <FileText className="h-4 w-4" />
    return <BookOpen className="h-4 w-4" />
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 검색 + 추가 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제목, 카테고리, 태그 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => openCreateForm('markdown')}>
            <Plus className="h-4 w-4 mr-1" />
            마크다운
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openCreateForm('pdf')}
          >
            <Upload className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openCreateForm('youtube')}
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            유튜브
          </Button>
        </div>
      </div>

      {/* 콘텐츠 목록 */}
      {filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground text-sm">
          {search ? '검색 결과가 없습니다.' : '등록된 콘텐츠가 없습니다.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((content) => {
            const isExpanded = expandedId === content.id
            return (
              <Card key={content.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getContentIcon(content.category)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {content.title}
                        </span>
                        <Badge
                          className={`text-[10px] ${categoryColors[content.category] ?? 'bg-zinc-100 text-zinc-600'}`}
                        >
                          {content.category}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {content.visibility === 'public'
                            ? '전체공개'
                            : '배정'}
                        </Badge>
                      </div>
                      {content.summary && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {content.summary}
                        </p>
                      )}
                      {content.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {content.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px] py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* 펼쳐진 본문 미리보기 */}
                      {isExpanded && content.body && (
                        <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground whitespace-pre-line max-h-40 overflow-auto">
                          {content.body}
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-1 shrink-0">
                      {content.body && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : content.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditForm(content)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAssignContentId(content.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialogId(content.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={formMode !== null} onOpenChange={() => setFormMode(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? '콘텐츠 수정' : '새 콘텐츠 추가'}
              {formMode === 'youtube' && ' (유튜브)'}
              {formMode === 'pdf' && ' (PDF)'}
            </DialogTitle>
            <DialogDescription>
              {formMode === 'youtube'
                ? 'YouTube 영상 URL을 입력하면 제목이 자동으로 불러와집니다.'
                : formMode === 'pdf'
                  ? 'PDF 파일을 업로드합니다. 최대 20MB.'
                  : '마크다운 형식으로 본문을 작성합니다.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 유튜브 URL */}
            {formMode === 'youtube' && (
              <div className="space-y-2">
                <Label>YouTube URL *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.youtubeUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, youtubeUrl: e.target.value }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchYoutubeMetadata}
                    disabled={ytLoading}
                  >
                    {ytLoading ? '...' : '불러오기'}
                  </Button>
                </div>
              </div>
            )}

            {/* PDF 파일 */}
            {formMode === 'pdf' && (
              <div className="space-y-2">
                <Label>PDF 파일 {!editingId && '*'}</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      file: e.target.files?.[0] ?? null,
                    }))
                  }
                />
              </div>
            )}

            {/* 제목 */}
            <div className="space-y-2">
              <Label>제목 *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>

            {/* 카테고리 (마크다운만) */}
            {formMode === 'markdown' && (
              <div className="space-y-2">
                <Label>카테고리 *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 요약 */}
            <div className="space-y-2">
              <Label>요약 설명</Label>
              <Input
                value={form.summary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, summary: e.target.value }))
                }
              />
            </div>

            {/* 태그 */}
            <div className="space-y-2">
              <Label>태그 (쉼표 구분)</Label>
              <Input
                placeholder="예: 자율신경, 스트레스, 수면"
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
              />
            </div>

            {/* 본문 (마크다운 모드) */}
            {formMode === 'markdown' && (
              <div className="space-y-2">
                <Label>본문 (마크다운)</Label>
                <Textarea
                  rows={10}
                  placeholder="마크다운 형식으로 작성하세요..."
                  value={form.body}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, body: e.target.value }))
                  }
                />
              </div>
            )}

            {/* 공개범위 (유튜브 제외) */}
            {formMode !== 'youtube' && (
              <div className="space-y-2">
                <Label>공개범위</Label>
                <Select
                  value={form.visibility}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      visibility: v as 'public' | 'assigned',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">배정</SelectItem>
                    <SelectItem value="public">전체공개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormMode(null)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? '저장 중...'
                : editingId
                  ? '수정'
                  : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogId !== null}
        onOpenChange={() => setDeleteDialogId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>콘텐츠 삭제</DialogTitle>
            <DialogDescription>
              이 콘텐츠를 삭제하시겠습니까? 배정된 환자의 목록에서도 더 이상
              표시되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogId(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 배정 모달 */}
      {assignContentId && (
        <ContentAssignModal
          contentId={assignContentId}
          onClose={() => setAssignContentId(null)}
        />
      )}
    </div>
  )
}
