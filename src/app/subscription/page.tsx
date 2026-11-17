'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import Layout from '@/components/Layout'
import { useAppSettings } from '@/hooks/useAppSettings'

interface UsageInfo {
  allowed: boolean
  remaining: number
  totalUsed: number
  plan: 'free' | 'premium'
  resetDate: string
}

interface MonthlyStats {
  totalRequests: number
  totalCost: number
  totalTokens: number
  requestsByType: any[]
  providerUsage: any[]
}

export default function SubscriptionPage() {
  const { isAuthenticated, isHydrated, token, user } = useAuthStore()
  const { shouldHideSubscription, isFeatureEnabled, getCustomMessage, loading: appSettingsLoading } = useAppSettings()
  const { t, subscription: subscriptionT } = useTranslation()
  const router = useRouter()
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [planPricing, setPlanPricing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [debugData, setDebugData] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [upgradeEmail, setUpgradeEmail] = useState('')
  const [upgradeRequested, setUpgradeRequested] = useState(false)

  useEffect(() => {
    // hydration이 완료된 후에만 인증 상태 확인
    if (!isHydrated) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // 앱 설정이 로딩 중이면 대기
    if (appSettingsLoading) {
      console.log('🔄 앱 설정 로딩 중...')
      return
    }

    // 구독 기능이 숨겨져 있으면 대시보드로 리다이렉트
    const shouldHide = shouldHideSubscription()
    const featureEnabled = isFeatureEnabled('subscription')
    
    if (shouldHide || !featureEnabled) {
      console.log('🚫 구독 페이지 접근 차단:', { shouldHide, featureEnabled })
      router.push('/dashboard')
      return
    }

    console.log('✅ 구독 페이지 접근 허용')
    fetchUsageData()
  }, [isAuthenticated, isHydrated, appSettingsLoading])

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/ai/usage', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setUsageInfo(data.currentUsage)
        setMonthlyStats(data.monthlyStats)
        setPlanPricing(data.planPricing)
      }
    } catch (error) {
      console.error('Usage info query error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradeRequest = async (plan: string) => {
    if (!upgradeEmail) {
      alert(subscriptionT('upgradeRequest.emailLabel'))
      return
    }

    setUpgrading(plan)
    try {
      const response = await fetch('/api/subscription/upgrade-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plan, 
          email: upgradeEmail,
          currentPlan: usageInfo?.plan 
        }),
      })
      
      const data = await response.json()
      if (response.ok) {
        setUpgradeRequested(true)
        alert(subscriptionT('upgradeRequest.successMessage'))
      } else {
        alert(data.error || 'Upgrade request error occurred.')
      }
    } catch (error) {
      console.error('Upgrade request error:', error)
      alert('Upgrade request error occurred.')
    } finally {
      setUpgrading(null)
    }
  }

  const fetchDebugData = async () => {
    try {
      const response = await fetch('/api/debug/user-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setDebugData(data)
      }
    } catch (error) {
      console.error('디버그 데이터 조회 오류:', error)
    }
  }

  if (loading || !isHydrated || appSettingsLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </Layout>
    )
  }

  const getUsagePercentage = () => {
    if (!usageInfo) return 0
    const total = usageInfo.totalUsed + usageInfo.remaining
    return total > 0 ? (usageInfo.totalUsed / total) * 100 : 0
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{subscriptionT('title')}</h1>
          <p className="text-gray-600">{subscriptionT('subtitle')}</p>
        </div>

        {/* 현재 사용량 카드 */}
        {usageInfo && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{subscriptionT('currentUsage')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{usageInfo.totalUsed}</div>
                <div className="text-sm text-gray-500">{subscriptionT('usedCount')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400">{usageInfo.remaining}</div>
                <div className="text-sm text-gray-500">{subscriptionT('remainingCount')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 uppercase">{usageInfo.plan}</div>
                <div className="text-sm text-gray-500">{subscriptionT('currentPlan')}</div>
              </div>
            </div>

            {/* 사용량 프로그레스 바 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{subscriptionT('usage')}</span>
                <span>{getUsagePercentage().toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    getUsagePercentage() > 90 ? 'bg-red-500' : 
                    getUsagePercentage() > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              {subscriptionT('nextReset')} {new Date(usageInfo.resetDate).toLocaleDateString('ko-KR')}
            </div>
          </div>
        )}

        {/* 월별 통계 */}
        {monthlyStats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{subscriptionT('monthlyStats')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{monthlyStats.totalRequests}</div>
                <div className="text-sm text-blue-600">{subscriptionT('totalRequests')}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">${monthlyStats.totalCost.toFixed(4)}</div>
                <div className="text-sm text-green-600">{subscriptionT('estimatedCost')}</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{monthlyStats.totalTokens.toLocaleString()}</div>
                <div className="text-sm text-purple-600">{subscriptionT('usedTokens')}</div>
              </div>
            </div>
          </div>
        )}

        {/* 플랜 선택 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{subscriptionT('planSelection')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free 플랜 */}
            <div className={`border-2 rounded-lg p-6 ${usageInfo?.plan === 'free' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Free</h3>
                <div className="text-3xl font-bold text-gray-900 mt-2">{subscriptionT('free.subtitle')}</div>
                <div className="text-sm text-gray-500">{subscriptionT('free.duration')}</div>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {subscriptionT('free.feature1')}
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {subscriptionT('free.feature2')}
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {subscriptionT('free.feature3')}
                </li>
              </ul>
              
              <div className="w-full bg-gray-300 text-gray-600 py-2 px-4 rounded text-center">
                {usageInfo?.plan === 'free' ? subscriptionT('free.currentPlan') : subscriptionT('free.title')}
              </div>
            </div>

            {/* Premium 플랜 */}
            <div className={`border-2 rounded-lg p-6 ${usageInfo?.plan === 'premium' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Premium</h3>
                <div className="text-3xl font-bold text-primary-600 mt-2">₩4,900</div>
                <div className="text-sm text-gray-500">{subscriptionT('premium.duration')}</div>
              </div>
              
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {subscriptionT('premium.feature1')}
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {subscriptionT('premium.feature2')}
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {subscriptionT('premium.feature3')}
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {subscriptionT('premium.feature4')}
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {subscriptionT('premium.feature5')}
                </li>
              </ul>
              
              {usageInfo?.plan === 'premium' ? (
                <div className="w-full bg-primary-600 text-white py-2 px-4 rounded text-center">
                  {subscriptionT('free.currentPlan')}
                </div>
              ) : upgradeRequested ? (
                <div className="w-full bg-green-100 text-green-800 py-2 px-4 rounded text-center text-sm">
                  {subscriptionT('premium.upgradeButton')} {t('common.success')}
                </div>
              ) : (
                <button
                  onClick={() => handleUpgradeRequest('premium')}
                  disabled={upgrading === 'premium'}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:opacity-50"
                >
                  {upgrading === 'premium' ? t('common.loading') : subscriptionT('premium.upgradeButton')}
                </button>
              )}
            </div>
          </div>

          {/* 업그레이드 신청 폼 */}
          {usageInfo?.plan !== 'premium' && !upgradeRequested && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">{subscriptionT('upgradeRequest.title')}</h3>
              <p className="text-sm text-blue-800 mb-4">
                {subscriptionT('upgradeRequest.description')}
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={upgradeEmail}
                  onChange={(e) => setUpgradeEmail(e.target.value)}
                  placeholder={subscriptionT('upgradeRequest.emailLabel')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={() => handleUpgradeRequest('premium')}
                  disabled={upgrading === 'premium' || !upgradeEmail}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {upgrading === 'premium' ? t('common.loading') : subscriptionT('upgradeRequest.submitButton')}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>알림:</strong> {subscriptionT('upgradeRequest.notice')}
              </p>
            </div>
            
            {/* 디버그 및 수정 도구 - 관리자만 표시 */}
            {user?.userType === 'admin' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-3">
                  🔧 <strong>개발자 도구:</strong> 사용량이 0으로 표시되는 경우 아래 버튼을 클릭하세요.
                </p>
              
              <div className="flex gap-2 mb-3 flex-wrap">
                <button
                  onClick={fetchDebugData}
                  className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                >
                  현재 데이터 확인
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/debug/fix-user-usage', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      })
                      const data = await response.json()
                      if (response.ok) {
                        alert(`수정 완료: ${data.message}`)
                        fetchUsageData() // 데이터 새로고침
                        fetchDebugData() // 디버그 데이터도 새로고침
                      } else {
                        alert('수정 실패: ' + data.error)
                      }
                    } catch (error) {
                      alert('수정 중 오류가 발생했습니다.')
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                >
                  내 데이터 수정
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/debug/force-update-user', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      })
                      const data = await response.json()
                      if (response.ok) {
                        alert(`강제 업데이트 완료: ${data.message}`)
                        fetchUsageData() // 데이터 새로고침
                        fetchDebugData() // 디버그 데이터도 새로고침
                      } else {
                        alert('강제 업데이트 실패: ' + data.error)
                      }
                    } catch (error) {
                      alert('강제 업데이트 중 오류가 발생했습니다.')
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  강제 업데이트
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/fix-usage', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      })
                      const data = await response.json()
                      if (response.ok) {
                        alert(`수정 완료: ${data.message}`)
                        fetchUsageData() // 데이터 새로고침
                      } else {
                        alert('수정 실패: ' + data.error)
                      }
                    } catch (error) {
                      alert('수정 중 오류가 발생했습니다.')
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  전체 사용자 수정
                </button>
              </div>

              {debugData && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <h4 className="font-semibold text-sm mb-2">현재 사용자 데이터:</h4>
                  <pre className="text-xs overflow-auto max-h-40 bg-gray-100 p-2 rounded">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}