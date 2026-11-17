'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface SystemSettings {
  aiProvider: 'openai' | 'gemini'
  aiModels: {
    openai: string
    gemini: string
  }
  rateLimits: {
    free: number
    premium: number
  }
  systemMaintenance: {
    enabled: boolean
    message: string
    startTime?: string
    endTime?: string
  }
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  dataRetention: {
    logs: number // days
    analytics: number // days
    backups: number // days
  }
}

interface AppSettings {
  showSubscriptionFeatures: boolean
  showCounselorFeatures: boolean
  showAICoachFeatures: boolean
  isUnderAppStoreReview: boolean
  appStoreReviewMode: {
    hideSubscription: boolean
    hidePremiumFeatures: boolean
    hidePaymentRelated: boolean
    customMessage: string
  }
  features: {
    subscription: boolean
    counselor: boolean
    aiCoach: boolean
    quest: boolean
    growthGuide: boolean
    reports: boolean
    healthAlerts: boolean
  }
}

export default function AdminSystemSettings() {
  const { isAuthenticated, isHydrated, token, user } = useAuthStore()
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isHydrated) return
    
    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchSettings()
    fetchAppSettings()
  }, [isAuthenticated, isHydrated, user, router])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/system-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('시스템 설정 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAppSettings = async () => {
    try {
      const response = await fetch('/api/admin/app-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setAppSettings(data.settings)
      }
    } catch (error) {
      console.error('앱 설정 조회 오류:', error)
    }
  }

  const updateSettings = async () => {
    if (!settings) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert('시스템 설정이 업데이트되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '설정 업데이트 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('시스템 설정 업데이트 오류:', error)
      alert('설정 업데이트 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const updateAppSettings = async () => {
    if (!appSettings) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/admin/app-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appSettings),
      })

      if (response.ok) {
        alert('앱 설정이 업데이트되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '앱 설정 업데이트 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('앱 설정 업데이트 오류:', error)
      alert('앱 설정 업데이트 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 앱스토어 심사 모드 빠른 토글
  const toggleAppStoreReviewMode = async () => {
    if (!appSettings) return

    const newReviewMode = !appSettings.isUnderAppStoreReview
    const updatedSettings = {
      ...appSettings,
      isUnderAppStoreReview: newReviewMode,
      appStoreReviewMode: {
        ...appSettings.appStoreReviewMode,
        hideSubscription: newReviewMode,
        hidePremiumFeatures: newReviewMode,
        hidePaymentRelated: newReviewMode,
      },
      features: {
        ...appSettings.features,
        subscription: !newReviewMode,
      }
    }

    setAppSettings(updatedSettings)

    try {
      const response = await fetch('/api/admin/app-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      })

      if (response.ok) {
        alert(`앱스토어 심사 모드가 ${newReviewMode ? '활성화' : '비활성화'}되었습니다.`)
      } else {
        const error = await response.json()
        alert(error.error || '설정 변경 중 오류가 발생했습니다.')
        // 실패시 원복
        setAppSettings(appSettings)
      }
    } catch (error) {
      console.error('앱스토어 심사 모드 토글 오류:', error)
      alert('설정 변경 중 오류가 발생했습니다.')
      // 실패시 원복
      setAppSettings(appSettings)
    }
  }

  const resetAllUserUsage = async () => {
    if (!confirm('모든 사용자의 AI 사용량을 리셋하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/reset-all-usage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert('모든 사용자의 AI 사용량이 리셋되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '리셋 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('전체 사용량 리셋 오류:', error)
      alert('리셋 중 오류가 발생했습니다.')
    }
  }

  const clearSystemCache = async () => {
    if (!confirm('시스템 캐시를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert('시스템 캐시가 삭제되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '캐시 삭제 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('캐시 삭제 오류:', error)
      alert('캐시 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">로딩 중...</div>
        </div>
      </Layout>
    )
  }

  if (!settings) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8 text-gray-500">
            시스템 설정을 불러올 수 없습니다.
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">시스템 설정</h1>
            <p className="text-gray-600">시스템 전체 설정 및 관리</p>
          </div>
          <div className="flex gap-2">
            {appSettings && (
              <button
                onClick={toggleAppStoreReviewMode}
                className={`px-4 py-2 rounded-lg font-medium ${
                  appSettings.isUnderAppStoreReview
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {appSettings.isUnderAppStoreReview ? '🔒 심사 모드 ON' : '🔓 심사 모드 OFF'}
              </button>
            )}
            <button
              onClick={updateSettings}
              disabled={saving}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '설정 저장'}
            </button>
            <Link
              href="/admin"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              관리자 홈
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {/* 앱 설정 - 앱스토어 심사 관련 */}
          {appSettings && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">📱 앱 설정 (앱스토어 심사 관리)</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  appSettings.isUnderAppStoreReview 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {appSettings.isUnderAppStoreReview ? '심사 모드' : '일반 모드'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 앱스토어 심사 설정 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">앱스토어 심사 설정</h4>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={appSettings.isUnderAppStoreReview}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        isUnderAppStoreReview: e.target.checked
                      })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      앱스토어 심사 모드 활성화
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={appSettings.appStoreReviewMode.hideSubscription}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        appStoreReviewMode: {
                          ...appSettings.appStoreReviewMode,
                          hideSubscription: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      구독 관련 UI 숨김
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={appSettings.appStoreReviewMode.hidePremiumFeatures}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        appStoreReviewMode: {
                          ...appSettings.appStoreReviewMode,
                          hidePremiumFeatures: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      프리미엄 기능 숨김
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={appSettings.appStoreReviewMode.hidePaymentRelated}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        appStoreReviewMode: {
                          ...appSettings.appStoreReviewMode,
                          hidePaymentRelated: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      결제 관련 기능 숨김
                    </label>
                  </div>
                </div>

                {/* 기능별 활성화 설정 */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">기능 활성화 설정</h4>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={appSettings.features.subscription}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        features: { ...appSettings.features, subscription: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      구독 관리 기능
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={appSettings.features.counselor}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        features: { ...appSettings.features, counselor: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      전문 상담 기능
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={appSettings.features.aiCoach}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        features: { ...appSettings.features, aiCoach: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      AI 코치 기능
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={appSettings.features.quest}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        features: { ...appSettings.features, quest: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      퀘스트 기능
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용자에게 보여줄 메시지 (심사 모드 중)
                </label>
                <textarea
                  value={appSettings.appStoreReviewMode.customMessage}
                  onChange={(e) => setAppSettings({
                    ...appSettings,
                    appStoreReviewMode: {
                      ...appSettings.appStoreReviewMode,
                      customMessage: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="일부 기능은 현재 업데이트 중입니다. 빠른 시일 내에 이용하실 수 있도록 하겠습니다."
                />
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={updateAppSettings}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '앱 설정 저장'}
                </button>
                <button
                  onClick={toggleAppStoreReviewMode}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    appSettings.isUnderAppStoreReview
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {appSettings.isUnderAppStoreReview ? '일반 모드로 전환' : '심사 모드로 전환'}
                </button>
              </div>
            </div>
          )}

          {/* AI 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 설정</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기본 AI 제공자
                </label>
                <select
                  value={settings.aiProvider}
                  onChange={(e) => setSettings({
                    ...settings,
                    aiProvider: e.target.value as 'openai' | 'gemini'
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI 모델
                </label>
                <input
                  type="text"
                  value={settings.aiModels.openai}
                  onChange={(e) => setSettings({
                    ...settings,
                    aiModels: { ...settings.aiModels, openai: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="gpt-4o-mini"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gemini 모델
                </label>
                <input
                  type="text"
                  value={settings.aiModels.gemini}
                  onChange={(e) => setSettings({
                    ...settings,
                    aiModels: { ...settings.aiModels, gemini: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="gemini-1.5-flash"
                />
              </div>
            </div>
          </div>

          {/* 사용량 제한 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">사용량 제한</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  무료 플랜 월 한도
                </label>
                <input
                  type="number"
                  value={settings.rateLimits.free}
                  onChange={(e) => setSettings({
                    ...settings,
                    rateLimits: { ...settings.rateLimits, free: parseInt(e.target.value) }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프리미엄 플랜 월 한도
                </label>
                <input
                  type="number"
                  value={settings.rateLimits.premium}
                  onChange={(e) => setSettings({
                    ...settings,
                    rateLimits: { ...settings.rateLimits, premium: parseInt(e.target.value) }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* 시스템 유지보수 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 유지보수</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.systemMaintenance.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemMaintenance: {
                      ...settings.systemMaintenance,
                      enabled: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">
                  유지보수 모드 활성화
                </label>
              </div>
              {settings.systemMaintenance.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    유지보수 메시지
                  </label>
                  <textarea
                    value={settings.systemMaintenance.message}
                    onChange={(e) => setSettings({
                      ...settings,
                      systemMaintenance: {
                        ...settings.systemMaintenance,
                        message: e.target.value
                      }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="시스템 점검 중입니다. 잠시 후 다시 시도해주세요."
                  />
                </div>
              )}
            </div>
          </div>

          {/* 데이터 보존 정책 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">데이터 보존 정책</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  로그 보존 기간 (일)
                </label>
                <input
                  type="number"
                  value={settings.dataRetention.logs}
                  onChange={(e) => setSettings({
                    ...settings,
                    dataRetention: { ...settings.dataRetention, logs: parseInt(e.target.value) }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  분석 데이터 보존 기간 (일)
                </label>
                <input
                  type="number"
                  value={settings.dataRetention.analytics}
                  onChange={(e) => setSettings({
                    ...settings,
                    dataRetention: { ...settings.dataRetention, analytics: parseInt(e.target.value) }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  백업 보존 기간 (일)
                </label>
                <input
                  type="number"
                  value={settings.dataRetention.backups}
                  onChange={(e) => setSettings({
                    ...settings,
                    dataRetention: { ...settings.dataRetention, backups: parseInt(e.target.value) }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* 시스템 관리 도구 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 관리 도구</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={resetAllUserUsage}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                전체 사용량 리셋
              </button>
              <button
                onClick={clearSystemCache}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              >
                시스템 캐시 삭제
              </button>
              <Link
                href="/api/admin/backup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                데이터 백업 생성
              </Link>
              <Link
                href="/admin/reports"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                시스템 리포트 보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}