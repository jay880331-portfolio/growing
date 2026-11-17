'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppSettings } from '@/hooks/useAppSettings'
import { useTranslation } from '@/hooks/useTranslation'
import Layout from '@/components/Layout'
import Link from 'next/link'

interface Counselor {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  profileImage?: string
  bio: string
  specialties: string[]
  rating: {
    average: number
    count: number
  }
  pricing: {
    pricePerHour: number
    currency: string
  }
  languages: string[]
  experience: {
    years: number
  }
}

export default function CounselorsPage() {
  const { isAuthenticated, token, isHydrated } = useAuthStore()
  const { shouldHideCounselor, isFeatureEnabled, loading: appSettingsLoading } = useAppSettings()
  const { t } = useTranslation()
  const router = useRouter()
  const [counselors, setCounselors] = useState<Counselor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const specialtyOptions = [
    { value: '', label: t('counselors.specialties.all') },
    { value: 'newborn', label: t('counselors.specialties.newborn'), icon: '👶' },
    { value: 'infant', label: t('counselors.specialties.infant'), icon: '🍼' },
    { value: 'toddler', label: t('counselors.specialties.toddler'), icon: '🚼' },
    { value: 'preschool', label: t('counselors.specialties.preschool'), icon: '🎨' },
    { value: 'school-age', label: t('counselors.specialties.schoolAge'), icon: '🎒' },
    { value: 'adolescent', label: t('counselors.specialties.adolescent'), icon: '🎓' },
    { value: 'development', label: t('counselors.specialties.development'), icon: '📈' },
    { value: 'nutrition', label: t('counselors.specialties.nutrition'), icon: '🥗' },
    { value: 'sleep', label: t('counselors.specialties.sleep'), icon: '😴' },
    { value: 'behavior', label: t('counselors.specialties.behavior'), icon: '🎯' },
    { value: 'special-needs', label: t('counselors.specialties.specialNeeds'), icon: '💝' }
  ]

  useEffect(() => {
    // hydration이 완료된 후에만 인증 상태 확인
    if (!isHydrated) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // 앱 설정이 로딩 중이면 대기
    if (appSettingsLoading) {
      console.log('🔄 앱 설정 로딩 중...')
      return
    }

    // 상담사 기능이 숨겨져 있으면 대시보드로 리다이렉트
    const shouldHide = shouldHideCounselor()
    const featureEnabled = isFeatureEnabled('counselor')
    
    if (shouldHide || !featureEnabled) {
      console.log('🚫 상담사 페이지 접근 차단:', { shouldHide, featureEnabled })
      router.push('/dashboard')
      return
    }

    console.log('✅ 상담사 페이지 접근 허용')
    fetchCounselors()
  }, [isAuthenticated, isHydrated, selectedSpecialty, sortBy, page, appSettingsLoading])

  const fetchCounselors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: sortBy
      })
      
      if (selectedSpecialty) {
        params.append('specialty', selectedSpecialty)
      }

      const response = await fetch(`/api/counselors?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      const data = await response.json()
      if (response.ok) {
        setCounselors(data.counselors)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error(t('counselors.fetchError'), error)
    } finally {
      setLoading(false)
    }
  }

  const getSpecialtyLabel = (value: string) => {
    const specialtyMap: { [key: string]: string } = {
      'newborn': t('counselors.specialties.newborn'),
      'infant': t('counselors.specialties.infant'),
      'toddler': t('counselors.specialties.toddler'),
      'preschool': t('counselors.specialties.preschool'),
      'school-age': t('counselors.specialties.schoolAge'),
      'adolescent': t('counselors.specialties.adolescent'),
      'development': t('counselors.specialties.development'),
      'nutrition': t('counselors.specialties.nutrition'),
      'sleep': t('counselors.specialties.sleep'),
      'behavior': t('counselors.specialties.behavior'),
      'special-needs': t('counselors.specialties.specialNeeds')
    }
    return specialtyMap[value] || value
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('counselors.title')}</h1>
              <p className="text-gray-600">{t('counselors.subtitle')}</p>
            </div>
            
            {/* 상담사 등록 배너 */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg p-4 lg:w-80">
              <h3 className="font-semibold text-gray-900 mb-1">{t('counselors.becomeCounselor')}</h3>
              <p className="text-sm text-gray-600 mb-3">{t('counselors.becomeDescription')}</p>
              <Link
                href="/counselor/register"
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                {t('counselors.register')}
              </Link>
            </div>
          </div>
        </div>

        {/* 필터 및 정렬 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {specialtyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedSpecialty(option.value)
                    setPage(1)
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedSpecialty === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.icon && <span className="mr-1">{option.icon}</span>}
                  {option.label}
                </button>
              ))}
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="rating">{t('counselors.sortRating')}</option>
              <option value="price-low">{t('counselors.sortPrice')}</option>
              <option value="price-high">{t('counselors.sortPrice')}</option>
            </select>
          </div>
        </div>

        {/* 상담사 목록 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : counselors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('counselors.noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {counselors.map((counselor) => (
              <div
                key={counselor._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/counselors/${counselor._id}`)}
              >
                <div className="p-6">
                  <div className="flex flex-col items-center text-center">
                    {/* 프로필 이미지 */}
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                      {counselor.profileImage ? (
                        <img 
                          src={counselor.profileImage} 
                          alt={counselor.userId.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl text-primary-600">
                          {counselor.userId.name[0]}
                        </span>
                      )}
                    </div>

                    {/* 이름 및 경력 */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {counselor.userId.name} {t('counselors.title')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {counselor.experience.years}{t('counselors.experienceYears')}
                    </p>

                    {/* 평점 */}
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(counselor.rating.average)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {counselor.rating.average.toFixed(1)} ({counselor.rating.count})
                      </span>
                    </div>

                    {/* 전문 분야 */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {counselor.specialties.slice(0, 3).map((specialty) => (
                        <span
                          key={specialty}
                          className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full"
                        >
                          {getSpecialtyLabel(specialty)}
                        </span>
                      ))}
                      {counselor.specialties.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{counselor.specialties.length - 3}
                        </span>
                      )}
                    </div>

                    {/* 가격 */}
                    <div className="text-lg font-semibold text-gray-900">
                      ₩{formatPrice(counselor.pricing.pricePerHour)}<span className="text-sm font-normal text-gray-600">/{t('counselors.hourlyRate')}</span>
                    </div>

                    {/* 언어 */}
                    <div className="flex gap-1 mt-2">
                      {counselor.languages.map((lang) => (
                        <span key={lang} className="text-xs text-gray-500">
                          {lang === 'korean' ? '한' : lang === 'english' ? 'EN' : lang === 'chinese' ? '中' : '日'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 소개 미리보기 */}
                <div className="px-6 pb-6">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {counselor.bio}
                  </p>
                </div>

                {/* 상담 신청 버튼 */}
                <div className="px-6 pb-6">
                  <button className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
                    {t('counselors.bookConsultation')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('counselors.prevPage')}
            </button>
            <span className="px-4 py-2 text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('counselors.nextPage')}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}