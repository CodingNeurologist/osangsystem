/**
 * OsangCare Service Worker
 * 전략:
 *   - 정적 자산 (JS, CSS, 폰트, 이미지): Cache First
 *   - API 요청: Network First (오프라인 시 캐시 폴백)
 *   - 내비게이션(HTML): Network First + 오프라인 폴백 페이지
 */

const CACHE_NAME = 'osangcare-v1'
const OFFLINE_URL = '/offline'

// 앱 시작 시 사전 캐시할 URL 목록
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/app',
]

// ──────────────────────────────────────────────
// Install
// ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })))
    )
  )
  self.skipWaiting()
})

// ──────────────────────────────────────────────
// Activate — 이전 캐시 정리
// ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ──────────────────────────────────────────────
// Fetch
// ──────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 같은 오리진만 처리
  if (url.origin !== location.origin) return

  // API 요청: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // 정적 자산 (_next/static): Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // 내비게이션 요청: Network First + 오프라인 폴백
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request).catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // 그 외 자산 (이미지 등): Cache First
  event.respondWith(cacheFirst(request))
})

// ──────────────────────────────────────────────
// 전략 헬퍼
// ──────────────────────────────────────────────

/** Network First: 네트워크 성공 시 캐시 업데이트, 실패 시 캐시 반환 */
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    throw new Error('Network and cache both failed')
  }
}

/** Cache First: 캐시 히트 시 즉시 반환, 미스 시 네트워크 요청 후 캐시 저장 */
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    cache.put(request, response.clone())
  }
  return response
}

// ──────────────────────────────────────────────
// Push Notification (관리자 수동 발송)
// ──────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: '오상케어', body: event.data.text() }
  }

  const options = {
    body: data.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url ?? '/app' },
    vibrate: [100, 50, 100],
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? '오상케어', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/app'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
