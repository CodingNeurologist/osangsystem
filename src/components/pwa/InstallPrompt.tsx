'use client'

import { useState, useEffect } from 'react'
import { Smartphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      sessionStorage.getItem('pwa-install-dismissed')
    ) {
      return
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  function handleDismiss() {
    sessionStorage.setItem('pwa-install-dismissed', '1')
    setDismissed(true)
  }

  if (!deferredPrompt || dismissed) return null

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
