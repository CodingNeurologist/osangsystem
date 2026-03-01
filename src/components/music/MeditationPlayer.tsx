'use client'

import { useState } from 'react'
import { Music } from 'lucide-react'
import type { MusicTrack } from '@/types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import BinauralPlayer from './BinauralPlayer'
import YouTubePlayer from './YouTubePlayer'

interface MeditationPlayerProps {
  youtubeTracks: MusicTrack[]
}

export default function MeditationPlayer({ youtubeTracks }: MeditationPlayerProps) {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(
    youtubeTracks[0] ?? null
  )

  return (
    <div className="space-y-4">
      <Tabs defaultValue="binaural" className="w-full">
        {/* 탭 */}
        <TabsList className="w-full">
          <TabsTrigger value="binaural" className="flex-1">
            바이노럴 비트
          </TabsTrigger>
          <TabsTrigger value="youtube" className="flex-1">
            YouTube 명상음악
          </TabsTrigger>
        </TabsList>

        {/* 바이노럴 비트 탭 */}
        <TabsContent value="binaural">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-zinc-800">
                바이노럴 비트 명상
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BinauralPlayer />
            </CardContent>
          </Card>
        </TabsContent>

        {/* YouTube 탭 */}
        <TabsContent value="youtube">
          <div className="space-y-4">
            {youtubeTracks.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent className="pt-6">
                  <Music className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
                  <p className="text-zinc-500 text-sm">
                    등록된 YouTube 음악이 없습니다.
                  </p>
                  <p className="text-zinc-400 text-xs mt-2">
                    관리자가 음악 트랙을 추가하면 이곳에 표시됩니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* 트랙 목록 */}
                <div className="space-y-2">
                  {youtubeTracks.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setSelectedTrack(track)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors ${
                        selectedTrack?.id === track.id
                          ? 'border-primary bg-primary/5'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <p className="font-medium text-zinc-800 text-sm">{track.title}</p>
                      {track.description && (
                        <p className="text-xs text-zinc-500 mt-0.5">{track.description}</p>
                      )}
                    </button>
                  ))}
                </div>

                {/* 선택된 트랙 재생 */}
                {selectedTrack?.source_url && (
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-0 border-b border-zinc-100">
                      <CardTitle className="text-sm text-zinc-800">
                        {selectedTrack.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <YouTubePlayer
                        url={selectedTrack.source_url}
                        title={selectedTrack.title}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
