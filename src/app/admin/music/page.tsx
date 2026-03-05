import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import MusicTrackManager from '@/components/admin/MusicTrackManager'
import type { MusicTrack } from '@/types'

export const metadata: Metadata = {
  title: '음악 관리 — 관리자',
}

export default async function AdminMusicPage() {
  const service = await createServiceClient()

  const { data: tracks } = await service
    .from('music_tracks')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">음악 관리</h1>
        <p className="text-zinc-600 mt-1 text-sm">
          명상음악 트랙을 추가하고 관리합니다.
        </p>
      </div>

      <MusicTrackManager initialTracks={(tracks ?? []) as MusicTrack[]} />
    </div>
  )
}
