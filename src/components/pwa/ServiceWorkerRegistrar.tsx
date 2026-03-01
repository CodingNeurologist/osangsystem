'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => {
          // SW 등록 실패는 비치명적 — 조용히 무시
          if (process.env.NODE_ENV === 'development') {
            console.warn('Service Worker 등록 실패:', err)
          }
        })
    }
  }, [])

  return null
}
