'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useTranslation } from '@/hooks/useTranslation'

interface Child {
  _id: string
  name: string
  birthDate: string
  gender: string
}

interface GrowthGuide {
  milestones: Array<{
    category: string
    title: string
    description: string
    achieved: boolean
    expectedTimeframe: string
  }>
  activities: Array<{
    title: string
    description: string
    benefits: string[]
    duration: string
  }>
  nutritionGuide: {
    recommendations: string[]
    portions: string
    schedule: string
  }
  sleepGuide: {
    expectedDuration: string
    schedule: string
    tips: string[]
  }
  developmentFocus: string[]
  nextMonthPreview: string[]
  childInfo: {
    name: string
    age: number
    gender: string
  }
}

export default function GrowthGuidePage() {
  const { isAuthenticated, isHydrated, token } = useAuthStore()
  const router = useRouter()
  const { t } = useTranslation()
  const growthGuide = {
    pageTitle: t('growthGuide.pageTitle'),
    childListError: t('growthGuide.childListError'),
    guideApiError: t('growthGuide.guideApiError'),
    guideLoadError: t('growthGuide.guideLoadError'),
    networkError: t('growthGuide.networkError'),
    growthGuideError: t('growthGuide.growthGuideError'),
    monthGuide: t('growthGuide.monthGuide'),
    aiAnalyzedGuide: t('growthGuide.aiAnalyzedGuide'),
    retry: t('growthGuide.retry'),
    generating: t('growthGuide.generating'),
    developmentFocusTitle: t('growthGuide.developmentFocusTitle'),
    milestonesTitle: t('growthGuide.milestonesTitle'),
    activitiesTitle: t('growthGuide.activitiesTitle'),
    nutritionTitle: t('growthGuide.nutritionTitle'),
    sleepTitle: t('growthGuide.sleepTitle'),
    nextMonthTitle: t('growthGuide.nextMonthTitle'),
    durationLabel: t('growthGuide.durationLabel'),
    effectLabel: t('growthGuide.effectLabel'),
    recommendationsLabel: t('growthGuide.recommendationsLabel'),
    portionsLabel: t('growthGuide.portionsLabel'),
    scheduleLabel: t('growthGuide.scheduleLabel'),
    sleepDurationLabel: t('growthGuide.sleepDurationLabel'),
    sleepScheduleLabel: t('growthGuide.sleepScheduleLabel'),
    sleepTipsLabel: t('growthGuide.sleepTipsLabel'),
    selectChildMessage: t('growthGuide.selectChildMessage'),
    addChildFirst: t('growthGuide.addChildFirst'),
    personalizedGuide: t('growthGuide.personalizedGuide'),
    categories: {
      physical: t('growthGuide.categories.physical'),
      cognitive: t('growthGuide.categories.cognitive'),
      social: t('growthGuide.categories.social'),
      language: t('growthGuide.categories.language'),
      other: t('growthGuide.categories.other')
    }
  }
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [guide, setGuide] = useState<GrowthGuide | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      fetchGuide()
    }
  }, [selectedChild])

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
      console.error(growthGuide.childListError, error)
    }
  }

  const fetchGuide = async () => {
    if (!selectedChild) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/growth-guide?childId=${selectedChild}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      
      if (response.ok) {
        setGuide(data)
      } else {
        console.error(growthGuide.guideApiError, data.error)
        setError(data.error || growthGuide.guideLoadError)
      }
    } catch (error) {
      console.error(growthGuide.growthGuideError, error)
      setError(growthGuide.networkError)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'physical': return '🏃‍♂️'
      case 'cognitive': return '🧠'
      case 'social': return '👥'
      case 'language': return '💬'
      default: return '📈'
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'physical': return growthGuide.categories.physical
      case 'cognitive': return growthGuide.categories.cognitive
      case 'social': return growthGuide.categories.social
      case 'language': return growthGuide.categories.language
      default: return growthGuide.categories.other
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{growthGuide.pageTitle}</h1>
          {children.length > 0 && (
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {children.map((child) => (
                <option key={child._id} value={child._id}>
                  {child.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <LoadingSpinner size="lg" text={growthGuide.generating} className="py-12 lg:py-16" />
        ) : error ? (
          <div className="text-center py-8 lg:py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 lg:p-6 max-w-md mx-auto">
              <p className="text-red-800 mb-4 text-sm lg:text-base">⚠️ {error}</p>
              <button
                onClick={fetchGuide}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm lg:text-base"
              >
                {growthGuide.retry}
              </button>
            </div>
          </div>
        ) : guide ? (
          <div className="space-y-6 lg:space-y-8">
            {/* 아이 정보 헤더 */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg p-4 lg:p-6">
              <h2 className="text-xl lg:text-2xl font-bold mb-2">{guide.childInfo.name}{growthGuide.personalizedGuide} {guide.childInfo.age}{growthGuide.monthGuide}</h2>
              <p className="text-primary-100 text-sm lg:text-base">{growthGuide.aiAnalyzedGuide}</p>
            </div>

            {/* 이번 달 중점 발달 영역 */}
            {guide.developmentFocus.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  {growthGuide.developmentFocusTitle}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  {guide.developmentFocus.map((focus, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4">
                      <p className="text-blue-800 text-sm lg:text-base leading-relaxed">{focus}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 발달 마일스톤 */}
            {guide.milestones.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  {growthGuide.milestonesTitle}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                  {guide.milestones.map((milestone, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 lg:p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-xl lg:text-2xl mr-2">{getCategoryIcon(milestone.category)}</span>
                        <span className="text-xs lg:text-sm text-gray-600">{getCategoryName(milestone.category)}</span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">{milestone.title}</h4>
                      <p className="text-xs lg:text-sm text-gray-600 mb-2 leading-relaxed">{milestone.description}</p>
                      <p className="text-xs text-blue-600">{milestone.expectedTimeframe}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 추천 활동 */}
            {guide.activities.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  {growthGuide.activitiesTitle}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                  {guide.activities.map((activity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 lg:p-4">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">{activity.title}</h4>
                      <p className="text-xs lg:text-sm text-gray-600 mb-3 leading-relaxed">{activity.description}</p>
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-700">{growthGuide.durationLabel}</span>
                        <span className="text-xs text-gray-600">{activity.duration}</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-700">{growthGuide.effectLabel}</span>
                        <ul className="text-xs text-gray-600 mt-1 space-y-1">
                          {activity.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-green-500 mr-1 mt-0.5">•</span>
                              <span className="leading-relaxed">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
              {/* 영양 가이드 */}
              <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  {growthGuide.nutritionTitle}
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">{growthGuide.recommendationsLabel}</h4>
                    <ul className="text-xs lg:text-sm text-gray-600 space-y-1">
                      {guide.nutritionGuide.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2 mt-0.5">•</span>
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">{growthGuide.portionsLabel}</h4>
                    <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">{guide.nutritionGuide.portions}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">{growthGuide.scheduleLabel}</h4>
                    <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">{guide.nutritionGuide.schedule}</p>
                  </div>
                </div>
              </div>

              {/* 수면 가이드 */}
              <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  {growthGuide.sleepTitle}
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">{growthGuide.sleepDurationLabel}</h4>
                    <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">{guide.sleepGuide.expectedDuration}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">{growthGuide.sleepScheduleLabel}</h4>
                    <p className="text-xs lg:text-sm text-gray-600 leading-relaxed">{guide.sleepGuide.schedule}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">{growthGuide.sleepTipsLabel}</h4>
                    <ul className="text-xs lg:text-sm text-gray-600 space-y-1">
                      {guide.sleepGuide.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2 mt-0.5">•</span>
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 다음 달 미리보기 */}
            {guide.nextMonthPreview.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  {growthGuide.nextMonthTitle}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  {guide.nextMonthPreview.map((preview, index) => (
                    <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3 lg:p-4">
                      <p className="text-purple-800 text-sm lg:text-base leading-relaxed">{preview}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 lg:py-12">
            <div className="text-4xl lg:text-6xl mb-4">📚</div>
            <p className="text-gray-500 mb-4 text-sm lg:text-base">{growthGuide.selectChildMessage}</p>
            {children.length === 0 && (
              <p className="text-gray-400 text-xs lg:text-sm">{growthGuide.addChildFirst}</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}