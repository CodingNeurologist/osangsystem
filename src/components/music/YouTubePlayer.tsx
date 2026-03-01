'use client'

interface YouTubePlayerProps {
  url: string
  title: string
}

/**
 * YouTube URL을 embed URL로 변환
 * 지원 형식:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *   - https://www.youtube.com/playlist?list=PLAYLIST_ID
 */
function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)

    // 이미 embed URL인 경우
    if (parsed.pathname.startsWith('/embed/')) {
      return url
    }

    // youtu.be 단축 URL
    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.slice(1)
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
    }

    // 플레이리스트
    const listId = parsed.searchParams.get('list')
    if (listId && !parsed.searchParams.get('v')) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${listId}&rel=0`
    }

    // 일반 영상
    const videoId = parsed.searchParams.get('v')
    if (videoId) {
      const suffix = listId ? `?list=${listId}&rel=0` : '?rel=0'
      return `https://www.youtube-nocookie.com/embed/${videoId}${suffix}`
    }

    return null
  } catch {
    return null
  }
}

export default function YouTubePlayer({ url, title }: YouTubePlayerProps) {
  const embedUrl = toEmbedUrl(url)

  if (!embedUrl) {
    return (
      <p className="text-sm text-red-500 py-4 text-center">
        유효하지 않은 YouTube URL입니다.
      </p>
    )
  }

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        loading="lazy"
      />
    </div>
  )
}
