import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: {
    default: '오상케어 — 오상신경외과 복지 플랫폼',
    template: '%s | 오상케어',
  },
  description: '자율신경실조증 자가진단과 스트레스 관리를 위한 오상신경외과 복지 플랫폼입니다.',
  keywords: ['자율신경실조증', '스트레스 관리', '오상신경외과', '자가진단', '정신건강'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '오상케어',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#b7945a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Toaster position="top-center" />
        <ServiceWorkerRegistrar />
        <InstallPrompt />
      </body>
    </html>
  )
}
