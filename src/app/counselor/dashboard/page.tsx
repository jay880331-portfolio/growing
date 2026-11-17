'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface CounselorData {
  _id: string
  status: string
  isVerified: boolean
  rating: {
    average: number
    count: number
  }
  earnings: {
    totalEarned: number
    currentMonthEarned: number
    pendingPayout: number
  }
  subscription: {
    plan: string
    status: string
    validUntil: string
  }
}

export default function CounselorDashboard() {
  const { isAuthenticated, token, user } = useAuthStore()
  const router = useRouter()
  const [counselorData, setCounselorData] = useState<CounselorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    checkCounselorStatus()
  }, [isAuthenticated])

  const checkCounselorStatus = async () => {
    try {
      const response = await fetch('/api/counselor/register', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      const data = await response.json()
      if (response.ok) {
        if (!data.registered) {
          router.push('/counselor/register')
        } else {
          setCounselorData(data.counselor)
        }
      }
    } catch (error) {
      console.error('상담사 정보 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">상담사 대시보드</h1>
          <p className="text-gray-600">상담 관리 및 수익 현황을 확인하세요</p>
        </div>

        {/* 상태 알림 */}
        {counselorData.status === 'inactive' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  승인 대기 중
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  관리자가 제출하신 정보를 검토 중입니다. 승인 후 상담 활동이 가능합니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">상태</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                counselorData.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : counselorData.status === 'inactive'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {counselorData.status === 'active' ? '활동중' : 
                 counselorData.status === 'inactive' ? '승인대기' : '정지'}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {counselorData.isVerified ? '인증완료' : '미인증'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-4">평점</h3>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-gray-900">
                {counselorData.rating.average.toFixed(1)}
              </p>
              <div className="ml-2 flex items-center">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm text-gray-600 ml-1">({counselorData.rating.count})</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-4">이번달 수익</h3>
            <p className="text-2xl font-bold text-gray-900">
              ₩{formatPrice(counselorData.earnings.currentMonthEarned)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-4">총 수익</h3>
            <p className="text-2xl font-bold text-gray-900">
              ₩{formatPrice(counselorData.earnings.totalEarned)}
            </p>
          </div>
        </div>

        {/* 구독 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">구독 정보</h2>
            <Link
              href="/counselor/subscription"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              구독 관리 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">플랜</p>
              <p className="font-medium text-gray-900">
                {counselorData.subscription.plan === 'counselor-basic' ? '베이직' : 
                 counselorData.subscription.plan === 'counselor-pro' ? '프로' : '프리미엄'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">상태</p>
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
              <p className="text-sm text-gray-600">유효기간</p>
              <p className="font-medium text-gray-900">
                {new Date(counselorData.subscription.validUntil).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
          
          {/* 업그레이드 유도 */}
          {counselorData.subscription.plan === 'counselor-basic' && (
            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">더 많은 혜택을 받으세요</p>
                  <p className="text-xs text-gray-600">프로 플랜으로 업그레이드하면 수수료가 줄어들고 더 많은 기능을 이용할 수 있습니다.</p>
                </div>
                <Link
                  href="/counselor/subscription"
                  className="ml-4 bg-purple-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-purple-700 whitespace-nowrap"
                >
                  업그레이드
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            href="/counselor/profile"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-3">👤</div>
            <h3 className="font-semibold text-gray-900 mb-1">프로필 관리</h3>
            <p className="text-sm text-gray-600">프로필 정보 수정</p>
          </Link>

          <Link 
            href="/counselor/consultations"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-gray-900 mb-1">상담 관리</h3>
            <p className="text-sm text-gray-600">예약 및 상담 내역</p>
          </Link>

          <Link 
            href="/counselor/earnings"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-gray-900 mb-1">수익 관리</h3>
            <p className="text-sm text-gray-600">정산 및 출금</p>
          </Link>
        </div>
      </div>
    </Layout>
  )
}