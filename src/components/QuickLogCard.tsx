'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useTranslation } from '@/hooks/useTranslation'
import { getRecordsByAge, getAgeGroupInfo } from '@/utils/ageBasedRecords'

interface QuickLogCardProps {
  childId: string
  onLogAdded?: () => void
}

interface QuickLogData {
  type: string
  data: any
  notes?: string
}

export default function QuickLogCard({ childId, onLogAdded }: QuickLogCardProps) {
  const { token } = useAuthStore()
  const { t, locale } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [childAge, setChildAge] = useState<number>(0)
  const [quickActions, setQuickActions] = useState<any[]>([])

  // Fetch child information
  useEffect(() => {
    if (childId) {
      fetchChildInfo()
    }
  }, [childId])

  const fetchChildInfo = async () => {
    try {
      const response = await fetch('/api/children', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        const child = data.children.find((c: any) => c._id === childId)
        if (child) {
          const age = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
          setChildAge(age)
          
          // 성장기록과 동일한 월령별 카테고리 사용
          const ageBasedRecords = getRecordsByAge(age)
          const quickActionList = ageBasedRecords.slice(0, 4).map(record => {
            // 첫 번째 퀵액션을 기본값으로 사용
            const defaultAction = record.quickActions[0]
            return {
              type: record.type,
              icon: record.icon,
              label: record.label,
              color: `${record.bgColor} hover:opacity-80`,
              textColor: record.color,
              defaultData: defaultAction ? defaultAction.data : {}
            }
          })
          setQuickActions(quickActionList)
        }
      }
    } catch (error) {
      console.error('Error fetching child info:', error)
    }
  }

  const handleQuickLog = async (action: any) => {
    if (isSubmitting || !childId) return

    setIsSubmitting(true)
    try {
      const logData: QuickLogData = {
        type: action.type,
        data: action.defaultData,
        notes: `${t('quickRecord.quickLogPrefix')}: ${action.label}`
      }

      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId,
          type: logData.type,
          timestamp: new Date().toISOString(),
          data: logData.data,
          notes: logData.notes
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // 최근 기록에 추가
        setRecentLogs(prev => [result.log, ...prev.slice(0, 2)])
        
        // 성공 피드백
        showSuccessFeedback(action.label)
        
        // 상위 컴포넌트에 알림
        if (onLogAdded) {
          onLogAdded()
        }
      } else {
        throw new Error(t('quickRecord.addRecordFailed'))
      }
    } catch (error) {
      console.error('Quick log error:', error)
      showErrorFeedback()
    } finally {
      setIsSubmitting(false)
    }
  }

  const showSuccessFeedback = (label: string) => {
    // 간단한 성공 피드백
    const button = document.querySelector(`[data-type="${label}"]`)
    if (button) {
      button.classList.add('animate-bounce')
      setTimeout(() => {
        button.classList.remove('animate-bounce')
      }, 1000)
    }
  }

  const showErrorFeedback = () => {
    // 에러 피드백 (예: 빨간색 깜빡임)
    console.log(t('quickRecord.addRecordError'))
  }

  const formatLogTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return t('quickRecord.justNow')
    if (diffMinutes < 60) return `${diffMinutes}${t('quickRecord.minutesAgo')}`
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">⚡ {t('quickRecord.title')}</h3>
        <span className="text-xs text-gray-500">{t('quickRecord.tapToRecord')}</span>
      </div>

      {/* 퀵 액션 버튼들 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {quickActions.length === 0 ? (
          // 로딩 상태
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-100 p-3 rounded-lg h-20 flex flex-col items-center justify-center animate-pulse"
            >
              <div className="w-6 h-6 bg-gray-300 rounded mb-2"></div>
              <div className="w-12 h-3 bg-gray-300 rounded"></div>
            </div>
          ))
        ) : (
          quickActions.map((action) => (
          <button
            key={action.type}
            data-type={action.label}
            onClick={() => handleQuickLog(action)}
            disabled={isSubmitting || !childId}
            className={`${action.color} ${action.textColor} p-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center h-20`}
          >
            <span className="text-2xl mb-1">{action.icon}</span>
            <span className="text-xs font-medium">{action.label}</span>
            {isSubmitting && (
              <div className="mt-1">
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
          ))
        )}
      </div>

      {/* 최근 기록들 */}
      {recentLogs.length > 0 && (
        <div className="border-t pt-3">
          <h4 className="text-xs font-medium text-gray-700 mb-2">{t('quickRecord.recentActivity')}</h4>
          <div className="space-y-2">
            {recentLogs.map((log, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {quickActions.find(a => a.type === log.type)?.icon || '📝'}
                  </span>
                  <span className="text-gray-600">{log.notes}</span>
                </div>
                <span className="text-gray-400">
                  {formatLogTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!childId && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">{t('logs.selectChildPlaceholder')}</p>
        </div>
      )}
    </div>
  )
}