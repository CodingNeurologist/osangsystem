'use client'

import { Play, ExternalLink } from 'lucide-react'

interface YouTubeVideo {
  id: string
  title: string
  videoId: string
}

// 오상신경외과 유튜브 채널 인기 영상 10선
// videoId는 YouTube URL에서 v= 뒤의 값입니다.
// 실제 영상 ID로 교체해 주세요.
const RECOMMENDED_VIDEOS: YouTubeVideo[] = [
  {
    id: '1',
    title: '자율신경실조증, 이것만 알면 됩니다',
    videoId: 'PLACEHOLDER_1',
  },
  {
    id: '2',
    title: '어지럼증의 원인과 치료법',
    videoId: 'PLACEHOLDER_2',
  },
  {
    id: '3',
    title: '두통이 반복된다면 꼭 보세요',
    videoId: 'PLACEHOLDER_3',
  },
  {
    id: '4',
    title: '손발 저림, 방치하면 안되는 이유',
    videoId: 'PLACEHOLDER_4',
  },
  {
    id: '5',
    title: '불면증 해결을 위한 자율신경 치료',
    videoId: 'PLACEHOLDER_5',
  },
  {
    id: '6',
    title: '심장이 두근거리는 이유 - 자율신경과의 관계',
    videoId: 'PLACEHOLDER_6',
  },
  {
    id: '7',
    title: '만성피로, 자율신경이 원인일 수 있습니다',
    videoId: 'PLACEHOLDER_7',
  },
  {
    id: '8',
    title: '스트레스와 자율신경의 관계',
    videoId: 'PLACEHOLDER_8',
  },
  {
    id: '9',
    title: '소화불량이 계속된다면 - 자율신경 점검',
    videoId: 'PLACEHOLDER_9',
  },
  {
    id: '10',
    title: '자율신경 치료 후기 및 경과',
    videoId: 'PLACEHOLDER_10',
  },
]

function getYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

export default function YouTubeRecommendations() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50">
          <Play className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            오상신경외과 추천 영상
          </h3>
          <p className="text-xs text-zinc-500">유튜브에서 바로 시청하세요</p>
        </div>
      </div>

      <div className="space-y-2">
        {RECOMMENDED_VIDEOS.map((video, index) => (
          <a
            key={video.id}
            href={getYouTubeUrl(video.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 bg-white hover:shadow-sm hover:border-zinc-200 transition-all group"
          >
            {/* 썸네일 */}
            <div className="relative flex-shrink-0 w-24 h-[54px] rounded-lg overflow-hidden bg-zinc-100">
              {video.videoId.startsWith('PLACEHOLDER') ? (
                <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                  <Play className="h-5 w-5 text-zinc-400" />
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getThumbnailUrl(video.videoId)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-5 w-5 text-white" fill="white" />
                  </div>
                </>
              )}
            </div>

            {/* 제목 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-800 leading-snug line-clamp-2 group-hover:text-zinc-900">
                <span className="text-xs text-zinc-400 mr-1.5">{index + 1}.</span>
                {video.title}
              </p>
            </div>

            {/* 외부 링크 아이콘 */}
            <ExternalLink className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500 flex-shrink-0 transition-colors" />
          </a>
        ))}
      </div>

      <p className="text-xs text-zinc-400 text-center pt-1">
        영상을 탭하면 유튜브 앱에서 재생됩니다
      </p>
    </div>
  )
}
