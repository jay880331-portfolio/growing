'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface AIUsageData {
  totalRequests: number
  totalCost: number
  requestsByProvider: {
    openai: number
    gemini: number
  }
  requestsByType: {
    chat: number
    analysis: number
    quest: number
    guide: number
  }
  topUsers: Array<{
    userId: string
    userName: string
    userEmail: string
    monthlyUsed: number
    plan: string
  }>
  dailyUsage: Array<{
    date: string
    requests: number
    cost: number
  }>
}

export default function AdminAIUsage() {
  const { isAuthenticated, isHydrated, token, user } = useAuthStore()
  const router = useRouter()
  const [usageData, setUsageData] = useState<AIUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    if (!isHydrated) return
    
    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchUsageData()
  }, [isAuthenticated, isHydrated, user, router, dateRange])

  const fetchUsageData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/ai-usage?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsageData(data)
      }
    } catch (error) {
      console.error('AI 사용량 데이터 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetAllUsage = async () => {
    if (!confirm('모든 사용자의 AI 사용량을 리셋하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/ai-usage/reset-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert('모든 사용자의 AI 사용량이 리셋되었습니다.')
        fetchUsageData()
      } else {
        const error = await response.json()
        alert(error.error || '리셋 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('전체 사용량 리셋 오류:', error)
      alert('리셋 중 오류가 발생했습니다.')
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI 사용량 관리</h1>
            <p className="text-gray-600">시스템 전체 AI 사용량 모니터링 및 관리</p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
            </select>
            <Link
              href="/admin"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              관리자 홈
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : usageData ? (
          <div className="space-y-6">
            {/* 전체 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">{usageData.totalRequests.toLocaleString()}</div>
                <div className="text-sm text-gray-600">총 요청 수</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600">${usageData.totalCost.toFixed(2)}</div>
                <div className="text-sm text-gray-600">총 비용</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-purple-600">{usageData.requestsByProvider.openai}</div>
                <div className="text-sm text-gray-600">OpenAI 요청</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-orange-600">{usageData.requestsByProvider.gemini}</div>
                <div className="text-sm text-gray-600">Gemini 요청</div>
              </div>
            </div>

            {/* 요청 유형별 통계 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">요청 유형별 사용량</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{usageData.requestsByType.chat}</div>
                  <div className="text-sm text-blue-600">AI 채팅</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{usageData.requestsByType.analysis}</div>
                  <div className="text-sm text-green-600">성장 분석</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{usageData.requestsByType.quest}</div>
                  <div className="text-sm text-purple-600">퀘스트 생성</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{usageData.requestsByType.guide}</div>
                  <div className="text-sm text-orange-600">성장 가이드</div>
                </div>
              </div>
            </div>

            {/* 상위 사용자 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">상위 사용자</h3>
                <button
                  onClick={resetAllUsage}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                >
                  전체 사용량 리셋
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">월 사용량</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">플랜</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usageData.topUsers.map((user, index) => (
                      <tr key={user.userId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{index + 1} {user.userName}
                            </div>
                            <div className="text-sm text-gray-500">{user.userEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.monthlyUsed}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.plan === 'premium' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.plan}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 일별 사용량 그래프 (간단한 막대 차트) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">일별 사용량</h3>
              <div className="space-y-2">
                {usageData.dailyUsage.slice(0, 10).map((day, index) => (
                  <div key={day.date} className="flex items-center">
                    <div className="w-20 text-sm text-gray-600">{new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-4 relative">
                        <div 
                          className="bg-blue-500 h-4 rounded-full"
                          style={{ 
                            width: `${Math.min((day.requests / Math.max(...usageData.dailyUsage.map(d => d.requests))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-900 text-right">{day.requests}</div>
                    <div className="w-16 text-sm text-gray-500 text-right">${day.cost.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            데이터를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </Layout>
  )
}