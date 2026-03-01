import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '오상케어',
    short_name: '오상케어',
    description: '자율신경실조증 자가진단과 스트레스 관리를 위한 오상신경외과 복지 플랫폼',
    start_url: '/app',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0284c7',
    categories: ['health', 'medical'],
    lang: 'ko',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: '설문 작성',
        short_name: '설문',
        url: '/app/survey',
        description: 'PHQ-9, GAD-7, ASRS 추적 설문',
      },
      {
        name: '명상음악',
        short_name: '음악',
        url: '/app/music',
        description: '바이노럴 비트 명상',
      },
    ],
  }
}
