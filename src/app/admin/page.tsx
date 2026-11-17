'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

interface AdminStats {
  totalUsers: number
  totalCounselors: number
  pendingCounselors: number
  activeCounselors: number
  totalChildren: number
  totalLogs: number
  aiUsageToday: number
  aiUsageMonth: number
}

export default function AdminDashboard() {
  const { isAuthenticated, isHydrated, token, user } = useAuthStore()
  const router = useRouter()
  const { t } = useTranslation()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isHydrated) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.userType !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchStats()
  }, [isAuthenticated, isHydrated, user, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error(t('admin.dashboard.statsError'), error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">{t('admin.dashboard.loading')}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin.dashboard.title')}</h1>
          <p className="text-gray-600">{t('admin.dashboard.subtitle')}</p>
        </div>

        {/* 전체 통계 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('admin.stats.totalUsers')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🩺</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('admin.stats.activeCounselors')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeCounselors}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">⏳</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('admin.stats.pendingApproval')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pendingCounselors}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('admin.stats.monthlyAIUsage')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.aiUsageMonth.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 관리 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            href="/admin/counselors"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🩺</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.menu.counselorManagement.title')}</h3>
              <p className="text-sm text-gray-600">{t('admin.menu.counselorManagement.description')}</p>
              {stats && stats.pendingCounselors > 0 && (
                <span className="inline-block mt-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {stats.pendingCounselors}{t('admin.menu.counselorManagement.pendingCount')}
                </span>
              )}
            </div>
          </Link>

          <Link 
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.menu.userManagement.title')}</h3>
              <p className="text-sm text-gray-600">{t('admin.menu.userManagement.description')}</p>
            </div>
          </Link>

          <Link 
            href="/admin/ai-usage"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.menu.aiUsageManagement.title')}</h3>
              <p className="text-sm text-gray-600">{t('admin.menu.aiUsageManagement.description')}</p>
            </div>
          </Link>

          <Link 
            href="/admin/system"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.menu.systemSettings.title')}</h3>
              <p className="text-sm text-gray-600">{t('admin.menu.systemSettings.description')}</p>
            </div>
          </Link>

          <Link 
            href="/admin/reports"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.menu.reports.title')}</h3>
              <p className="text-sm text-gray-600">{t('admin.menu.reports.description')}</p>
            </div>
          </Link>

          <Link 
            href="/admin/upgrade-requests"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.menu.upgradeRequests.title')}</h3>
              <p className="text-sm text-gray-600">{t('admin.menu.upgradeRequests.description')}</p>
            </div>
          </Link>

          <Link 
            href="/admin/audit"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('admin.menu.auditLog.title')}</h3>
              <p className="text-sm text-gray-600">{t('admin.menu.auditLog.description')}</p>
            </div>
          </Link>
        </div>

        {/* 최근 활동 */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{t('admin.recentActivity.title')}</h3>
          </div>
          <div className="p-6">
            <div className="text-sm text-gray-600">
              <p>• {t('admin.recentActivity.pendingCounselors')}: {stats?.pendingCounselors || 0}{t('admin.recentActivity.unit.cases')}</p>
              <p>• {t('admin.recentActivity.todayAIUsage')}: {stats?.aiUsageToday || 0}{t('admin.recentActivity.unit.times')}</p>
              <p>• {t('admin.recentActivity.totalChildren')}: {stats?.totalChildren || 0}{t('admin.recentActivity.unit.children')}</p>
              <p>• {t('admin.recentActivity.totalLogs')}: {stats?.totalLogs || 0}{t('admin.recentActivity.unit.records')}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}