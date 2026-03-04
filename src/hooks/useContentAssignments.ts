'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  EducationalContent,
  ContentAssignment,
  AssignedContentWithDetails,
} from '@/types'

export function useContentAssignments(patientId?: string) {
  const [assignments, setAssignments] = useState<AssignedContentWithDetails[]>([])
  const [publicContents, setPublicContents] = useState<EducationalContent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true)

    // 1. 현재 환자 ID 결정
    let pid = patientId
    if (!pid) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsLoading(false); return }

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      // patients 테이블이 아직 없는 경우 조용히 종료
      if (patientError || !patient) { setIsLoading(false); return }
      pid = patient.id
    }

    // 2. 배정된 콘텐츠 조회
    const { data: assignData } = await supabase
      .from('content_assignments')
      .select('*')
      .eq('patient_id', pid)
      .order('assigned_at', { ascending: false })

    const assignList = (assignData ?? []) as ContentAssignment[]

    // 3. 배정된 콘텐츠 상세 조회
    let merged: AssignedContentWithDetails[] = []
    if (assignList.length > 0) {
      const contentIds = assignList.map((a) => a.content_id)
      const { data: contentData } = await supabase
        .from('educational_contents')
        .select('*')
        .in('id', contentIds)

      const contentMap = new Map(
        ((contentData ?? []) as EducationalContent[]).map((c) => [c.id, c])
      )

      merged = assignList
        .filter((a) => contentMap.has(a.content_id))
        .map((a) => ({
          ...a,
          content: contentMap.get(a.content_id)!,
        }))
    }

    // 4. 전체공개 콘텐츠 조회
    const { data: publicData } = await supabase
      .from('educational_contents')
      .select('*')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })

    setAssignments(merged)
    setPublicContents((publicData ?? []) as EducationalContent[])
    setIsLoading(false)
  }, [patientId])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  async function assignContent(
    targetPatientId: string,
    contentId: string,
    assignedBy: string | null
  ) {
    const { data, error } = await supabase
      .from('content_assignments')
      .insert({
        patient_id: targetPatientId,
        content_id: contentId,
        assigned_by: assignedBy,
      })
      .select()
      .single()

    if (error) throw error
    return data as ContentAssignment
  }

  async function markAsRead(assignmentId: string) {
    const { error } = await supabase
      .from('content_assignments')
      .update({ read_at: new Date().toISOString() })
      .eq('id', assignmentId)

    if (error) throw error
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId ? { ...a, read_at: new Date().toISOString() } : a
      )
    )
  }

  async function removeAssignment(assignmentId: string) {
    const { error } = await supabase
      .from('content_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
  }

  return {
    assignments,
    publicContents,
    isLoading,
    assignContent,
    markAsRead,
    removeAssignment,
    refetch: fetchAssignments,
  }
}
