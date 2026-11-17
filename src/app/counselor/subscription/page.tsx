'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Layout from '@/components/Layout'
import { COUNSELOR_PLANS, getCounselorPlan, getYearlyPrice, formatPrice, YEARLY_DISCOUNT } from '@/utils/counselorPlans'

interface CounselorData {
  _id: string
  subscription: {
    plan: string
    status: string
    validUntil: string
    lastPayment?: string
  }
  earnings: {
    totalEarned: number
    currentMonthEarned: number
  }
}

export default function CounselorSubscription() {
  const { isAuthenticated, token } = useAuthStore()
  const router = useRouter()
  const [counselorData, setCounselorData] = useState<CounselorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<string>('')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchCounselorData()
  }, [isAuthenticated])

  const fetchCounselorData = async () => {
    try {
      const response = await fetch('/api/counselor/register', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      const data = await response.json()
      if (response.ok && data.registered) {
        setCounselorData(data.counselor)
        setSelectedPlan(data.counselor.subscription.plan)
      } else {
        router.push('/counselor/register')
      }
    } catch (error) {
      console.error('상담사 정보 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlanChange = async (planId: string) => {
    try {
      const response = await fetch('/api/counselor/subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle
        }),
      })

      if (response.ok) {
        alert('구독 플랜이 변경되었습니다.')
        fetchCounselorData()
      } else {
        const error = await response.json()
        alert(error.error || '플랜 변경 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('플랜 변경 오류:', error)
      alert('플랜 변경 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </Layout>
    )
  }

  if (!counselorData) {
    return null
  }

  const currentPlan = getCounselorPlan(counselorData.subscription.plan)

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">구독 관리</h1>
          <p className="text-gray-600">상담사 플랜을 관리하고 업그레이드하세요</p>
        </div>

        {/* 현재 구독 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">현재 구독</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">현재 플랜</p>
              <p className="text-lg font-semibold text-gray-900">
                {currentPlan?.name} 플랜
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">상태</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                counselorData.subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : counselorData.subscription.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {counselorData.subscription.status === 'active' ? '활성' : 
                 counselorData.subscription.status === 'pending' ? '대기중' : '비활성'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">다음 결제일</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(counselorData.subscription.validUntil).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
          
          {currentPlan && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">현재 플랜 혜택</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 플랜 선택 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">플랜 변경</h2>
            
            {/* 빌링 사이클 토글 */}
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                월간 결제
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                연간 결제
                <span className="ml-1 text-xs text-green-600 font-semibold">
                  {Math.round(YEARLY_DISCOUNT * 100)}% 할인
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COUNSELOR_PLANS.map((plan) => {
              const price = billingCycle === 'yearly' ? getYearlyPrice(plan.price) : plan.price
              const isCurrentPlan = plan.id === counselorData.subscription.plan
              const isPopular = plan.id === 'counselor-pro'

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white border rounded-lg p-6 ${
                    isCurrentPlan
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-medium">
                        인기
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(price)}
                      </span>
                      <span className="text-gray-600">
                        /{billingCycle === 'yearly' ? '년' : '월'}
                      </span>
                      {billingCycle === 'yearly' && (
                        <div className="text-sm text-green-600 font-medium">
                          월 {formatPrice(Math.floor(price / 12))} (20% 절약)
                        </div>
                      )}
                    </div>

                    <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="text-xs text-gray-500 mb-4">
                      플랫폼 수수료: {plan.commissionRate}%
                    </div>

                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                      >
                        현재 플랜
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePlanChange(plan.id)}
                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                          plan.id === 'counselor-premium'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {plan.price > (currentPlan?.price || 0) ? '업그레이드' : '변경하기'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 결제 내역 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">결제 내역</h2>
          <div className="text-center py-8 text-gray-500">
            결제 내역이 없습니다.
          </div>
        </div>
      </div>
    </Layout>
  )
}