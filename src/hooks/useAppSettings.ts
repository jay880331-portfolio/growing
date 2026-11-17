import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface AppSettings {
  showSubscriptionFeatures: boolean
  showCounselorFeatures: boolean
  showAICoachFeatures: boolean
  isUnderAppStoreReview: boolean
  appStoreReviewMode: {
    hideSubscription: boolean
    hidePremiumFeatures: boolean
    hidePaymentRelated: boolean
    customMessage: string
  }
  features: {
    subscription: boolean
    counselor: boolean
    aiCoach: boolean
    quest: boolean
    growthGuide: boolean
    reports: boolean
    healthAlerts: boolean
  }
}

export function useAppSettings() {
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const { token, isAuthenticated, isHydrated } = useAuthStore()

  useEffect(() => {
    // hydration이 완료된 후에만 실행
    if (!isHydrated) return
    
    fetchAppSettings()
  }, [isHydrated, token])

  const fetchAppSettings = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch('/api/admin/app-settings', {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📱 앱 설정 로드됨:', data.settings)
        setAppSettings(data.settings)
      } else {
        console.error('앱 설정 로드 실패:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('앱 설정 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 기능이 활성화되어 있는지 확인하는 헬퍼 함수들
  const isFeatureEnabled = (feature: keyof AppSettings['features']): boolean => {
    // 로딩 중일 때는 보수적으로 처리
    if (loading) {
      // 구독과 상담사만 기본적으로 숨김, 나머지는 표시
      return !(feature === 'subscription' || feature === 'counselor')
    }
    
    // 설정이 없으면 기본값 사용
    if (!appSettings) {
      // 구독과 상담사는 숨김, 나머지는 표시
      return !(feature === 'subscription' || feature === 'counselor')
    }
    
    // 앱스토어 심사 모드일 때 추가 체크
    if (appSettings.isUnderAppStoreReview) {
      if (feature === 'subscription' && appSettings.appStoreReviewMode.hideSubscription) {
        return false
      }
      if (feature === 'counselor' && appSettings.appStoreReviewMode.hidePremiumFeatures) {
        return false
      }
    }
    
    return appSettings.features[feature]
  }

  const shouldHideSubscription = (): boolean => {
    if (loading) return true // 로딩 중이면 숨김
    if (!appSettings) return true // 설정 없으면 숨김
    const result = appSettings.isUnderAppStoreReview && appSettings.appStoreReviewMode.hideSubscription
    console.log('🔍 shouldHideSubscription:', { loading, hasSettings: !!appSettings, isUnderReview: appSettings?.isUnderAppStoreReview, hideSubscription: appSettings?.appStoreReviewMode?.hideSubscription, result })
    return result
  }

  const shouldHidePremiumFeatures = (): boolean => {
    if (loading) return false // 로딩 중에는 기본적으로 보임
    if (!appSettings) return false // 설정 없으면 기본적으로 보임
    return appSettings.isUnderAppStoreReview && appSettings.appStoreReviewMode.hidePremiumFeatures
  }

  const shouldHidePaymentRelated = (): boolean => {
    if (loading) return true // 로딩 중이면 숨김
    if (!appSettings) return true // 설정 없으면 숨김
    return appSettings.isUnderAppStoreReview && appSettings.appStoreReviewMode.hidePaymentRelated
  }

  const shouldHideCounselor = (): boolean => {
    if (loading) return true // 로딩 중이면 숨김
    if (!appSettings) return true // 설정 없으면 숨김
    const result = appSettings.isUnderAppStoreReview && (
      appSettings.appStoreReviewMode.hidePremiumFeatures || 
      !appSettings.features.counselor
    )
    console.log('🔍 shouldHideCounselor:', { loading, hasSettings: !!appSettings, isUnderReview: appSettings?.isUnderAppStoreReview, hidePremium: appSettings?.appStoreReviewMode?.hidePremiumFeatures, counselorEnabled: appSettings?.features?.counselor, result })
    return result
  }

  const getCustomMessage = (): string => {
    if (!appSettings || !appSettings.isUnderAppStoreReview) return ''
    return appSettings.appStoreReviewMode.customMessage || ''
  }

  return {
    appSettings,
    loading,
    isFeatureEnabled,
    shouldHideSubscription,
    shouldHidePremiumFeatures,
    shouldHidePaymentRelated,
    shouldHideCounselor,
    getCustomMessage,
    refresh: fetchAppSettings
  }
}