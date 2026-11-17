'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface UserData {
  _id: string
  email: string
  name: string
  userType: 'parent' | 'counselor' | 'admin'
  aiUsage: {
    monthlyUsed: number
    monthlyLimit: number
    plan: string
  }
  subscription: {
    plan: string
    status: string
  }
  createdAt: string
}

export default function AdminUsers() {
  const { isAuthenticated, isHydrated, token, user } = useAuthStore()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'parent' | 'counselor' | 'admin'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isHydrated) return
    
    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchUsers()
  }, [isAuthenticated, isHydrated, user, router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserType = async (userId: string, newUserType: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType: newUserType
        }),
      })

      if (response.ok) {
        alert('사용자 권한이 업데이트되었습니다.')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || '업데이트 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('사용자 권한 업데이트 오류:', error)
      alert('업데이트 중 오류가 발생했습니다.')
    }
  }

  const resetUserUsage = async (userId: string) => {
    if (!confirm('이 사용자의 AI 사용량을 리셋하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-usage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert('AI 사용량이 리셋되었습니다.')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || '리셋 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('사용량 리셋 오류:', error)
      alert('리셋 중 오류가 발생했습니다.')
    }
  }

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">관리자</span>
      case 'counselor':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">상담사</span>
      case 'parent':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">부모</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">{userType}</span>
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.userType === filter
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
            <p className="text-gray-600">시스템 사용자 계정 및 권한 관리</p>
          </div>
          <Link
            href="/admin"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            관리자 홈
          </Link>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'parent', label: '부모' },
              { key: 'counselor', label: '상담사' },
              { key: 'admin', label: '관리자' }
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
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    권한
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI 사용량
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    구독
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userData) => (
                  <tr key={userData._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                        <div className="text-sm text-gray-500">{userData.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUserTypeBadge(userData.userType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {userData.aiUsage?.monthlyUsed || 0} / {userData.aiUsage?.monthlyLimit || 100}
                      </div>
                      <div className="text-sm text-gray-500">{userData.aiUsage?.plan || 'free'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{userData.subscription?.plan || 'free'}</div>
                      <div className="text-sm text-gray-500">{userData.subscription?.status || 'active'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userData.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <select
                          value={userData.userType}
                          onChange={(e) => updateUserType(userData._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="parent">부모</option>
                          <option value="counselor">상담사</option>
                          <option value="admin">관리자</option>
                        </select>
                        <button
                          onClick={() => resetUserUsage(userData._id)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          사용량 리셋
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 통계 요약 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            <div className="text-sm text-gray-600">총 사용자</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.userType === 'parent').length}
            </div>
            <div className="text-sm text-gray-600">부모 사용자</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.userType === 'counselor').length}
            </div>
            <div className="text-sm text-gray-600">상담사</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.userType === 'admin').length}
            </div>
            <div className="text-sm text-gray-600">관리자</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}