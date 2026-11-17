'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface SystemReports {
  overview: {
    totalUsers: number
    activeUsers: number
    totalChildren: number
    totalLogs: number
    totalAiRequests: number
    totalCost: number
  }
  userGrowth: Array<{
    date: string
    newUsers: number
    totalUsers: number
  }>
  aiUsageStats: {
    byProvider: {
      openai: number
      gemini: number
    }
    byType: {
      chat: number
      analysis: number
      quest: number
      guide: number
    }
    byPlan: {
      free: number
      premium: number
    }
  }
  topFeatures: Array<{
    feature: string
    usageCount: number
    percentage: number
  }>
  errorStats: {
    total: number
    byType: Array<{
      type: string
      count: number
    }>
  }
  performanceStats: {
    avgResponseTime: number
    successRate: number
    uptime: number
  }
}

export default function AdminReports() {
  const { isAuthenticated, isHydrated, token, user } = useAuthStore()
  const router = useRouter()
  const [reports, setReports] = useState<SystemReports | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    if (!isHydrated) return
    
    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchReports()
  }, [isAuthenticated, isHydrated, user, router, dateRange])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reports?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('리포트 데이터 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'excel') => {
    try {
      const response = await fetch(`/api/admin/reports/export?format=${format}&range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `system-report-${dateRange}.${format === 'csv' ? 'csv' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('리포트 내보내기 오류:', error)
      alert('리포트 내보내기 중 오류가 발생했습니다.')
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">관리 리포트</h1>
            <p className="text-gray-600">시스템 성능 및 사용 현황 분석</p>
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
            <button
              onClick={() => exportReport('csv')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              CSV 내보내기
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Excel 내보내기
            </button>
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
        ) : reports ? (
          <div className="space-y-6">
            {/* 전체 개요 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{reports.overview.totalUsers}</div>
                    <div className="text-sm text-gray-600">총 사용자</div>
                    <div className="text-xs text-green-600">활성: {reports.overview.activeUsers}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">👶</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{reports.overview.totalChildren}</div>
                    <div className="text-sm text-gray-600">등록된 아이</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{reports.overview.totalLogs}</div>
                    <div className="text-sm text-gray-600">성장 기록</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{reports.overview.totalAiRequests}</div>
                    <div className="text-sm text-gray-600">AI 요청</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">${reports.overview.totalCost.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">총 AI 비용</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{reports.performanceStats.uptime.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">시스템 가동률</div>
                    <div className="text-xs text-gray-500">{reports.performanceStats.avgResponseTime}ms 평균</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 사용자 증가 추이 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">사용자 증가 추이</h3>
              <div className="space-y-2">
                {reports.userGrowth.slice(0, 10).map((day, index) => (
                  <div key={day.date} className="flex items-center">
                    <div className="w-20 text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-4 relative">
                        <div 
                          className="bg-blue-500 h-4 rounded-full"
                          style={{ 
                            width: `${Math.min((day.newUsers / Math.max(...reports.userGrowth.map(d => d.newUsers))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-900 text-right">+{day.newUsers}</div>
                    <div className="w-20 text-sm text-gray-500 text-right">총 {day.totalUsers}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI 사용량 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 제공자별 사용량</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">OpenAI</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ 
                            width: `${(reports.aiUsageStats.byProvider.openai / (reports.aiUsageStats.byProvider.openai + reports.aiUsageStats.byProvider.gemini)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{reports.aiUsageStats.byProvider.openai}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Gemini</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ 
                            width: `${(reports.aiUsageStats.byProvider.gemini / (reports.aiUsageStats.byProvider.openai + reports.aiUsageStats.byProvider.gemini)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{reports.aiUsageStats.byProvider.gemini}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">기능별 사용량</h3>
                <div className="space-y-3">
                  {Object.entries(reports.aiUsageStats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-gray-700 capitalize">{type}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 인기 기능 및 오류 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">인기 기능</h3>
                <div className="space-y-3">
                  {reports.topFeatures.map((feature, index) => (
                    <div key={feature.feature} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center mr-3">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{feature.feature}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{feature.usageCount}</div>
                        <div className="text-xs text-gray-500">{feature.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">오류 통계</h3>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-red-600">{reports.errorStats.total}</div>
                  <div className="text-sm text-gray-600">총 오류 수</div>
                </div>
                <div className="space-y-2">
                  {reports.errorStats.byType.map((error) => (
                    <div key={error.type} className="flex justify-between items-center">
                      <span className="text-gray-700">{error.type}</span>
                      <span className="text-sm font-medium">{error.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 성능 지표 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 성능</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{reports.performanceStats.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">성공률</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{reports.performanceStats.avgResponseTime}ms</div>
                  <div className="text-sm text-gray-600">평균 응답 시간</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{reports.performanceStats.uptime.toFixed(2)}%</div>
                  <div className="text-sm text-gray-600">가동률</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            리포트 데이터를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </Layout>
  )
}