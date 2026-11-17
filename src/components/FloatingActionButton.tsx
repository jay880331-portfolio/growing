'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FloatingActionButtonProps {
  childId?: string
}

export default function FloatingActionButton({ childId }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const actions = [
    { icon: '😴', label: '수면', type: 'sleep', color: 'bg-blue-500' },
    { icon: '🍼', label: '식사', type: 'meal', color: 'bg-green-500' },
    { icon: '🚼', label: '기저귀', type: 'diaper', color: 'bg-yellow-500' },
    { icon: '🎯', label: '활동', type: 'activity', color: 'bg-purple-500' },
    { icon: '🏃', label: '마일스톤', type: 'milestone', color: 'bg-pink-500' },
    { icon: '🏥', label: '건강', type: 'health', color: 'bg-red-500' },
  ]

  const handleActionClick = (type: string) => {
    // 로그 페이지로 이동하면서 타입 파라미터 전달
    router.push(`/logs?type=${type}&childId=${childId || ''}`)
    setIsOpen(false)
  }

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 플로팅 액션 버튼 */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* 액션 메뉴 */}
        <div className={`absolute bottom-16 right-0 transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
        }`}>
          {actions.map((action, index) => (
            <div
              key={action.type}
              className={`flex items-center justify-end mb-3 transition-all duration-300 ${
                isOpen ? 'translate-y-0' : 'translate-y-8'
              }`}
              style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
            >
              <span className="mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {action.label}
              </span>
              <button
                onClick={() => handleActionClick(action.type)}
                className={`w-12 h-12 ${action.color} rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform`}
              >
                <span className="text-xl">{action.icon}</span>
              </button>
            </div>
          ))}
        </div>

        {/* 메인 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 bg-primary-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-primary-700 transition-all duration-300 ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </>
  )
}