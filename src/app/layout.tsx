import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import StructuredData from '@/components/StructuredData'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '그로잉 - AI 성장 파트너',
  description: 'AI와 함께하는 우리 아이 성장 기록',
  keywords: 'AI, 육아, 성장기록, 아이발달, 부모앱, 육아일기, 성장추적, 아이관찰, 발달체크, 육아코치',
  authors: [{ name: 'Growing Team' }],
  creator: 'Growing',
  publisher: 'Growing',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://growing-app.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/',
      'vi-VN': '/',
    },
  },
  openGraph: {
    title: '그로잉 - AI 성장 파트너',
    description: 'AI와 함께하는 우리 아이 성장 기록. 실시간 AI 분석으로 아이의 성장을 더 스마트하게 추적하세요.',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://growing-app.vercel.app',
    siteName: 'Growing',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '그로잉 - AI 성장 파트너',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '그로잉 - AI 성장 파트너',
    description: 'AI와 함께하는 우리 아이 성장 기록',
    images: ['/og-image.png'],
    creator: '@growing_app',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  manifest: '/manifest.json',
  verification: {
    google: '1f4fedad8051d9ed',
  },
  category: 'parenting',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  
  console.log('🏗️ RootLayout - 현재 언어:', locale);
  console.log('📝 RootLayout - 메시지 키들:', Object.keys(messages));

  return (
    <html lang={locale}>
      <head>
        <StructuredData />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}