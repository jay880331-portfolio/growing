'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import Layout from '@/components/Layout'

interface Child {
  _id: string
  name: string
  birthDate: string
  gender: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AICoachPage() {
  const { isAuthenticated, isHydrated, token } = useAuthStore()
  const { t, common, locale } = useTranslation()
  const aiCoach = {
    title: t('aiCoach.title'),
    initialGreeting: t('aiCoach.initialGreeting'),
    chatHistory: t('aiCoach.chatHistory'),
    startNewChat: t('aiCoach.startNewChat'),
    generalConsult: t('aiCoach.generalConsult'),
    childConsult: t('aiCoach.childConsult'),
    description: t('aiCoach.description'),
    errorMessage: t('aiCoach.errorMessage'),
    fallbackMessage: t('aiCoach.fallbackMessage'),
    send: t('aiCoach.send'),
    inputPlaceholder: t('aiCoach.inputPlaceholder'),
    suggestedQuestions: t('aiCoach.suggestedQuestions'),
    question1: t('aiCoach.question1'),
    question2: t('aiCoach.question2'),
    question3: t('aiCoach.question3'),
    question4: t('aiCoach.question4'),
    deeperConsultTitle: t('aiCoach.deeperConsultTitle'),
    deeperConsultDesc: t('aiCoach.deeperConsultDesc'),
    viewCounselors: t('aiCoach.viewCounselors'),
    aiConsultNotice: t('aiCoach.aiConsultNotice'),
    aiConsultWarning: t('aiCoach.aiConsultWarning'),
    usageLimitTitle: t('aiCoach.usageLimitTitle'),
    usageLimitMessage: t('aiCoach.usageLimitMessage'),
    currentPlan: t('aiCoach.currentPlan'),
    usage: t('aiCoach.usage'),
    resetDate: t('aiCoach.resetDate'),
    premiumPlan: t('aiCoach.premiumPlan'),
    premiumPrice: t('aiCoach.premiumPrice'),
    premiumFeature1: t('aiCoach.premiumFeature1'),
    premiumFeature2: t('aiCoach.premiumFeature2'),
    premiumFeature3: t('aiCoach.premiumFeature3'),
    upgradeButton: t('aiCoach.upgradeButton'),
    closeModal: t('aiCoach.closeModal'),
    noTitle: t('aiCoach.noTitle'),
    noHistory: t('aiCoach.noHistory'),
    usageError: t('aiCoach.usageError'),
    childListError: t('aiCoach.childListError'),
    conversationListError: t('aiCoach.conversationListError'),
    conversationLoadError: t('aiCoach.conversationLoadError'),
    aiChatError: t('aiCoach.aiChatError'),
    usageLimitError: t('aiCoach.usageLimitError'),
    hardcodedGreeting: t('aiCoach.hardcodedGreeting')
  }
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: aiCoach.initialGreeting,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [usageInfo, setUsageInfo] = useState<any>(null)
  const [showUsageModal, setShowUsageModal] = useState(false)

  useEffect(() => {
    // hydration이 완료된 후에만 인증 상태 확인
    if (!isHydrated) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchChildren()
    fetchConversations()
    fetchUsageInfo()
  }, [isAuthenticated, isHydrated, router])

  const fetchUsageInfo = async () => {
    try {
      const response = await fetch('/api/ai/usage', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setUsageInfo(data.currentUsage)
      }
    } catch (error) {
      console.error(aiCoach.usageError, error)
    }
  }

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
      console.error(aiCoach.childListError, error)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/ai/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error(aiCoach.conversationListError, error)
    }
  }

  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/ai/conversations/${convId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        const conv = data.conversation
        setMessages(conv.messages.map((msg: any, index: number) => ({
          id: index.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        })))
        setConversationId(convId)
        setShowHistory(false)
      }
    } catch (error) {
      console.error(aiCoach.conversationLoadError, error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: inputMessage,
          childId: selectedChild || undefined,
          conversationId: conversationId
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        
        // 대화 ID 저장
        if (data.conversationId) {
          setConversationId(data.conversationId)
        }
        
        // 사용량 정보 업데이트 (AI 사용 후 즉시 반영)
        if (data.usageInfo) {
          setUsageInfo(data.usageInfo)
          console.log('사용량 업데이트:', data.usageInfo)
        }
        
        // 추가 보장: 무조건 최신 사용량 정보를 가져오기
        setTimeout(() => {
          fetchUsageInfo()
        }, 100)
        
        // 대화 목록 새로고침
        fetchConversations()
      } else {
        // 사용량 제한 확인
        if (data.limitExceeded) {
          setShowUsageModal(true)
          setUsageInfo(data.usageInfo)
        }
        throw new Error(data.error || aiCoach.errorMessage)
      }
    } catch (error: any) {
      console.error(aiCoach.aiChatError, error)
      let errorContent = aiCoach.fallbackMessage
      
      if (error.message.includes(aiCoach.usageLimitError)) {
        errorContent = error.message
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // hydration이 완료되지 않았으면 로딩 표시
  if (!isHydrated) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          <div className="text-center">{t('common.loading')}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[calc(100vh-12rem)] lg:h-auto">
          {/* 헤더 */}
          <div className="bg-primary-600 px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl lg:text-2xl">🤖</span>
                <h1 className="text-lg lg:text-xl font-semibold text-white">{aiCoach.title}</h1>
                <div className="ml-auto flex items-center gap-2">
                  {usageInfo && (
                    <div 
                      key={`usage-${usageInfo.totalUsed}-${usageInfo.remaining}`}
                      className="text-white bg-white bg-opacity-20 px-3 py-1 rounded text-xs"
                    >
                      {usageInfo.totalUsed}/{usageInfo.totalUsed + usageInfo.remaining} ({usageInfo.plan.toUpperCase()})
                    </div>
                  )}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-white bg-white bg-opacity-20 px-3 py-1 rounded text-sm hover:bg-opacity-30"
                  >
                    {showHistory ? t('common.close') : aiCoach.chatHistory}
                  </button>
                </div>
              </div>
              {children.length > 0 && (
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="bg-white text-gray-900 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  <option value="">{aiCoach.generalConsult}</option>
                  {children.map((child) => (
                    <option key={child._id} value={child._id}>
                      {child.name} {aiCoach.childConsult}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-primary-100 text-xs lg:text-sm mt-2">
              {aiCoach.description}
            </p>
          </div>

          {/* 대화 기록 사이드바 - 모바일 최적화 */}
          {showHistory && (
            <>
              {/* 모바일 배경 오버레이 */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setShowHistory(false)}
              />
              
              <div className="fixed lg:absolute top-0 right-0 h-full w-full sm:w-80 bg-gray-50 shadow-lg z-50 overflow-y-auto">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{aiCoach.chatHistory}</h3>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="lg:hidden p-2 hover:bg-gray-200 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <button
                    onClick={() => {
                      setMessages([{
                        id: '1',
                        role: 'assistant',
                        content: aiCoach.hardcodedGreeting,
                        timestamp: new Date()
                      }])
                      setConversationId(null)
                      setShowHistory(false)
                    }}
                    className="w-full bg-primary-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-700 mb-4"
                  >
                    {aiCoach.startNewChat}
                  </button>
                  
                  <div className="space-y-2">
                    {conversations.length > 0 ? (
                      conversations.map((conv) => (
                        <div
                          key={conv._id}
                          onClick={() => {
                            loadConversation(conv._id)
                            setShowHistory(false) // 모바일에서는 선택 후 자동 닫기
                          }}
                          className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                            conversationId === conv._id ? 'bg-primary-100 border-primary-300 border' : 'bg-white'
                          }`}
                        >
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {conv.sessionTitle || aiCoach.noTitle}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(conv.updatedAt).toLocaleDateString(locale)}
                            {conv.childId && ` • ${conv.childId.name}`}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">{aiCoach.noHistory}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 채팅 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4 min-h-0 relative">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[75%] lg:max-w-md px-3 lg:px-4 py-2 lg:py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm lg:text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 lg:px-4 py-2 lg:py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 입력 영역 - 모바일 최적화 */}
          <div className="border-t border-gray-200 p-3 lg:p-4 flex-shrink-0">
            <div className="flex gap-2 lg:gap-4 items-end">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={aiCoach.inputPlaceholder}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm lg:text-base min-h-[40px] max-h-[120px]"
                rows={1}
                disabled={isLoading}
                style={{ 
                  height: 'auto',
                  minHeight: '40px',
                  maxHeight: '120px',
                  overflowY: inputMessage.split('\n').length > 3 ? 'auto' : 'hidden'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-primary-600 text-white px-3 sm:px-4 lg:px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm lg:text-base whitespace-nowrap h-[40px] flex items-center justify-center"
              >
                <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="hidden sm:inline">{aiCoach.send}</span>
              </button>
            </div>
            
            {/* 추천 질문 - 모바일에서 스크롤 가능 */}
            <div className="mt-3 lg:mt-2">
              <p className="text-xs text-gray-500 mb-2">{aiCoach.suggestedQuestions}</p>
              <div className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:overflow-x-visible lg:pb-0">
                {[
                  aiCoach.question1,
                  aiCoach.question2,
                  aiCoach.question3,
                  aiCoach.question4
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputMessage(suggestion)}
                    className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:text-sm lg:rounded-lg lg:py-2"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 전문 상담사 추천 */}
        <div className="mt-4 lg:mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {aiCoach.deeperConsultTitle}
              </h3>
              <p className="text-sm text-gray-600">
                {aiCoach.deeperConsultDesc}
              </p>
            </div>
            <button
              onClick={() => router.push('/counselors')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              {aiCoach.viewCounselors}
            </button>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-4 lg:mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3 lg:p-4">
          <div className="flex items-start gap-2 lg:gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm lg:text-base font-medium text-yellow-800">{aiCoach.aiConsultNotice}</h3>
              <div className="mt-1 text-xs lg:text-sm text-yellow-700">
                <p className="leading-relaxed">
                  {aiCoach.aiConsultWarning}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 사용량 제한 모달 */}
        {showUsageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{aiCoach.usageLimitTitle}</h3>
              
              {usageInfo && (
                <div className="mb-4">
                  <p className="text-gray-600 mb-2">
                    {aiCoach.usageLimitMessage}
                  </p>
                  <div className="bg-gray-100 rounded p-3 text-sm">
                    <div className="flex justify-between mb-1">
                      <span>{aiCoach.currentPlan}</span>
                      <span className="font-medium">{usageInfo.plan}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>{aiCoach.usage}</span>
                      <span>{usageInfo.totalUsed}/{usageInfo.totalUsed + usageInfo.remaining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{aiCoach.resetDate}</span>
                      <span>{new Date(usageInfo.resetDate).toLocaleDateString(locale)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-4">
                <div className="border rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{aiCoach.premiumPlan}</h4>
                    <span className="text-primary-600 font-bold">{aiCoach.premiumPrice}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3 space-y-1">
                    <p>{aiCoach.premiumFeature1}</p>
                    <p>{aiCoach.premiumFeature2}</p>
                    <p>{aiCoach.premiumFeature3}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowUsageModal(false)
                      window.location.href = '/subscription'
                    }}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700"
                  >
                    {aiCoach.upgradeButton}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowUsageModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  {aiCoach.closeModal}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}