'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import Layout from '@/components/Layout'

interface Child {
  _id: string
  name: string
  birthDate: string
  gender: string
}

interface Report {
  child: {
    id: string
    name: string
    ageInMonths: number
  }
  period: string
  dateRange: {
    start: string
    end: string
  }
  stats: {
    totalLogs: number
    sleepLogs: number
    mealLogs: number
    activityLogs: number
    milestoneLogs: number
  }
  patterns: {
    avgSleepHours: number
    avgMealsPerDay: number
  }
  insights: any[]
}

export default function ReportsPage() {
  const { isAuthenticated, isHydrated, token } = useAuthStore()
  const { t } = useTranslation()
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('weekly')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // hydration이 완료된 후에만 인증 상태 확인
    if (!isHydrated) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchChildren()
  }, [isAuthenticated, isHydrated, router])

  useEffect(() => {
    if (selectedChild) {
      fetchReport()
    }
  }, [selectedChild, selectedPeriod])

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/children', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setChildren(data.children)
        if (data.children.length > 0) {
          setSelectedChild(data.children[0]._id)
        }
      }
    } catch (error) {
      console.error(t('reports.childError'), error)
    }
  }

  const fetchReport = async () => {
    if (!selectedChild) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        childId: selectedChild,
        period: selectedPeriod
      })

      const response = await fetch(`/api/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setReport(data.report)
      }
    } catch (error) {
      console.error(t('reports.reportError'), error)
    } finally {
      setLoading(false)
    }
  }

  const generateInsight = async () => {
    if (!selectedChild) return

    setLoading(true)
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          childId: selectedChild,
          type: selectedPeriod
        }),
      })

      if (response.ok) {
        fetchReport() // 새 인사이트가 생성되면 리포트 다시 불러오기
      } else {
        const data = await response.json()
        alert(data.error || t('reports.insightError'))
      }
    } catch (error) {
      console.error('AI insight generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodLabel = (period: string) => {
    const labels = {
      daily: t('reports.periodLabels.daily'),
      weekly: t('reports.periodLabels.weekly'),
      monthly: t('reports.periodLabels.monthly')
    }
    return labels[period as keyof typeof labels] || period
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('reports.title')}</h1>
          <button
            onClick={generateInsight}
            disabled={loading || !selectedChild}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
          >
            {t('reports.generateInsights')}
          </button>
        </div>

        {/* 필터 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reports.selectChild')}
              </label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">{t('logs.selectChildPlaceholder')}</option>
                {children.map((child) => (
                  <option key={child._id} value={child._id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reports.period')}
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="daily">{t('reports.periodLabels.daily')}</option>
                <option value="weekly">{t('reports.periodLabels.weekly')}</option>
                <option value="monthly">{t('reports.periodLabels.monthly')}</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">{t('reports.generating')}</p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* 리포트 헤더 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                {report.child.name}의 {getPeriodLabel(report.period)} 리포트
              </h2>
              <p className="text-sm text-gray-600">
                {t('reports.startDate')}: {new Date(report.dateRange.start).toLocaleDateString()} ~ {t('reports.endDate')}: {new Date(report.dateRange.end).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                현재 나이: {Math.floor(report.child.ageInMonths / 12)}세 {report.child.ageInMonths % 12}개월
              </p>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <div className="text-2xl font-bold text-primary-600">{report.stats.totalLogs}</div>
                <div className="text-sm text-gray-600">{t('reports.statsLabels.totalRecords')}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <div className="text-2xl font-bold text-blue-600">{report.stats.sleepLogs}</div>
                <div className="text-sm text-gray-600">{t('logs.sleepType')}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <div className="text-2xl font-bold text-green-600">{report.stats.mealLogs}</div>
                <div className="text-sm text-gray-600">{t('logs.mealType')}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <div className="text-2xl font-bold text-purple-600">{report.stats.activityLogs}</div>
                <div className="text-sm text-gray-600">활동 기록</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <div className="text-2xl font-bold text-pink-600">{report.stats.milestoneLogs}</div>
                <div className="text-sm text-gray-600">마일스톤</div>
              </div>
            </div>

            {/* 패턴 분석 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">패턴 분석</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {report.patterns.avgSleepHours}시간
                  </div>
                  <div className="text-gray-600">평균 수면시간</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {report.patterns.avgMealsPerDay}회
                  </div>
                  <div className="text-gray-600">하루 평균 식사 횟수</div>
                </div>
              </div>
            </div>

            {/* AI 인사이트 */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">AI 인사이트</h3>
              {report.insights.length > 0 ? (
                <div className="space-y-4">
                  {report.insights.map((insight, index) => (
                    <div key={index} className="border-l-4 border-primary-500 pl-4">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <p className="text-gray-600 mt-1 whitespace-pre-wrap">{insight.content}</p>
                      {insight.recommendations && insight.recommendations.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">추천사항:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {insight.recommendations.map((rec: string, i: number) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        신뢰도: {Math.round(insight.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">아직 AI 인사이트가 없습니다.</p>
                  <button
                    onClick={generateInsight}
                    className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                  >
                    {t('reports.generateInsights')}하기
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">
              {selectedChild ? t('common.loading') : t('reports.selectChild')}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}