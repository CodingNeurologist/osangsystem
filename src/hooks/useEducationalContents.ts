'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EducationalContent } from '@/types'

export function useEducationalContents() {
  const [contents, setContents] = useState<EducationalContent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const fetchContents = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('educational_contents')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setContents(data as EducationalContent[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  async function addContent(
    payload: Omit<EducationalContent, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('educational_contents')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    setContents((prev) => [data as EducationalContent, ...prev])
    return data as EducationalContent
  }

  async function updateContent(
    id: string,
    updates: Partial<EducationalContent>
  ) {
    const { data, error } = await supabase
      .from('educational_contents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setContents((prev) =>
      prev.map((c) => (c.id === id ? (data as EducationalContent) : c))
    )
    return data as EducationalContent
  }

  async function deleteContent(id: string) {
    const { error } = await supabase
      .from('educational_contents')
      .delete()
      .eq('id', id)

    if (error) throw error
    setContents((prev) => prev.filter((c) => c.id !== id))
  }

  return {
    contents,
    isLoading,
    addContent,
    updateContent,
    deleteContent,
    refetch: fetchContents,
  }
}
