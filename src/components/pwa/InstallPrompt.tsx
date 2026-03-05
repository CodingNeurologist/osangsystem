'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Share, MoreVertical, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Platform = 'ios' | 'android-chrome' | 'samsung' | 'firefox' | 'other'

function detectPlatform(): Platform {
  const ua = navigator.userAgent

  // iOS Safari (not in standalone or Chrome/Firefox iOS wrapper)
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios'
  }

  // Samsung Internet
  if (/SamsungBrowser/i.test(ua)) {
    return 'samsung'
  }

  // Firefox Android
  if (/Firefox/i.test(ua) && /Android/i.test(ua)) {
    return 'firefox'
  }

  // Chrome Android or Desktop Chrome
  if (/Chrome/i.test(ua) && !/Edge|Edg|OPR|Opera/i.test(ua)) {
    return 'android-chrome'
  }

  return 'other'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true)
  )
}

const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7일

function isDismissed(): boolean {
  const val = localStorage.getItem(DISMISS_KEY)
  if (!val) return false
  const ts = parseInt(val, 10)
  if (isNaN(ts)) return false
  return Date.now() - ts < DISMISS_DURATION
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [platform, setPlatform] = useState<Platform>('other')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    const detected = detectPlatform()
    setPlatform(detected)

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // beforeinstallprompt를 지원하지 않는 브라우저에서는 수동 안내 표시
    // 짧은 딜레이 후 이벤트가 안 오면 수동 안내로 전환
    const timeout = setTimeout(() => {
      setShowManual((prev) => {
        // deferredPrompt가 이미 설정됐으면 수동 안내 불필요
        return !prev
      })
    }, 2000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timeout)
    }
  }, [])

  // deferredPrompt가 설정되면 수동 안내 숨기기
  useEffect(() => {
    if (deferredPrompt) {
      setShowManual(false)
    }
  }, [deferredPrompt])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setDismissed(true)
  }

  // 이미 standalone이거나 닫은 경우
  if (dismissed || isStandalone()) return null

  // beforeinstallprompt를 지원하는 브라우저에서 네이티브 프롬프트
  if (deferredPrompt) {
    return (
      <div
        role="banner"
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
      >
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 text-sm">홈 화면에 추가</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  오상케어를 앱처럼 빠르게 열 수 있습니다.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleInstall}>
                    추가하기
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDismiss}>
                    나중에
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 수동 안내 (iOS Safari, Firefox, Samsung Internet 등)
  if (!showManual) return null

  return (
    <div
      role="banner"
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
    >
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-900 text-sm">홈 화면에 추가</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                오상케어를 앱처럼 빠르게 열 수 있습니다.
              </p>
              <ManualInstructions platform={platform} />
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={handleDismiss}>
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ManualInstructions({ platform }: { platform: Platform }) {
  if (platform === 'ios') {
    return (
      <div className="mt-2 space-y-1.5">
        <p className="text-xs text-zinc-600 flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600 flex-shrink-0">1</span>
          하단 <Share className="inline h-3.5 w-3.5 text-blue-500" /> 공유 버튼을 누르세요
        </p>
        <p className="text-xs text-zinc-600 flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600 flex-shrink-0">2</span>
          <Plus className="inline h-3.5 w-3.5 text-zinc-700" /> 홈 화면에 추가를 선택하세요
        </p>
      </div>
    )
  }

  if (platform === 'samsung') {
    return (
      <div className="mt-2 space-y-1.5">
        <p className="text-xs text-zinc-600 flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600 flex-shrink-0">1</span>
          하단의 메뉴 버튼(≡)을 누르세요
        </p>
        <p className="text-xs text-zinc-600 flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600 flex-shrink-0">2</span>
          <Plus className="inline h-3.5 w-3.5 text-zinc-700" /> 페이지를 홈 화면에 추가를 선택하세요
        </p>
      </div>
    )
  }

  if (platform === 'firefox') {
    return (
      <div className="mt-2 space-y-1.5">
        <p className="text-xs text-zinc-600 flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600 flex-shrink-0">1</span>
          우측 상단 <MoreVertical className="inline h-3.5 w-3.5 text-zinc-700" /> 메뉴를 누르세요
        </p>
        <p className="text-xs text-zinc-600 flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600 flex-shrink-0">2</span>
          홈 화면에 추가를 선택하세요
        </p>
      </div>
    )
  }

  // 기본 (Android Chrome에서 beforeinstallprompt가 안 온 경우 포함)
  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-xs text-zinc-600 flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600 flex-shrink-0">1</span>
        브라우저 메뉴 <MoreVertical className="inline h-3.5 w-3.5 text-zinc-700" /> 를 누르세요
      </p>
      <p className="text-xs text-zinc-600 flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-600 flex-shrink-0">2</span>
        홈 화면에 추가 또는 앱 설치를 선택하세요
      </p>
    </div>
  )
}
