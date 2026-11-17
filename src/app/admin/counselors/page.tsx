'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface CounselorForAdmin {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  bio: string
  specialties: string[]
  certifications: Array<{
    name: string
    issuer: string
    date: string
  }>
  experience: {
    years: number
    description: string
  }
  pricing: {
    pricePerHour: number
  }
  rating: {
    average: number
    count: number
  }
  isVerified: boolean
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
}

export default function AdminCounselors() {
  const { isAuthenticated, isHydrated, token, user } = useAuthStore()
  const router = useRouter()
  const [counselors, setCounselors] = useState<CounselorForAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all')
  const [selectedCounselor, setSelectedCounselor] = useState<CounselorForAdmin | null>(null)

  useEffect(() => {
    if (!isHydrated) return
    
    if (!isAuthenticated || user?.userType !== 'admin') {
      router.push('/dashboard')
      return
    }

    fetchCounselors()
  }, [isAuthenticated, isHydrated, user, router, filter])

  const fetchCounselors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        if (filter === 'pending') {
          params.append('status', 'inactive')
          params.append('verified', 'false')
        } else {
          params.append('status', filter)
        }
      }

      const response = await fetch(`/api/admin/counselors?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setCounselors(data.counselors)
      }
    } catch (error) {
      console.error('상담사 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCounselorStatus = async (counselorId: string, status: string, isVerified?: boolean) => {
    try {
      const response = await fetch(`/api/admin/counselors/${counselorId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          isVerified
        }),
      })

      if (response.ok) {
        alert('상담사 상태가 업데이트되었습니다.')
        fetchCounselors()
        setSelectedCounselor(null)
      } else {
        const error = await response.json()
        alert(error.error || '업데이트 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('상담사 상태 업데이트 오류:', error)
      alert('업데이트 중 오류가 발생했습니다.')
    }
  }

  const getStatusBadge = (counselor: CounselorForAdmin) => {
    if (counselor.status === 'inactive' && !counselor.isVerified) {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">승인 대기</span>
    } else if (counselor.status === 'active' && counselor.isVerified) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">활성</span>
    } else if (counselor.status === 'suspended') {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">정지</span>
    } else {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">비활성</span>
    }
  }

  const getSpecialtyLabel = (specialty: string) => {
    const labels: Record<string, string> = {
      'newborn': '신생아',
      'infant': '영아',
      'toddler': '유아',
      'preschool': '미취학',
      'school-age': '학령기',
      'adolescent': '청소년',
      'development': '발달',
      'nutrition': '영양',
      'sleep': '수면',
      'behavior': '행동',
      'special-needs': '특수아동'
    }
    return labels[specialty] || specialty
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">상담사 관리</h1>
            <p className="text-gray-600">상담사 승인 및 관리</p>
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
              { key: 'pending', label: '승인 대기' },
              { key: 'active', label: '활성' },
              { key: 'suspended', label: '정지' }
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
                      상담사 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전문분야
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      경력
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상담료
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
                  {counselors.map((counselor) => (
                    <tr key={counselor._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {counselor.userId.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {counselor.userId.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            등록일: {new Date(counselor.createdAt).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {counselor.specialties.slice(0, 2).map((specialty) => (
                            <span
                              key={specialty}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                            >
                              {getSpecialtyLabel(specialty)}
                            </span>
                          ))}
                          {counselor.specialties.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{counselor.specialties.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {counselor.experience.years}년
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₩{counselor.pricing.pricePerHour.toLocaleString()}/시간
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(counselor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedCounselor(counselor)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 상세보기 모달 */}
        {selectedCounselor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">상담사 상세 정보</h3>
                  <button
                    onClick={() => setSelectedCounselor(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">기본 정보</h4>
                    <p><strong>이름:</strong> {selectedCounselor.userId.name}</p>
                    <p><strong>이메일:</strong> {selectedCounselor.userId.email}</p>
                    <p><strong>경력:</strong> {selectedCounselor.experience.years}년</p>
                    <p><strong>상담료:</strong> ₩{selectedCounselor.pricing.pricePerHour.toLocaleString()}/시간</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">자기소개</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedCounselor.bio}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">전문분야</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCounselor.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {getSpecialtyLabel(specialty)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">자격증</h4>
                    {selectedCounselor.certifications.map((cert, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <p><strong>{cert.name}</strong> - {cert.issuer} ({new Date(cert.date).getFullYear()})</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">경력 설명</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedCounselor.experience.description}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                  {selectedCounselor.status === 'inactive' && !selectedCounselor.isVerified && (
                    <>
                      <button
                        onClick={() => updateCounselorStatus(selectedCounselor._id, 'active', true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => updateCounselorStatus(selectedCounselor._id, 'suspended', false)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        거부
                      </button>
                    </>
                  )}
                  {selectedCounselor.status === 'active' && (
                    <button
                      onClick={() => updateCounselorStatus(selectedCounselor._id, 'suspended', false)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      정지
                    </button>
                  )}
                  {selectedCounselor.status === 'suspended' && (
                    <button
                      onClick={() => updateCounselorStatus(selectedCounselor._id, 'active', true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      정지 해제
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCounselor(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}