import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { Toaster } from '@/components/ui/sonner'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://osangcare.vercel.app'),
  title: {
    default: '오상케어 — 오상신경외과 복지 플랫폼',
    template: '%s | 오상케어',
  },
  description: '자율신경실조증 자가진단과 스트레스 관리를 위한 오상신경외과 복지 플랫폼입니다. 무료 자가체크로 내 자율신경 상태를 확인하세요.',
  keywords: ['자율신경실조증', '자율신경실조증 자가진단', '스트레스 자가진단', '스트레스 관리', '오상신경외과', '자가진단', '정신건강', 'COMPASS-31', '자율신경 검사'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '오상케어',
    title: '오상케어 — 자율신경 스트레스 자가진단',
    description: '자율신경실조증 자가진단과 스트레스 관리를 위한 오상신경외과 복지 플랫폼입니다. 회원가입 없이 무료로 자가체크하세요.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '오상케어' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '오상케어 — 자율신경 스트레스 자가진단',
    description: '자율신경실조증 자가진단과 스트레스 관리를 위한 복지 플랫폼',
    images: ['/og-image.png'],
  },
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
  maximumScale: 5,
  themeColor: '#b7945a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={notoSansKR.className}>
        {children}
        <Toaster position="top-center" />
        <ServiceWorkerRegistrar />
        <InstallPrompt />
      </body>
    </html>
  )
}
