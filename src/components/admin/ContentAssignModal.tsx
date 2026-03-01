'use client'

import { useState, useEffect } from 'react'
import { Search, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { useContentAssignments } from '@/hooks/useContentAssignments'

interface Patient {
  id: string
  user_id: string
  profiles: {
    email: string
  } | null
}

interface ContentAssignModalProps {
  contentId: string
  onClose: () => void
}

export default function ContentAssignModal({
  contentId,
  onClose,
}: ContentAssignModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [existingPatientIds, setExistingPatientIds] = useState<Set<string>>(
    new Set()
  )

  const { assignContent } = useContentAssignments()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // 환자 목록 조회
      const { data: patientData } = await supabase
        .from('patients')
        .select('id, user_id, profiles:user_id(email)')
        .order('created_at', { ascending: false })

      // 이미 배정된 환자 조회
      const { data: existingData } = await supabase
        .from('content_assignments')
        .select('patient_id')
        .eq('content_id', contentId)

      if (patientData) setPatients(patientData as unknown as Patient[])
      if (existingData) {
        setExistingPatientIds(
          new Set(existingData.map((d) => d.patient_id))
        )
      }
      setLoading(false)
    }
    load()
  }, [contentId])

  const filtered = patients.filter((p) => {
    if (!search) return true
    const email = p.profiles?.email ?? ''
    return email.toLowerCase().includes(search.toLowerCase())
  })

  const toggleAll = () => {
    const assignable = filtered.filter(
      (p) => !existingPatientIds.has(p.id)
    )
    if (selected.size === assignable.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(assignable.map((p) => p.id)))
    }
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  async function handleAssign() {
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    for (const patientId of selected) {
      try {
        await assignContent(patientId, contentId, user?.id ?? null)
      } catch {
        // 중복 등 무시
      }
    }
    setSubmitting(false)
    onClose()
  }

  // 마스킹된 이메일
  function maskEmail(email: string) {
    const [local, domain] = email.split('@')
    if (!local || !domain) return email
    const masked =
      local.length <= 3
        ? local[0] + '***'
        : local.slice(0, 3) + '***'
    return `${masked}@${domain}`
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>환자에게 배정</DialogTitle>
          <DialogDescription>
            콘텐츠를 배정할 환자를 선택하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이메일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto max-h-[40vh] space-y-1">
            {/* 전체 선택 */}
            <button
              type="button"
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted text-sm"
              onClick={toggleAll}
            >
              <Checkbox
                checked={
                  selected.size > 0 &&
                  selected.size ===
                    filtered.filter((p) => !existingPatientIds.has(p.id)).length
                }
              />
              <span className="font-medium">전체 선택</span>
            </button>

            {filtered.map((p) => {
              const alreadyAssigned = existingPatientIds.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`w-full flex items-center gap-3 p-2 rounded-md text-sm ${
                    alreadyAssigned
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-muted cursor-pointer'
                  }`}
                  onClick={() => !alreadyAssigned && toggle(p.id)}
                  disabled={alreadyAssigned}
                >
                  <Checkbox
                    checked={selected.has(p.id) || alreadyAssigned}
                    disabled={alreadyAssigned}
                  />
                  <span className="flex-1 text-left">
                    {maskEmail(p.profiles?.email ?? '(이메일 없음)')}
                  </span>
                  {alreadyAssigned && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      배정됨
                    </span>
                  )}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                환자가 없습니다.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selected.size === 0 || submitting}
          >
            {submitting
              ? '배정 중...'
              : `${selected.size}명에게 배정`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
