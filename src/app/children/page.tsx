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
  gender: 'male' | 'female' | 'other'
  profileImage?: string
  createdAt: string
}

export default function ChildrenPage() {
  const { isAuthenticated, isHydrated, token } = useAuthStore()
  const { t, children: childrenT, common, locale } = useTranslation()
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female' | 'other'
  })
  const [editingChild, setEditingChild] = useState<Child | null>(null)

  useEffect(() => {
    // hydration이 완료된 후에만 인증 상태 확인
    if (!isHydrated) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchChildren()
  }, [isAuthenticated, isHydrated, router])

  const fetchChildren = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/children', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setChildren(data.children)
      }
    } catch (error) {
      console.error('Children list fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingChild ? `/api/children/${editingChild._id}` : '/api/children'
      const method = editingChild ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowAddForm(false)
        setEditingChild(null)
        setFormData({ name: '', birthDate: '', gender: 'male' })
        fetchChildren()
      } else {
        const data = await response.json()
        alert(data.error || t('common.error'))
      }
    } catch (error) {
      console.error('Submit child error:', error)
      alert(t('common.error'))
    }
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const months = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    
    if (months < 12) {
      return `${months} ${childrenT('months')}`
    } else {
      const years = Math.floor(months / 12)
      const remainingMonths = months % 12
      return remainingMonths > 0 ? `${years} ${childrenT('years')} ${remainingMonths} ${childrenT('months')}` : `${years} ${childrenT('years')}`
    }
  }

  const getGenderLabel = (gender: string) => {
    const labels = {
      male: childrenT('male'),
      female: childrenT('female'),
      other: childrenT('other')
    }
    return labels[gender as keyof typeof labels] || gender
  }

  const handleEdit = (child: Child) => {
    setEditingChild(child)
    setFormData({
      name: child.name,
      birthDate: child.birthDate,
      gender: child.gender
    })
    setShowAddForm(true)
  }

  const handleDelete = async (child: Child) => {
    if (!confirm(childrenT('deleteConfirm'))) {
      return
    }

    try {
      const response = await fetch(`/api/children/${child._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchChildren()
      } else {
        const data = await response.json()
        alert(data.error || t('common.error'))
      }
    } catch (error) {
      console.error('Delete child error:', error)
      alert(t('common.error'))
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">👶 {childrenT('title')}</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto bg-primary-600 text-white px-4 py-3 lg:py-2 rounded-lg hover:bg-primary-700 text-sm lg:text-base transition-colors"
          >
            {childrenT('addChild')}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6 lg:py-8">
            <div className="inline-block animate-spin rounded-full h-5 lg:h-6 w-5 lg:w-6 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600 text-sm lg:text-base">{common('loading')}</p>
          </div>
        ) : children.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {children.map((child) => (
              <div key={child._id} className="bg-white rounded-lg shadow p-4 lg:p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 lg:w-16 h-12 lg:h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg lg:text-2xl font-bold text-primary-600">
                      {child.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3 lg:ml-4">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-500">{getGenderLabel(child.gender)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs lg:text-sm text-gray-600">{childrenT('age')}:</span>
                    <span className="text-xs lg:text-sm font-medium">{calculateAge(child.birthDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs lg:text-sm text-gray-600">{childrenT('birthDate')}:</span>
                    <span className="text-xs lg:text-sm font-medium">
                      {new Date(child.birthDate).toLocaleDateString(locale)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => handleEdit(child)}
                    className="w-full sm:flex-1 text-primary-600 hover:text-primary-700 text-xs lg:text-sm font-medium py-2 px-3 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    {common('edit')}
                  </button>
                  <button 
                    onClick={() => handleDelete(child)}
                    className="w-full sm:flex-1 text-red-600 hover:text-red-700 text-xs lg:text-sm font-medium py-2 px-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    {common('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 lg:py-16">
            <div className="w-20 lg:w-24 h-20 lg:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 lg:w-12 h-10 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">{childrenT('noChildren')}</h3>
            <p className="text-gray-500 mb-4 text-sm lg:text-base">{childrenT('addFirstChild')}</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-primary-600 text-white px-6 py-3 lg:py-2 rounded-lg hover:bg-primary-700 text-sm lg:text-base transition-colors"
            >
              {childrenT('addChild')}
            </button>
          </div>
        )}

        {/* 아이 추가 모달 */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-4 lg:p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg lg:text-xl font-medium mb-4 lg:mb-6">
                {editingChild ? childrenT('editChild') : childrenT('addChild')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {childrenT('childName')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('children.childName')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {childrenT('birthDate')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {childrenT('gender')}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as 'male' | 'female' | 'other'})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="male">{childrenT('male')}</option>
                    <option value="female">{childrenT('female')}</option>
                    <option value="other">{childrenT('other')}</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4 lg:pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingChild(null)
                      setFormData({ name: '', birthDate: '', gender: 'male' })
                    }}
                    className="w-full sm:flex-1 bg-gray-300 text-gray-700 px-4 py-3 lg:py-2 rounded-lg hover:bg-gray-400 text-base lg:text-sm transition-colors"
                  >
                    {common('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:flex-1 bg-primary-600 text-white px-4 py-3 lg:py-2 rounded-lg hover:bg-primary-700 text-base lg:text-sm transition-colors"
                  >
                    {editingChild ? common('save') : common('add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}