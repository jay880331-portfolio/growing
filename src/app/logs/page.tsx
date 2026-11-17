'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import ClientOnly from '@/components/ClientOnly'
import { useTranslation } from '@/hooks/useTranslation'
import LogTypeCard from '@/components/LogTypeCard'
import SmartInputForm from '@/components/SmartInputForm'
import TimelineView from '@/components/TimelineView'
import VoiceRecorder from '@/components/VoiceRecorder'
import AIAnalysisModal from '@/components/AIAnalysisModal'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { getRecordsByAge, getAgeGroupInfo } from '@/utils/ageBasedRecords'

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

function LogsPageContent() {
  const { isAuthenticated, token } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toasts, showSuccess, showError, removeToast } = useToast()
  const { t } = useTranslation()
  const logsTranslations = {
    pageTitle: t('logs.pageTitle'),
    recordQuickly: t('logs.recordQuickly'),
    selectChild: t('logs.selectChild'),
    selectChildPlaceholder: t('logs.selectChildPlaceholder'),
    viewModes: {
      cards: t('logs.viewModes.cards'),
      timeline: t('logs.viewModes.timeline'),
      voice: t('logs.viewModes.voice')
    },
    todayRecordSummary: t('logs.todayRecordSummary'),
    voiceGuide: t('logs.voiceGuide'),
    recentVoiceRecords: t('logs.recentVoiceRecords'),
    voiceRecord: t('logs.voiceRecord'),
    recordSaved: t('logs.recordSaved'),
    recordAddErrorMessage: t('logs.recordAddErrorMessage'),
    childError: t('logs.childError'),
    logsError: t('logs.logsError'),
    recordAddError: t('logs.recordAddError'),
    loading: t('logs.loading'),
    logClick: t('logs.logClick'),
    voiceRecognition: t('logs.voiceRecognition'),
    voiceExamples: {
      feeding: {
        title: t('logs.voiceExamples.feeding.title'),
        example1: t('logs.voiceExamples.feeding.example1'),
        example2: t('logs.voiceExamples.feeding.example2'),
        example3: t('logs.voiceExamples.feeding.example3')
      },
      sleep: {
        title: t('logs.voiceExamples.sleep.title'),
        example1: t('logs.voiceExamples.sleep.example1'),
        example2: t('logs.voiceExamples.sleep.example2'),
        example3: t('logs.voiceExamples.sleep.example3')
      },
      diaper: {
        title: t('logs.voiceExamples.diaper.title'),
        example1: t('logs.voiceExamples.diaper.example1'),
        example2: t('logs.voiceExamples.diaper.example2'),
        example3: t('logs.voiceExamples.diaper.example3')
      },
      development: {
        title: t('logs.voiceExamples.development.title'),
        example1: t('logs.voiceExamples.development.example1'),
        example2: t('logs.voiceExamples.development.example2'),
        example3: t('logs.voiceExamples.development.example3')
      }
    }
  }
  
  const [children, setChildren] = useState<Child[]>([])
  const [logs, setLogs] = useState<GrowthLog[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [showDetailForm, setShowDetailForm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'timeline' | 'voice'>('cards')

  const getChildAge = () => {
    if (!selectedChild) return 6
    const child = children.find(c => c._id === selectedChild)
    if (!child) return 6
    return Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  }

  // 연령에 따른 동적 로그 타입 (번역 지원)
  const getLogTypes = () => {
    const childAge = getChildAge()
    
    if (childAge <= 12) {
      // 0-12개월: 신생아/영아기
      return [
        {
          type: 'feeding',
          icon: '🍼',
          label: t('ageGroups.recordTypes.feeding.label'),
          color: 'text-green-800',
          bgColor: 'bg-green-50',
          description: t('ageGroups.recordTypes.feeding.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.feeding.quickActions.breastMilk'), data: { type: 'breast_milk', amount: 120 }, action: 'complete' },
            { label: t('ageGroups.recordTypes.feeding.quickActions.formula'), data: { type: 'formula', amount: 120 }, action: 'complete' },
            { label: t('ageGroups.recordTypes.feeding.quickActions.babyFood'), data: { type: 'baby_food', amount: 50 }, action: 'complete' }
          ]
        },
        {
          type: 'sleep',
          icon: '😴',
          label: t('ageGroups.recordTypes.sleep.label'),
          color: 'text-blue-800',
          bgColor: 'bg-blue-50',
          description: t('ageGroups.recordTypes.sleep.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.sleep.quickActions.nap'), data: { type: 'nap', duration: 2 }, action: 'complete' },
            { label: t('ageGroups.recordTypes.sleep.quickActions.nightSleep'), data: { type: 'night_sleep', duration: 8 }, action: 'complete' },
            { label: t('ageGroups.recordTypes.sleep.quickActions.wakeUp'), data: { type: 'wake_up' }, action: 'complete' }
          ]
        },
        {
          type: 'diaper',
          icon: '🚼',
          label: t('ageGroups.recordTypes.diaper.label'),
          color: 'text-yellow-800',
          bgColor: 'bg-yellow-50',
          description: t('ageGroups.recordTypes.diaper.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.diaper.quickActions.wet'), data: { type: 'wet' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.diaper.quickActions.dirty'), data: { type: 'dirty' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.diaper.quickActions.both'), data: { type: 'both' }, action: 'complete' }
          ]
        },
        {
          type: 'development',
          icon: '📈',
          label: t('ageGroups.recordTypes.development.label'),
          color: 'text-purple-800',
          bgColor: 'bg-purple-50',
          description: t('ageGroups.recordTypes.development.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.development.quickActions.milestone'), data: { type: 'milestone' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.development.quickActions.newSkill'), data: { type: 'new_skill' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.development.quickActions.progress'), data: { type: 'progress' }, action: 'complete' }
          ]
        }
      ]
    } else if (childAge <= 36) {
      // 12-36개월: 걸음마기
      return [
        {
          type: 'meal',
          icon: '🍽️',
          label: t('ageGroups.recordTypes.meal.label'),
          color: 'text-green-800',
          bgColor: 'bg-green-50',
          description: t('ageGroups.recordTypes.meal.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.meal.quickActions.breakfast'), data: { type: 'breakfast' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.meal.quickActions.lunch'), data: { type: 'lunch' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.meal.quickActions.dinner'), data: { type: 'dinner' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.meal.quickActions.snack'), data: { type: 'snack' }, action: 'complete' }
          ]
        },
        {
          type: 'play',
          icon: '🧩',
          label: t('ageGroups.recordTypes.play.label'),
          color: 'text-pink-800',
          bgColor: 'bg-pink-50',
          description: t('ageGroups.recordTypes.play.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.play.quickActions.indoor'), data: { type: 'indoor_play' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.play.quickActions.outdoor'), data: { type: 'outdoor_play' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.play.quickActions.creative'), data: { type: 'creative_play' }, action: 'complete' }
          ]
        },
        {
          type: 'development',
          icon: '📈',
          label: t('ageGroups.recordTypes.development.label'),
          color: 'text-purple-800',
          bgColor: 'bg-purple-50',
          description: t('ageGroups.recordTypes.development.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.development.quickActions.milestone'), data: { type: 'milestone' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.development.quickActions.newSkill'), data: { type: 'new_skill' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.development.quickActions.progress'), data: { type: 'progress' }, action: 'complete' }
          ]
        }
      ]
    } else {
      // 36개월+: 유치원기/학령기
      return [
        {
          type: 'learning',
          icon: '📚',
          label: t('ageGroups.recordTypes.learning.label'),
          color: 'text-blue-800',
          bgColor: 'bg-blue-50',
          description: t('ageGroups.recordTypes.learning.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.learning.quickActions.reading'), data: { type: 'reading' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.learning.quickActions.writing'), data: { type: 'writing' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.learning.quickActions.math'), data: { type: 'math' }, action: 'complete' }
          ]
        },
        {
          type: 'creative',
          icon: '🎨',
          label: t('ageGroups.recordTypes.creative.label'),
          color: 'text-purple-800',
          bgColor: 'bg-purple-50',
          description: t('ageGroups.recordTypes.creative.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.creative.quickActions.drawing'), data: { type: 'drawing' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.creative.quickActions.music'), data: { type: 'music' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.creative.quickActions.crafts'), data: { type: 'crafts' }, action: 'complete' }
          ]
        },
        {
          type: 'physical',
          icon: '🏃‍♂️',
          label: t('ageGroups.recordTypes.physical.label'),
          color: 'text-red-800',
          bgColor: 'bg-red-50',
          description: t('ageGroups.recordTypes.physical.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.physical.quickActions.exercise'), data: { type: 'exercise' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.physical.quickActions.sports'), data: { type: 'sports' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.physical.quickActions.walk'), data: { type: 'walk' }, action: 'complete' }
          ]
        },
        {
          type: 'emotion',
          icon: '😊',
          label: t('ageGroups.recordTypes.emotion.label'),
          color: 'text-yellow-800',
          bgColor: 'bg-yellow-50',
          description: t('ageGroups.recordTypes.emotion.description'),
          quickActions: [
            { label: t('ageGroups.recordTypes.emotion.quickActions.happy'), data: { type: 'happy' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.emotion.quickActions.sad'), data: { type: 'sad' }, action: 'complete' },
            { label: t('ageGroups.recordTypes.emotion.quickActions.angry'), data: { type: 'angry' }, action: 'complete' }
          ]
        }
      ]
    }
  }

  const logTypes = getLogTypes()

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
  }, [selectedChild])

  useEffect(() => {
    // URL 파라미터에서 기본값 설정
    const typeParam = searchParams.get('type')
    const childIdParam = searchParams.get('childId')
    
    if (typeParam) {
      setExpandedCard(typeParam)
    }
    if (childIdParam && children.length > 0) {
      setSelectedChild(childIdParam)
    }
  }, [searchParams, children])

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
      console.error(logsTranslations.childError, error)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const response = await fetch(`/api/logs?childId=${selectedChild}&startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error(logsTranslations.logsError, error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLog = async (logData: any) => {
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
          ...logData
        }),
      })

      if (response.ok) {
        const result = await response.json()
        showSuccess(logsTranslations.recordSaved)
        fetchLogs() // 목록 새로고침
        setExpandedCard(null) // 카드 접기
        
        // AI 분석 결과가 있으면 모달 표시
        if (result.aiAnalysis) {
          setAiAnalysis(result.aiAnalysis)
          setShowAiModal(true)
        }
      } else {
        const error = await response.json()
        showError(error.error || logsTranslations.recordAddErrorMessage)
      }
    } catch (error) {
      console.error(logsTranslations.recordAddError, error)
      showError(logsTranslations.recordAddErrorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{logsTranslations.pageTitle}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {selectedChild && children.find(c => c._id === selectedChild) ? (
                (() => {
                  const childAge = getChildAge()
                  if (childAge <= 12) {
                    return `${t('ageGroups.newborn.name')} • ${t('ageGroups.newborn.description')}`
                  } else if (childAge <= 36) {
                    return `${t('ageGroups.toddler.name')} • ${t('ageGroups.toddler.description')}`
                  } else if (childAge <= 72) {
                    return `${t('ageGroups.preschool.name')} • ${t('ageGroups.preschool.description')}`
                  } else {
                    return `${t('ageGroups.schoolAge.name')} • ${t('ageGroups.schoolAge.description')}`
                  }
                })()
              ) : logsTranslations.recordQuickly}
            </p>
          </div>
          
          {/* 뷰 모드 토글 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {logsTranslations.viewModes.cards}
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {logsTranslations.viewModes.timeline}
            </button>
            <button
              onClick={() => setViewMode('voice')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                viewMode === 'voice' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {logsTranslations.viewModes.voice}
            </button>
          </div>
        </div>

        {/* 아이 선택 */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {logsTranslations.selectChild}
          </label>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{logsTranslations.selectChildPlaceholder}</option>
            {children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>

        {selectedChild && (
          <>
            {viewMode === 'cards' ? (
              <>
                {/* 연령별 맞춤 기록 카드들 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {logTypes.map((logType) => (
                    <LogTypeCard
                      key={logType.type}
                      type={logType.type}
                      icon={logType.icon}
                      label={logType.label}
                      color={logType.color}
                      bgColor={logType.bgColor}
                      isExpanded={expandedCard === logType.type}
                      onToggle={() => setExpandedCard(expandedCard === logType.type ? null : logType.type)}
                      onQuickLog={handleQuickLog}
                      onDetailForm={(type) => {
                        setExpandedCard(null)
                        setShowDetailForm(type)
                      }}
                      childAge={getChildAge()}
                      quickActions={logType.quickActions}
                    />
                  ))}
                </div>

                {/* 상세 입력 폼 */}
                {showDetailForm && (
                  <div className="mb-6">
                    <SmartInputForm
                      type={showDetailForm}
                      childAge={getChildAge()}
                      onSubmit={handleQuickLog}
                      onCancel={() => setShowDetailForm(null)}
                      isSubmitting={submitting}
                    />
                  </div>
                )}

                {/* 오늘의 기록 요약 */}
                {logs.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">{logsTranslations.todayRecordSummary}</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                      {logTypes.map((logType) => {
                        const count = logs.filter(log => log.type === logType.type).length
                        return (
                          <div key={logType.type} className="text-center">
                            <div className="text-2xl mb-1">{logType.icon}</div>
                            <div className="text-lg font-bold text-gray-900">{count}</div>
                            <div className="text-xs text-gray-600">{logType.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : viewMode === 'timeline' ? (
              /* 타임라인 뷰 */
              <TimelineView 
                logs={logs} 
                onLogClick={(log) => {
                  console.log(logsTranslations.logClick, log)
                  // 여기서 로그 수정 등의 액션 수행
                }}
              />
            ) : (
              /* 음성 기록 뷰 */
              <div className="space-y-6">
                <VoiceRecorder 
                  onTranscript={(text) => {
                    console.log(logsTranslations.voiceRecognition, text)
                  }}
                  onLog={handleQuickLog}
                  childAge={getChildAge()}
                />
                
                {/* 연령별 음성 기록 가이드 */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">{logsTranslations.voiceGuide}</h3>
                  {(() => {
                    const childAge = getChildAge()
                    if (childAge <= 12) {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-purple-800 mb-2">{logsTranslations.voiceExamples.feeding.title}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{logsTranslations.voiceExamples.feeding.example1}</li>
                              <li>{logsTranslations.voiceExamples.feeding.example2}</li>
                              <li>{logsTranslations.voiceExamples.feeding.example3}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-800 mb-2">{logsTranslations.voiceExamples.sleep.title}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{logsTranslations.voiceExamples.sleep.example1}</li>
                              <li>{logsTranslations.voiceExamples.sleep.example2}</li>
                              <li>{logsTranslations.voiceExamples.sleep.example3}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-yellow-800 mb-2">{logsTranslations.voiceExamples.diaper.title}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{logsTranslations.voiceExamples.diaper.example1}</li>
                              <li>{logsTranslations.voiceExamples.diaper.example2}</li>
                              <li>{logsTranslations.voiceExamples.diaper.example3}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-pink-800 mb-2">{logsTranslations.voiceExamples.development.title}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{logsTranslations.voiceExamples.development.example1}</li>
                              <li>{logsTranslations.voiceExamples.development.example2}</li>
                              <li>{logsTranslations.voiceExamples.development.example3}</li>
                            </ul>
                          </div>
                        </div>
                      )
                    } else if (childAge <= 36) {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-green-800 mb-2">{t('voiceRecording.ageGroups.24months.meal.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.24months.meal.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.24months.meal.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.24months.meal.examples.2')}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-800 mb-2">{t('voiceRecording.ageGroups.24months.play.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.24months.play.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.24months.play.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.24months.play.examples.2')}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-indigo-800 mb-2">{t('voiceRecording.ageGroups.24months.speech.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.24months.speech.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.24months.speech.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.24months.speech.examples.2')}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-teal-800 mb-2">{t('voiceRecording.ageGroups.24months.social.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.24months.social.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.24months.social.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.24months.social.examples.2')}</li>
                            </ul>
                          </div>
                        </div>
                      )
                    } else if (childAge <= 72) {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-blue-800 mb-2">{t('voiceRecording.ageGroups.36months.learning.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.36months.learning.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.learning.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.learning.examples.2')}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-pink-800 mb-2">{t('voiceRecording.ageGroups.36months.creative.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.36months.creative.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.creative.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.creative.examples.2')}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800 mb-2">{t('voiceRecording.ageGroups.36months.physical.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.36months.physical.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.physical.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.physical.examples.2')}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-800 mb-2">{t('voiceRecording.ageGroups.36months.emotion.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.36months.emotion.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.emotion.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.emotion.examples.2')}</li>
                            </ul>
                          </div>
                        </div>
                      )
                    } else {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-blue-800 mb-2">{t('voiceRecording.ageGroups.36months.school.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.36months.school.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.school.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.school.examples.2')}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-800 mb-2">{t('voiceRecording.ageGroups.36months.hobby.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.36months.hobby.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.hobby.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.hobby.examples.2')}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800 mb-2">{t('voiceRecording.ageGroups.36months.friendship.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.36months.friendship.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.friendship.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.friendship.examples.2')}</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-orange-800 mb-2">{t('voiceRecording.ageGroups.36months.others.title')}</h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>{t('voiceRecording.ageGroups.36months.others.examples.0')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.others.examples.1')}</li>
                              <li>{t('voiceRecording.ageGroups.36months.others.examples.2')}</li>
                            </ul>
                          </div>
                        </div>
                      )
                    }
                  })()}
                </div>
                
                {/* 최근 음성 기록들 */}
                {logs.filter(log => log.notes?.includes(logsTranslations.voiceRecord)).length > 0 && (
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{logsTranslations.recentVoiceRecords}</h3>
                    <div className="space-y-2">
                      {logs
                        .filter(log => log.notes?.includes(logsTranslations.voiceRecord))
                        .slice(0, 5)
                        .map((log) => (
                          <div key={log._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span>{logTypes.find(t => t.type === log.type)?.icon}</span>
                              <span className="text-sm">{log.notes}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 로딩 상태 */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600">{logsTranslations.loading}</p>
              </div>
            )}
          </>
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