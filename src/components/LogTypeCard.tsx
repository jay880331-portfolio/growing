'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface LogTypeCardProps {
  type: string
  icon: string
  label: string
  color: string
  bgColor: string
  isExpanded: boolean
  onToggle: () => void
  onQuickLog: (data: any) => void
  onDetailForm?: (type: string) => void
  childAge?: number
  quickActions?: Array<{
    label: string
    data: any
    action: string
  }>
}

export default function LogTypeCard({
  type,
  icon,
  label,
  color,
  bgColor,
  isExpanded,
  onToggle,
  onQuickLog,
  onDetailForm,
  childAge = 6,
  quickActions = []
}: LogTypeCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useTranslation()

  // 베이비타임 스타일 퀵 액션들 (fallback)
  const getFallbackQuickActions = () => {
    switch (type) {
      case 'sleep':
        return [
          { label: '낮잠 시작', data: { duration: 0, quality: 'good', isNap: true }, action: 'start' as const },
          { label: '밤잠 시작', data: { duration: 0, quality: 'good', isNap: false }, action: 'start' as const },
          { label: `${getRecommendedSleep()}시간`, data: { duration: getRecommendedSleep(), quality: 'good' }, action: 'complete' as const }
        ]
      case 'meal':
      case 'feeding':
        return [
          { label: '모유', data: { mealType: 'breast_milk', amount: getRecommendedMeal() }, action: 'complete' as const },
          { label: '분유', data: { mealType: 'formula', amount: getRecommendedMeal() }, action: 'complete' as const },
          { label: '이유식', data: { mealType: 'baby_food', amount: getRecommendedMeal() }, action: 'complete' as const }
        ]
      case 'diaper':
        return [
          { label: '소변', data: { type: 'wet', condition: 'normal' }, action: 'complete' as const },
          { label: '대변', data: { type: 'dirty', condition: 'normal' }, action: 'complete' as const },
          { label: '혼합', data: { type: 'mixed', condition: 'normal' }, action: 'complete' as const }
        ]
      case 'activity':
      case 'play':
        return [
          { label: '놀이', data: { activityName: '놀이', duration: 30 }, action: 'complete' as const },
          { label: '산책', data: { activityName: '산책', duration: 20 }, action: 'complete' as const },
          { label: '목욕', data: { activityName: '목욕', duration: 15 }, action: 'complete' as const }
        ]
      case 'health':
        return [
          { label: '체온 측정', data: { temperature: 36.5, unit: '°C' }, action: 'complete' as const },
          { label: '약 복용', data: { medication: '해열제', dosage: '1회' }, action: 'complete' as const }
        ]
      default:
        return [
          { label: '기록', data: { note: '기본 기록' }, action: 'complete' as const }
        ]
    }
  }

  const getRecommendedSleep = () => {
    if (childAge <= 3) return 16
    if (childAge <= 6) return 14
    if (childAge <= 12) return 13
    return 11
  }

  const getRecommendedMeal = () => {
    if (childAge <= 1) return 80
    if (childAge <= 3) return 120
    if (childAge <= 6) return 150
    if (childAge <= 12) return 200
    return 250
  }

  const handleQuickAction = async (action: any) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onQuickLog({
        type,
        data: action.data,
        notes: `퀵 로그: ${action.label}`,
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const actionsToUse = quickActions.length > 0 ? quickActions : getFallbackQuickActions()

  return (
    <div className={`${bgColor} rounded-xl border-2 border-transparent hover:border-primary-200 transition-all duration-300 ${
      isExpanded ? 'ring-2 ring-primary-400' : ''
    }`}>
      {/* 카드 헤더 - 클릭하여 토글 */}
      <div 
        onClick={onToggle}
        className="p-4 cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">{icon}</div>
          <div>
            <h3 className={`font-semibold ${color}`}>{label}</h3>
            <p className="text-xs text-gray-600">{t('ageGroups.recordTypes.quickRecord')}</p>
          </div>
        </div>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 확장된 퀵 액션 영역 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="grid grid-cols-1 gap-2 mt-3">
            {actionsToUse.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                disabled={isSubmitting}
                className={`${color.replace('text-', 'bg-').replace('-800', '-100')} ${color.replace('-800', '-700')} 
                  p-3 rounded-lg text-sm font-medium transition-all duration-200 
                  hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-between`}
              >
                <span>{action.label}</span>
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          
          {/* 상세 입력 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onDetailForm) {
                onDetailForm(type)
              }
            }}
            className="w-full mt-3 bg-white border-2 border-dashed border-gray-300 text-gray-600 p-2 rounded-lg text-sm hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            📝 상세 입력하기
          </button>
        </div>
      )}
    </div>
  )
}