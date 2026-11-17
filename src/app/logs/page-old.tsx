'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import Toast from '@/components/Toast'
import AIAnalysisModal from '@/components/AIAnalysisModal'
import ClientOnly from '@/components/ClientOnly'
import { useToast } from '@/hooks/useToast'

interface Child {
  _id: string
  name: string
  birthDate: string
  gender: string
}

interface GrowthLog {
  _id: string
  childId: string
  type: 'sleep' | 'meal' | 'diaper' | 'activity' | 'milestone' | 'health'
  timestamp: string
  data: any
  notes?: string
  createdAt: string
}

interface SleepData {
  duration?: number
  quality?: string
}

interface MealData {
  mealType?: string
  amount?: number
}

interface ActivityData {
  activityName?: string
}

type LogData = SleepData | MealData | ActivityData | Record<string, any>

function LogsPageContent() {
  const { isAuthenticated, token } = useAuthStore()
  const router = useRouter()
  const { toasts, showSuccess, showError, removeToast } = useToast()
  const [children, setChildren] = useState<Child[]>([])
  const [logs, setLogs] = useState<GrowthLog[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<{
    type: string
    timestamp: string
    data: LogData
    notes: string
  }>({
    type: 'sleep',
    timestamp: new Date().toISOString().slice(0, 16),
    data: {},
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchChildren()
  }, [isAuthenticated, router])

  useEffect(() => {
    if (selectedChild) {
      fetchLogs()
    }
  }, [selectedChild, selectedType])

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
      console.error('아이 목록 조회 오류:', error)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedChild) params.append('childId', selectedChild)
      if (selectedType) params.append('type', selectedType)

      const response = await fetch(`/api/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('성장 기록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      sleep: '수면',
      meal: '식사',
      diaper: '기저귀',
      activity: '활동',
      milestone: '마일스톤',
      health: '건강'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeColor = (type: string) => {
    const colors = {
      sleep: 'bg-blue-100 text-blue-800',
      meal: 'bg-green-100 text-green-800',
      diaper: 'bg-yellow-100 text-yellow-800',
      activity: 'bg-purple-100 text-purple-800',
      milestone: 'bg-pink-100 text-pink-800',
      health: 'bg-red-100 text-red-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const validateForm = () => {
    if (!selectedChild) {
      showError('아이를 선택해주세요.')
      return false
    }

    if (!formData.timestamp) {
      showError('시간을 입력해주세요.')
      return false
    }

    // 타입별 필수 필드 검증
    switch (formData.type) {
      case 'sleep':
        const sleepData = formData.data as SleepData
        if (!sleepData.duration || sleepData.duration <= 0) {
          showError('수면 시간을 입력해주세요.')
          return false
        }
        break
      case 'meal':
        const mealData = formData.data as MealData
        if (!mealData.mealType) {
          showError('식사 종류를 선택해주세요.')
          return false
        }
        if (!mealData.amount || mealData.amount <= 0) {
          showError('양을 입력해주세요.')
          return false
        }
        break
      case 'activity':
        const activityData = formData.data as ActivityData
        if (!activityData.activityName || activityData.activityName.trim() === '') {
          showError('활동 내용을 입력해주세요.')
          return false
        }
        break
    }

    return true
  }

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: selectedChild,
          type: formData.type,
          timestamp: formData.timestamp,
          data: formData.data,
          notes: formData.notes
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setShowAddForm(false)
        setFormData({
          type: 'sleep',
          timestamp: new Date().toISOString().slice(0, 16),
          data: {},
          notes: ''
        })
        showSuccess('기록이 성공적으로 추가되었습니다.')
        fetchLogs() // 목록 새로고침
        
        // AI 분석 결과가 있으면 모달 표시
        if (result.aiAnalysis) {
          setAiAnalysis(result.aiAnalysis)
          setShowAiModal(true)
        }
      } else {
        const error = await response.json()
        showError(error.error || '기록 추가 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('기록 추가 오류:', error)
      showError('기록 추가 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatLogData = (type: string, data: any) => {
    if (!data) {
      return (
        <div className="text-sm text-gray-600">
          세부 정보 없음
        </div>
      )
    }
    
    switch (type) {
      case 'sleep':
        return (
          <div className="text-sm">
            {data.duration && <p>수면 시간: {data.duration}시간</p>}
            {data.quality && <p>수면 품질: {getQualityLabel(data.quality)}</p>}
          </div>
        )
      case 'meal':
        return (
          <div className="text-sm">
            {data.mealType && <p>종류: {getMealTypeLabel(data.mealType)}</p>}
            {data.amount && <p>양: {data.amount}ml/g</p>}
          </div>
        )
      case 'activity':
        return (
          <div className="text-sm">
            {data.activityName && <p>활동: {data.activityName}</p>}
          </div>
        )
      default:
        return (
          <div className="text-sm text-gray-600">
            {data && Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '세부 정보 없음'}
          </div>
        )
    }
  }

  const getQualityLabel = (quality: string) => {
    const labels = {
      very_good: '매우 좋음',
      good: '좋음',
      fair: '보통',
      poor: '나쁨'
    }
    return labels[quality as keyof typeof labels] || quality
  }

  const getMealTypeLabel = (mealType: string) => {
    const labels = {
      breast_milk: '모유',
      formula: '분유',
      baby_food: '이유식',
      solid_food: '고형식'
    }
    return labels[mealType as keyof typeof labels] || mealType
  }

  // AI 도우미 함수들
  const getSuggestedSleepDuration = () => {
    if (!selectedChild) return 8
    
    const child = children.find(c => c._id === selectedChild)
    if (!child) return 8
    
    const ageInMonths = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    
    // 월령별 권장 수면시간
    if (ageInMonths <= 3) return 16
    if (ageInMonths <= 6) return 14
    if (ageInMonths <= 12) return 13
    if (ageInMonths <= 24) return 12
    return 11
  }

  const getSuggestedMealAmount = () => {
    if (!selectedChild) return 120
    
    const child = children.find(c => c._id === selectedChild)
    if (!child) return 120
    
    const ageInMonths = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    
    // 월령별 권장 식사량 (ml/g)
    if (ageInMonths <= 1) return 80
    if (ageInMonths <= 3) return 120
    if (ageInMonths <= 6) return 150
    if (ageInMonths <= 12) return 200
    return 250
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">📝 성장 기록</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-primary-600 text-white px-4 py-3 lg:py-2 rounded-lg hover:bg-primary-700 text-sm lg:text-base transition-colors"
          >
            기록 추가
          </button>
        </div>

        {/* 필터 */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow mb-4 lg:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이 선택
              </label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">아이를 선택하세요</option>
                {children.map((child) => (
                  <option key={child._id} value={child._id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기록 유형
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">전체</option>
                <option value="sleep">수면</option>
                <option value="meal">식사</option>
                <option value="diaper">기저귀</option>
                <option value="activity">활동</option>
                <option value="milestone">마일스톤</option>
                <option value="health">건강</option>
              </select>
            </div>
          </div>
        </div>

        {/* 기록 목록 */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-6 lg:p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-5 lg:h-6 w-5 lg:w-6 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600 text-sm lg:text-base">로딩 중...</p>
            </div>
          ) : logs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {logs.map((log) => (
                <div key={log._id} className="p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(log.type)} self-start`}
                        >
                          {getTypeLabel(log.type)}
                        </span>
                        <span className="text-xs lg:text-sm text-gray-500">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <div className="text-gray-900 text-sm lg:text-base">
                        {formatLogData(log.type, log.data)}
                      </div>
                      {log.notes && (
                        <p className="mt-2 text-xs lg:text-sm text-gray-600 leading-relaxed">{log.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 self-start sm:self-auto">
                      <button className="text-primary-600 hover:text-primary-700 text-xs lg:text-sm px-2 py-1 rounded border border-primary-200 hover:bg-primary-50">
                        수정
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-xs lg:text-sm px-2 py-1 rounded border border-red-200 hover:bg-red-50">
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 lg:p-8 text-center">
              <p className="text-gray-500 text-sm lg:text-base">
                {selectedChild ? '기록이 없습니다. 첫 기록을 추가해보세요!' : '아이를 선택해주세요.'}
              </p>
            </div>
          )}
        </div>

        {/* 기록 추가 모달 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 lg:p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg lg:text-xl font-medium mb-4 lg:mb-6">새 기록 추가</h3>
              
              <form onSubmit={handleSubmitLog} className="space-y-4 lg:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기록 유형
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      updateFormData('type', e.target.value)
                      updateFormData('data', {}) // 타입 변경 시 데이터 초기화
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="sleep">수면</option>
                    <option value="meal">식사</option>
                    <option value="diaper">기저귀</option>
                    <option value="activity">활동</option>
                    <option value="milestone">마일스톤</option>
                    <option value="health">건강</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시간
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.timestamp}
                    onChange={(e) => updateFormData('timestamp', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                {/* 타입별 세부 정보 입력 */}
                {formData.type === 'sleep' && (
                  <div className="space-y-3 lg:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        수면 시간 (시간)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={(formData.data as SleepData).duration || ''}
                          onChange={(e) => updateFormData('data', { ...formData.data, duration: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="예: 8.5"
                        />
                        <div className="absolute right-3 top-3 lg:top-2">
                          <button
                            type="button"
                            onClick={() => {
                              // AI 제안: 월령별 권장 수면시간 자동 입력
                              const suggestedDuration = selectedChild ? getSuggestedSleepDuration() : 8
                              updateFormData('data', { ...formData.data, duration: suggestedDuration })
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded"
                          >
                            💡 제안
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        💡 이 나이 아이의 평균 수면시간: {getSuggestedSleepDuration()}시간
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        수면 품질
                      </label>
                      <select
                        value={(formData.data as SleepData).quality || ''}
                        onChange={(e) => updateFormData('data', { ...formData.data, quality: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="very_good">매우 좋음</option>
                        <option value="good">좋음</option>
                        <option value="fair">보통</option>
                        <option value="poor">나쁨</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.type === 'meal' && (
                  <div className="space-y-3 lg:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        식사 종류
                      </label>
                      <select
                        value={(formData.data as MealData).mealType || ''}
                        onChange={(e) => updateFormData('data', { ...formData.data, mealType: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">선택하세요</option>
                        <option value="breast_milk">모유</option>
                        <option value="formula">분유</option>
                        <option value="baby_food">이유식</option>
                        <option value="solid_food">고형식</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        양 (ml 또는 g)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={(formData.data as MealData).amount || ''}
                          onChange={(e) => updateFormData('data', { ...formData.data, amount: parseInt(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="예: 120"
                        />
                        <div className="absolute right-3 top-3 lg:top-2">
                          <button
                            type="button"
                            onClick={() => {
                              const suggestedAmount = getSuggestedMealAmount()
                              updateFormData('data', { ...formData.data, amount: suggestedAmount })
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded"
                          >
                            💡 제안
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        💡 이 나이 아이의 권장량: {getSuggestedMealAmount()}ml/g
                      </p>
                    </div>
                  </div>
                )}

                {formData.type === 'activity' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      활동 내용
                    </label>
                    <input
                      type="text"
                      value={(formData.data as ActivityData).activityName || ''}
                      onChange={(e) => updateFormData('data', { ...formData.data, activityName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="예: 놀이, 산책, 목욕 등"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메모
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                    placeholder="추가 메모나 관찰 사항"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 lg:pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="w-full sm:flex-1 bg-gray-300 text-gray-700 px-4 py-3 lg:py-2 rounded-lg hover:bg-gray-400 text-base lg:text-sm transition-colors"
                    disabled={submitting}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:flex-1 bg-primary-600 text-white px-4 py-3 lg:py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-base lg:text-sm transition-colors"
                  >
                    {submitting ? '저장 중...' : '저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* AI 분석 결과 모달 */}
        {showAiModal && aiAnalysis && (
          <AIAnalysisModal
            analysis={aiAnalysis}
            onClose={() => {
              setShowAiModal(false)
              setAiAnalysis(null)
            }}
          />
        )}

        {/* 토스트 알림 */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </Layout>
  )
}

export default function LogsPage() {
  return (
    <ClientOnly fallback={
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </Layout>
    }>
      <LogsPageContent />
    </ClientOnly>
  )
}