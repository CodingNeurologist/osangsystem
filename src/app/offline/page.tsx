import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <WifiOff className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">오프라인 상태입니다</h1>
        <p className="text-zinc-500 text-sm mb-6">
          인터넷 연결을 확인한 후 다시 시도해 주세요.
          일부 기능은 오프라인에서도 사용할 수 있습니다.
        </p>
        <Button asChild>
          <Link href="/app">다시 시도</Link>
        </Button>
      </div>
    </div>
  )
}
