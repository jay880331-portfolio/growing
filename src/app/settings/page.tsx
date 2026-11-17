'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { getUserLocale, type Locale } from '@/lib/locale'
import Layout from '@/components/Layout'
import LanguageSelector from '@/components/LanguageSelector'
import { useTranslation } from '@/hooks/useTranslation'

export default function SettingsPage() {
  const { isAuthenticated, isHydrated } = useAuthStore()
  const { t, settings } = useTranslation()
  const router = useRouter()
  const [currentLocale, setCurrentLocale] = useState<Locale>('ko')

  useEffect(() => {
    // hydration이 완료된 후에만 인증 상태 확인
    if (!isHydrated) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchCurrentLocale()
  }, [isAuthenticated, isHydrated, router])

  const fetchCurrentLocale = async () => {
    try {
      // 로컬 스토리지에서 언어 설정 확인
      const storedLocale = localStorage.getItem('locale') as Locale;
      if (storedLocale && ['ko', 'vi'].includes(storedLocale)) {
        setCurrentLocale(storedLocale);
      } else {
        setCurrentLocale('ko'); // 기본값
      }
    } catch (error) {
      console.error(t('settings.languageError'), error);
      setCurrentLocale('ko');
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('settings.title')}</h1>
        
        {/* 언어 설정 섹션 */}
        <div className="bg-white rounded-lg shadow p-6">
          <LanguageSelector 
            currentLocale={currentLocale}
            onLanguageChange={fetchCurrentLocale}
          />
        </div>
      </div>
    </Layout>
  )
}