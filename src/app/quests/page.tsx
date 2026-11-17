'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useTranslation } from '@/hooks/useTranslation'

interface Child {
  _id: string
  name: string
  birthDate: string
  gender: string
}

interface Quest {
  _id: string
  title: string
  description: string
  category: string
  estimatedTime: string
  tips: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  targetParent: 'mom' | 'dad' | 'grandpa' | 'grandma' | 'both' | 'parents' | 'grandparents' | 'family'
  aiProvider: string
  generatedAt: string
  completedAt?: string
  parentNotes?: string
}

export default function QuestsPage() {
  const { isAuthenticated, isHydrated, token } = useAuthStore()
  const router = useRouter()
  const { t } = useTranslation()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [quests, setQuests] = useState<Quest[]>([])
  const [filteredQuests, setFilteredQuests] = useState<Quest[]>([])
  const [selectedFamily, setSelectedFamily] = useState<string>('all')
  const [loading, setLoading] = useState(false)

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
      fetchQuestHistory()
    }
  }, [selectedChild])

  useEffect(() => {
    filterQuests()
  }, [quests, selectedFamily])

  const filterQuests = () => {
    if (selectedFamily === 'all') {
      setFilteredQuests(quests)
    } else {
      const filtered = quests.filter(quest => {
        if (selectedFamily === 'parents') {
          return ['mom', 'dad', 'both', 'parents', 'family'].includes(quest.targetParent)
        } else if (selectedFamily === 'grandparents') {
          return ['grandpa', 'grandma', 'grandparents', 'family'].includes(quest.targetParent)
        } else {
          return quest.targetParent === selectedFamily || quest.targetParent === 'family'
        }
      })
      setFilteredQuests(filtered)
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
      console.error(t('quests.childListError'), error)
    }
  }

  const fetchQuestHistory = async () => {
    if (!selectedChild) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/quests?childId=${selectedChild}&action=history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setQuests(data.quests || [])
        setFilteredQuests(data.quests || [])
      }
    } catch (error) {
      console.error(t('quests.questHistoryError'), error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{t('statusBadges.completed')}</span>
      case 'skipped':
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{t('statusBadges.skipped')}</span>
      case 'in_progress':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">{t('statusBadges.inProgress')}</span>
      default:
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{t('statusBadges.pending')}</span>
    }
  }

  const getFamilyBadge = (targetParent: string) => {
    const familyConfig = {
      mom: { emoji: '👩', label: t('quests.familyLabels.mom'), color: 'bg-pink-100 text-pink-700' },
      dad: { emoji: '👨', label: t('quests.familyLabels.dad'), color: 'bg-blue-100 text-blue-700' },
      grandpa: { emoji: '👴', label: t('quests.familyLabels.grandpa'), color: 'bg-gray-100 text-gray-700' },
      grandma: { emoji: '👵', label: t('quests.familyLabels.grandma'), color: 'bg-purple-100 text-purple-700' },
      both: { emoji: '👨‍👩', label: t('quests.familyLabels.both'), color: 'bg-green-100 text-green-700' },
      parents: { emoji: '👨‍👩', label: t('quests.familyLabels.parents'), color: 'bg-green-100 text-green-700' },
      grandparents: { emoji: '👴👵', label: t('quests.familyLabels.grandparents'), color: 'bg-orange-100 text-orange-700' },
      family: { emoji: '👨‍👩‍👧‍👦', label: t('quests.familyLabels.family'), color: 'bg-indigo-100 text-indigo-700' }
    }
    
    const config = familyConfig[targetParent as keyof typeof familyConfig] || familyConfig.family
    return (
      <span className={`${config.color} px-2 py-1 rounded text-xs flex items-center gap-1`}>
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('quests.pageTitle')}</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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
            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">{t('quests.families.all')}</option>
              <option value="mom">{t('quests.families.mom')}</option>
              <option value="dad">{t('quests.families.dad')}</option>
              <option value="grandpa">{t('quests.families.grandpa')}</option>
              <option value="grandma">{t('quests.families.grandma')}</option>
              <option value="parents">{t('quests.families.parents')}</option>
              <option value="grandparents">{t('quests.families.grandparents')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 lg:py-12">
            <div className="animate-spin rounded-full h-6 lg:h-8 w-6 lg:w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600 text-sm lg:text-base">{t('quests.loadingHistory')}</span>
          </div>
        ) : filteredQuests.length > 0 ? (
          <div className="space-y-3 lg:space-y-4">
            {filteredQuests.map((quest) => (
              <div key={quest._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                  <h3 className="text-base lg:text-lg font-medium text-gray-900 leading-tight">{quest.title}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getFamilyBadge(quest.targetParent)}
                    {getStatusBadge(quest.status)}
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(quest.generatedAt)}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-3 text-sm lg:text-base leading-relaxed">{quest.description}</p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">
                      {quest.category}
                    </span>
                    <span className="text-xs lg:text-sm">{quest.estimatedTime}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    AI: {quest.aiProvider}
                  </span>
                </div>

                {quest.tips && quest.tips.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm lg:text-base text-primary-600 cursor-pointer">{t('quests.tipShow')}</summary>
                    <ul className="mt-2 text-xs lg:text-sm text-gray-600 list-disc list-inside space-y-1">
                      {quest.tips.map((tip, index) => (
                        <li key={index} className="leading-relaxed">{tip}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {quest.parentNotes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-700 leading-relaxed">
                      <strong>{t('quests.parentNoteLabel')}</strong> {quest.parentNotes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 lg:py-12">
            <div className="text-4xl lg:text-6xl mb-4">🎯</div>
            <p className="text-gray-500 mb-4 text-sm lg:text-base">
              {quests.length === 0 
                ? t('quests.noQuestHistory')
                : t('quests.noSelectedFamilyQuests')
              }
            </p>
            {quests.length === 0 && (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-primary-600 text-white px-4 py-2 lg:py-3 rounded-lg hover:bg-primary-700 transition-colors text-sm lg:text-base"
              >
                {t('quests.getFirstQuestBtn')}
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}