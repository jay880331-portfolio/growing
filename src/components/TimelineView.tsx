'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface TimelineLog {
  _id: string
  type: string
  timestamp: string
  data: any
  notes?: string
}

interface TimelineViewProps {
  logs: TimelineLog[]
  onLogClick?: (log: TimelineLog) => void
  onEdit?: (log: TimelineLog) => void
  onDelete?: (logId: string) => void
}

export default function TimelineView({ logs, onLogClick, onEdit, onDelete }: TimelineViewProps) {
  const { locale } = useTranslation()
  const [showMenu, setShowMenu] = useState<string | null>(null)
  
  // 로그를 시간순으로 정렬하고 24시간 타임라인에 배치
  const timelineData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 24시간을 2시간 간격으로 나누기 (12개 구간)
    const timeSlots = []
    for (let hour = 0; hour < 24; hour += 2) {
      const slotStart = new Date(today)
      slotStart.setHours(hour)
      const slotEnd = new Date(today)
      slotEnd.setHours(hour + 2)
      
      timeSlots.push({
        start: slotStart,
        end: slotEnd,
        label: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 2).toString().padStart(2, '0')}:00`,
        logs: logs.filter(log => {
          const logTime = new Date(log.timestamp)
          return logTime >= slotStart && logTime < slotEnd
        })
      })
    }
    
    return timeSlots
  }, [logs])

  const getLogIcon = (type: string) => {
    const icons = {
      sleep: '😴',
      meal: '🍼',
      diaper: '🚼',
      activity: '🎯',
      milestone: '🏃',
      health: '🏥'
    }
    return icons[type as keyof typeof icons] || '📝'
  }

  const getLogColor = (type: string) => {
    const colors = {
      sleep: 'bg-blue-100 border-blue-300 text-blue-800',
      meal: 'bg-green-100 border-green-300 text-green-800',
      diaper: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      activity: 'bg-purple-100 border-purple-300 text-purple-800',
      milestone: 'bg-pink-100 border-pink-300 text-pink-800',
      health: 'bg-red-100 border-red-300 text-red-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 border-gray-300 text-gray-800'
  }

  const formatLogData = (type: string, data: any) => {
    switch (type) {
      case 'sleep':
        return data.duration ? `${data.duration}시간` : '수면'
      case 'meal':
        return data.amount ? `${data.amount}ml` : '식사'
      case 'diaper':
        return data.type === 'wet' ? '소변' : data.type === 'dirty' ? '대변' : '기저귀'
      case 'activity':
        return data.activityName || '활동'
      default:
        return '기록'
    }
  }

  const getCurrentTimePosition = () => {
    const now = new Date()
    const hours = now.getHours() + now.getMinutes() / 60
    return (hours / 24) * 100
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* 헤더 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">📊 오늘의 타임라인</h3>
          <span className="text-xs text-gray-500">
            {new Date().toLocaleDateString(locale)}
          </span>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="p-4">
        <div className="relative">
          {/* 현재 시간 표시선 */}
          <div 
            className="absolute top-0 w-0.5 bg-red-400 z-10"
            style={{
              left: `${getCurrentTimePosition()}%`,
              height: '100%'
            }}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-400 rounded-full"></div>
            <div className="absolute -top-6 -left-8 text-xs text-red-600 font-medium whitespace-nowrap">
              현재
            </div>
          </div>

          {/* 시간 구간들 */}
          <div className="space-y-4">
            {timelineData.map((slot, index) => (
              <div key={index} className="relative">
                {/* 시간 라벨 */}
                <div className="flex items-center mb-2">
                  <div className="w-20 text-xs text-gray-500 font-medium">
                    {slot.start.getHours().toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 h-px bg-gray-200 ml-2"></div>
                </div>

                {/* 로그들 */}
                <div className="ml-24 space-y-2">
                  {slot.logs.length > 0 ? (
                    slot.logs.map((log) => (
                      <div
                        key={log._id}
                        className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer hover:scale-105 transition-transform ${getLogColor(log.type)}`}
                      >
                        <div onClick={() => onLogClick?.(log)} className="flex items-center gap-2 flex-1">
                          <span className="text-base">{getLogIcon(log.type)}</span>
                          <div className="text-xs">
                            <div className="font-medium">
                              {new Date(log.timestamp).toLocaleTimeString(locale, {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div>{formatLogData(log.type, log.data)}</div>
                          </div>
                        </div>
                        
                        {/* 수정/삭제 메뉴 버튼 */}
                        {(onEdit || onDelete) && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(showMenu === log._id ? null : log._id)
                              }}
                              className="p-1 rounded hover:bg-gray-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            
                            {/* 드롭다운 메뉴 */}
                            {showMenu === log._id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg z-20 border">
                                {onEdit && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onEdit(log)
                                      setShowMenu(null)
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    수정
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm('정말 삭제하시겠습니까?')) {
                                        onDelete(log._id)
                                        setShowMenu(null)
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    삭제
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 py-2">
                      기록 없음
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {logs.filter(log => log.type === 'sleep').length}
              </div>
              <div className="text-xs text-gray-600">수면</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(log => log.type === 'meal').length}
              </div>
              <div className="text-xs text-gray-600">식사</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.type === 'diaper').length}
              </div>
              <div className="text-xs text-gray-600">기저귀</div>
            </div>
          </div>
        </div>

        {/* AI 패턴 분석 */}
        {logs.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">🤖</span>
              <span className="text-sm font-medium text-blue-800">AI 패턴 분석</span>
            </div>
            <div className="text-xs text-blue-700">
              {/* 간단한 패턴 분석 */}
              {logs.filter(log => log.type === 'meal').length >= 6 ? 
                "오늘은 규칙적으로 식사를 하고 있어요! 👍" :
                "식사 간격을 좀 더 규칙적으로 해보세요."
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}