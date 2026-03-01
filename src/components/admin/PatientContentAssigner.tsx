'use client'

import { useState } from 'react'
import { BookOpen, FileText, Youtube, Check, Plus, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useEducationalContents } from '@/hooks/useEducationalContents'
import { useContentAssignments } from '@/hooks/useContentAssignments'

interface PatientContentAssignerProps {
  patientId: string
}

export default function PatientContentAssigner({
  patientId,
}: PatientContentAssignerProps) {
  const { contents, isLoading: contentsLoading } = useEducationalContents()
  const {
    assignments,
    isLoading: assignmentsLoading,
    assignContent,
    removeAssignment,
    refetch,
  } = useContentAssignments(patientId)
  const [submitting, setSubmitting] = useState<string | null>(null)

  const isLoading = contentsLoading || assignmentsLoading

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  // 배정 상태 매핑
  const assignmentMap = new Map(
    assignments.map((a) => [a.content_id, a])
  )

  function getIcon(category: string) {
    if (category === '유튜브') return <Youtube className="h-4 w-4 text-destructive" />
    if (category === 'PDF') return <FileText className="h-4 w-4 text-orange-600" />
    return <BookOpen className="h-4 w-4 text-primary" />
  }

  async function handleAssign(contentId: string) {
    setSubmitting(contentId)
    try {
      await assignContent(patientId, contentId, null)
      await refetch()
    } catch {
      // ignore
    }
    setSubmitting(null)
  }

  async function handleRemove(assignmentId: string, contentId: string) {
    setSubmitting(contentId)
    try {
      await removeAssignment(assignmentId)
    } catch {
      // ignore
    }
    setSubmitting(null)
  }

  return (
    <div className="space-y-2">
      {contents.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          등록된 콘텐츠가 없습니다.
        </p>
      )}
      {contents.map((content) => {
        const assignment = assignmentMap.get(content.id)
        const isAssigned = !!assignment
        const isRead = !!assignment?.read_at

        return (
          <Card key={content.id}>
            <CardContent className="p-3 flex items-center gap-3">
              {getIcon(content.category)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {content.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[10px] py-0">
                    {content.category}
                  </Badge>
                  {isAssigned && (
                    <Badge
                      variant={isRead ? 'secondary' : 'default'}
                      className="text-[10px] py-0"
                    >
                      {isRead ? '읽음' : '미읽음'}
                    </Badge>
                  )}
                </div>
              </div>
              {isAssigned ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  disabled={submitting === content.id}
                  onClick={() => handleRemove(assignment!.id, content.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  해제
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={submitting === content.id}
                  onClick={() => handleAssign(content.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  배정
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
