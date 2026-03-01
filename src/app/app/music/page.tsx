import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import MeditationPlayer from '@/components/music/MeditationPlayer'
import type { MusicTrack } from '@/types'

export const metadata: Metadata = {
  title: '명상음악',
}

export default async function MusicPage() {
  const supabase = await createClient()

  const { data: tracks } = await supabase
    .from('music_tracks')
    .select('*')
    .eq('source_type', 'youtube')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const youtubeTracks = (tracks ?? []) as MusicTrack[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">명상음악</h1>
        <p className="text-zinc-600 mt-1 text-sm">
          음악과 바이노럴 비트로 마음을 가다듬어 보세요.
        </p>
      </div>

      <MeditationPlayer youtubeTracks={youtubeTracks} />
    </div>
  )
}
