'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface UpgradeRequest {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  email: string
  currentPlan: string
  requestedPlan: string
  status: 'pending' | 'contacted' | 'completed' | 'cancelled'
  createdAt: string
  contactedAt?: string
  completedAt?: string
  notes?: string
}

export default function AdminUpgradeRequests() {
  const { isAuthenticated, isHydrated, token, user } = useAuthStore()
  const router = useRouter()
  const [requests, setRequests] = useState<UpgradeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted' | 'completed'>('all')

  useEffect(() => {
    if (!isHydrated) return
    
    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchRequests()
  }, [isAuthenticated, isHydrated, user, router])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/subscription/upgrade-request', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('업그레이드 신청 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/upgrade-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes
        }),
      })

      if (response.ok) {
        alert('상태가 업데이트되었습니다.')
        fetchRequests()
      } else {
        const error = await response.json()
        alert(error.error || '업데이트 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('상태 업데이트 오류:', error)
      alert('업데이트 중 오류가 발생했습니다.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">대기중</span>
      case 'contacted':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">연락완료</span>
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">완료</span>
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">취소</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">{status}</span>
    }
  }

  const filteredRequests = requests.filter(request => 
    filter === 'all' || request.status === filter
  )

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">업그레이드 신청 관리</h1>
            <p className="text-gray-600">사용자 업그레이드 신청을 관리합니다</p>
          </div>
          <Link
            href="/admin"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            관리자 홈
          </Link>
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'pending', label: '대기중' },
              { key: 'contacted', label: '연락완료' },
              { key: 'completed', label: '완료' }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === item.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      플랜 변경
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      신청일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.userId.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.userId.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="text-gray-500">{request.currentPlan}</span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="font-medium text-primary-600">{request.requestedPlan}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateRequestStatus(request._id, 'contacted')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                연락완료
                              </button>
                              <button
                                onClick={() => updateRequestStatus(request._id, 'completed')}
                                className="text-green-600 hover:text-green-900"
                              >
                                완료
                              </button>
                            </>
                          )}
                          {request.status === 'contacted' && (
                            <button
                              onClick={() => updateRequestStatus(request._id, 'completed')}
                              className="text-green-600 hover:text-green-900"
                            >
                              완료
                            </button>
                          )}
                          <button
                            onClick={() => updateRequestStatus(request._id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                          >
                            취소
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                업그레이드 신청이 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}