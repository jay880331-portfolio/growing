'use client'

import Layout from '@/components/Layout'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppSettings } from '@/hooks/useAppSettings'
import ClientOnly from '@/components/ClientOnly'
import { useTranslation } from '@/hooks/useTranslation'

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const { shouldHideCounselor, isFeatureEnabled } = useAppSettings()
  const { t } = useTranslation()

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              {t('homepage.hero.title')}<br />
              <span className="text-primary-600">{t('homepage.hero.subtitle')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('homepage.hero.description')}
            </p>
            <div className="flex justify-center space-x-4">
              <ClientOnly fallback={
                <>
                  <Link
                    href="/signup"
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition"
                  >
                    {t('homepage.hero.startFree')}
                  </Link>
                  <Link
                    href="/login"
                    className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium border border-primary-600 hover:bg-primary-50 transition"
                  >
                    {t('homepage.hero.login')}
                  </Link>
                </>
              }>
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition"
                  >
                    {t('homepage.hero.goToDashboard')}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition"
                    >
                      {t('homepage.hero.startFree')}
                    </Link>
                    <Link
                      href="/login"
                      className="bg-white text-primary-600 px-8 py-3 rounded-lg font-medium border border-primary-600 hover:bg-primary-50 transition"
                    >
                      {t('homepage.hero.login')}
                    </Link>
                  </>
                )}
              </ClientOnly>
            </div>
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.features.quickRecord.title')}</h3>
              <p className="text-gray-600">
                {t('homepage.features.quickRecord.description')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.features.aiInsights.title')}</h3>
              <p className="text-gray-600">
                {t('homepage.features.aiInsights.description')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-warm-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.features.growthReport.title')}</h3>
              <p className="text-gray-600">
                {t('homepage.features.growthReport.description')}
              </p>
            </div>
          </div>
        </div>

        {/* 상담사 등록 섹션 */}
        {!shouldHideCounselor() && isFeatureEnabled('counselor') && (
          <div className="mt-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 lg:p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">{t('homepage.counselor.title')}</h2>
            <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
              {t('homepage.counselor.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/counselor/register"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                {t('homepage.counselor.register')}
              </Link>
              <Link
                href="/counselors"
                className="bg-purple-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-400 transition border border-purple-400"
              >
                {t('homepage.counselor.browse')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}