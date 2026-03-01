'use client'

import { useState } from 'react'
import {
  BookOpen,
  FileText,
  Youtube,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useContentAssignments } from '@/hooks/useContentAssignments'
import type { EducationalContent, AssignedContentWithDetails } from '@/types'
import ContentDetail from './ContentDetail'

export default function PatientContentList() {
  const { assignments, publicContents, isLoading, markAsRead } =
    useContentAssignments()
  const [selectedContent, setSelectedContent] = useState<{
    content: EducationalContent
    assignmentId?: string
  } | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  // 중복 제거: 배정된 콘텐츠는 전체공개 섹션에서 제외
  const assignedContentIds = new Set(assignments.map((a) => a.content_id))
  const filteredPublic = publicContents.filter(
    (c) => !assignedContentIds.has(c.id)
  )

  const unread = assignments.filter((a) => !a.read_at)
  const read = assignments.filter((a) => a.read_at)

  async function handleOpen(
    content: EducationalContent,
    assignmentId?: string
  ) {
    // 유튜브: 새 탭 열기
    if (content.category === '유튜브' && content.file_url) {
      const a = document.createElement('a')
      a.href = content.file_url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      if (assignmentId) {
        await markAsRead(assignmentId)
      }
      return
    }

    // 마크다운/PDF: 상세 뷰
    setSelectedContent({ content, assignmentId })
    if (assignmentId) {
      await markAsRead(assignmentId)
    }
  }

  if (selectedContent) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedContent(null)}
          className="mb-4 gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        <ContentDetail content={selectedContent.content} />
      </div>
    )
  }

  const isEmpty =
    filteredPublic.length === 0 && unread.length === 0 && read.length === 0

  if (isEmpty) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        아직 배정된 건강 자료가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 새로운 자료 */}
      {unread.length > 0 && (
        <Section title={`새로운 자료 (${unread.length})`}>
          {unread.map((a) => (
            <AssignedCard
              key={a.id}
              item={a}
              isNew
              onOpen={() => handleOpen(a.content, a.id)}
            />
          ))}
        </Section>
      )}

      {/* 전체 공개 자료 */}
      {filteredPublic.length > 0 && (
        <Section title={`전체 공개 자료 (${filteredPublic.length})`}>
          {filteredPublic.map((c) => (
            <ContentCard key={c.id} content={c} onOpen={() => handleOpen(c)} />
          ))}
        </Section>
      )}

      {/* 읽은 자료 */}
      {read.length > 0 && (
        <Section title={`읽은 자료 (${read.length})`}>
          {read.map((a) => (
            <AssignedCard
              key={a.id}
              item={a}
              isNew={false}
              onOpen={() => handleOpen(a.content, a.id)}
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function getIcon(category: string) {
  if (category === '유튜브') return <Youtube className="h-5 w-5 text-destructive" />
  if (category === 'PDF') return <FileText className="h-5 w-5 text-orange-600" />
  return <BookOpen className="h-5 w-5 text-primary" />
}

function ContentCard({
  content,
  onOpen,
}: {
  content: EducationalContent
  onOpen: () => void
}) {
  const isYoutube = content.category === '유튜브'

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onOpen}
    >
      <CardContent className="p-4 flex items-center gap-3">
        {getIcon(content.category)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {content.title}
          </p>
          {content.summary && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {content.summary}
            </p>
          )}
        </div>
        {isYoutube ? (
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </CardContent>
    </Card>
  )
}

function AssignedCard({
  item,
  isNew,
  onOpen,
}: {
  item: AssignedContentWithDetails
  isNew: boolean
  onOpen: () => void
}) {
  const isYoutube = item.content.category === '유튜브'

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isNew ? 'border-primary/30 bg-primary/5' : ''
      }`}
      onClick={onOpen}
    >
      <CardContent className="p-4 flex items-center gap-3">
        {getIcon(item.content.category)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {item.content.title}
            </p>
            {isNew && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">
                NEW
              </Badge>
            )}
          </div>
          {item.content.summary && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {item.content.summary}
            </p>
          )}
        </div>
        {isYoutube ? (
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </CardContent>
    </Card>
  )
}
