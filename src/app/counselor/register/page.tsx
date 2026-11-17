'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppSettings } from '@/hooks/useAppSettings'
import Layout from '@/components/Layout'

interface Schedule {
  day: string
  startTime: string
  endTime: string
  available: boolean
}

export default function CounselorRegister() {
  const { isAuthenticated, token, user, isHydrated } = useAuthStore()
  const { shouldHideCounselor, isFeatureEnabled, loading: appSettingsLoading } = useAppSettings()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  
  // 기본 정보
  const [profileImage, setProfileImage] = useState('')
  const [bio, setBio] = useState('')
  const [languages, setLanguages] = useState<string[]>(['korean'])
  
  // 전문분야
  const [specialties, setSpecialties] = useState<string[]>([])
  
  // 자격증
  const [certifications, setCertifications] = useState([
    { name: '', issuer: '', date: '', document: '' }
  ])
  
  // 경력
  const [experience, setExperience] = useState({
    years: 0,
    description: '',
    previousWork: ['']
  })
  
  // 학력
  const [education, setEducation] = useState([
    { degree: '', school: '', year: new Date().getFullYear() }
  ])
  
  // 가격
  const [pricing, setPricing] = useState({
    pricePerHour: 50000,
    currency: 'KRW'
  })
  
  // 가능 시간
  const [schedule, setSchedule] = useState<Schedule[]>([
    { day: 'monday', startTime: '09:00', endTime: '18:00', available: true },
    { day: 'tuesday', startTime: '09:00', endTime: '18:00', available: true },
    { day: 'wednesday', startTime: '09:00', endTime: '18:00', available: true },
    { day: 'thursday', startTime: '09:00', endTime: '18:00', available: true },
    { day: 'friday', startTime: '09:00', endTime: '18:00', available: true },
    { day: 'saturday', startTime: '09:00', endTime: '13:00', available: false },
    { day: 'sunday', startTime: '09:00', endTime: '13:00', available: false }
  ])

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
      console.log('🚫 상담사 등록 페이지 접근 차단:', { shouldHide, featureEnabled })
      router.push('/dashboard')
      return
    }

    console.log('✅ 상담사 등록 페이지 접근 허용')
  }, [isAuthenticated, isHydrated, appSettingsLoading])

  const specialtyOptions = [
    { value: 'newborn', label: '신생아', icon: '👶' },
    { value: 'infant', label: '영아', icon: '🍼' },
    { value: 'toddler', label: '유아', icon: '🚼' },
    { value: 'preschool', label: '미취학', icon: '🎨' },
    { value: 'school-age', label: '학령기', icon: '🎒' },
    { value: 'adolescent', label: '청소년', icon: '🎓' },
    { value: 'development', label: '발달', icon: '📈' },
    { value: 'nutrition', label: '영양', icon: '🥗' },
    { value: 'sleep', label: '수면', icon: '😴' },
    { value: 'behavior', label: '행동', icon: '🎯' },
    { value: 'special-needs', label: '특수아동', icon: '💝' }
  ]

  const dayLabels = {
    monday: '월요일',
    tuesday: '화요일',
    wednesday: '수요일',
    thursday: '목요일',
    friday: '금요일',
    saturday: '토요일',
    sunday: '일요일'
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/counselor/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileImage,
          bio,
          languages,
          specialties,
          certifications: certifications.filter(cert => cert.name),
          experience,
          education: education.filter(edu => edu.degree),
          pricing,
          availability: {
            timezone: 'Asia/Seoul',
            schedule
          }
        }),
      })

      if (response.ok) {
        alert('상담사 등록이 완료되었습니다. 관리자 승인 후 활동이 가능합니다.')
        router.push('/counselor/dashboard')
      } else {
        const error = await response.json()
        alert(error.error || '등록 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('상담사 등록 오류:', error)
      alert('등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">기본 정보</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">자기소개</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={6}
                placeholder="부모님들에게 자신을 소개해주세요. 전문성과 경험을 중심으로 작성해주세요."
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">{bio.length}/2000</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">전문 분야 (최소 1개 선택)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specialtyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (specialties.includes(option.value)) {
                        setSpecialties(specialties.filter(s => s !== option.value))
                      } else {
                        setSpecialties([...specialties, option.value])
                      }
                    }}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      specialties.includes(option.value)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사용 가능 언어</label>
              <div className="flex gap-3">
                {['korean', 'english', 'chinese', 'japanese'].map((lang) => (
                  <label key={lang} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={languages.includes(lang)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLanguages([...languages, lang])
                        } else {
                          setLanguages(languages.filter(l => l !== lang))
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {lang === 'korean' ? '한국어' : 
                       lang === 'english' ? '영어' :
                       lang === 'chinese' ? '중국어' : '일본어'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">자격 및 경력</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">자격증</label>
              {certifications.map((cert, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    value={cert.name}
                    onChange={(e) => {
                      const newCerts = [...certifications]
                      newCerts[index].name = e.target.value
                      setCertifications(newCerts)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="자격증명"
                  />
                  <input
                    value={cert.issuer}
                    onChange={(e) => {
                      const newCerts = [...certifications]
                      newCerts[index].issuer = e.target.value
                      setCertifications(newCerts)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="발급기관"
                  />
                  <input
                    type="date"
                    value={cert.date}
                    onChange={(e) => {
                      const newCerts = [...certifications]
                      newCerts[index].date = e.target.value
                      setCertifications(newCerts)
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <button
                onClick={() => setCertifications([...certifications, { name: '', issuer: '', date: '', document: '' }])}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + 자격증 추가
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">경력</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={experience.years}
                    onChange={(e) => setExperience({ ...experience, years: parseInt(e.target.value) || 0 })}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    min="0"
                  />
                  <span className="text-sm text-gray-600">년</span>
                </div>
                <textarea
                  value={experience.description}
                  onChange={(e) => setExperience({ ...experience, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={4}
                  placeholder="주요 경력 사항을 설명해주세요"
                  maxLength={1000}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">학력</label>
              {education.map((edu, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    value={edu.degree}
                    onChange={(e) => {
                      const newEdu = [...education]
                      newEdu[index].degree = e.target.value
                      setEducation(newEdu)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="학위/전공"
                  />
                  <input
                    value={edu.school}
                    onChange={(e) => {
                      const newEdu = [...education]
                      newEdu[index].school = e.target.value
                      setEducation(newEdu)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="학교명"
                  />
                  <input
                    type="number"
                    value={edu.year}
                    onChange={(e) => {
                      const newEdu = [...education]
                      newEdu[index].year = parseInt(e.target.value) || new Date().getFullYear()
                      setEducation(newEdu)
                    }}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="졸업년도"
                  />
                </div>
              ))}
              <button
                onClick={() => setEducation([...education, { degree: '', school: '', year: new Date().getFullYear() }])}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + 학력 추가
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">상담 설정</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시간당 상담료</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pricing.pricePerHour}
                  onChange={(e) => setPricing({ ...pricing, pricePerHour: parseInt(e.target.value) || 0 })}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                  step="10000"
                />
                <span className="text-gray-600">원</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상담 가능 시간</label>
              <div className="space-y-2">
                {schedule.map((day, index) => (
                  <div key={day.day} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={day.available}
                      onChange={(e) => {
                        const newSchedule = [...schedule]
                        newSchedule[index].available = e.target.checked
                        setSchedule(newSchedule)
                      }}
                      className="mr-2"
                    />
                    <span className="w-20 text-sm font-medium">{dayLabels[day.day as keyof typeof dayLabels]}</span>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => {
                        const newSchedule = [...schedule]
                        newSchedule[index].startTime = e.target.value
                        setSchedule(newSchedule)
                      }}
                      disabled={!day.available}
                      className="border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                    />
                    <span className="text-sm text-gray-600">~</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => {
                        const newSchedule = [...schedule]
                        newSchedule[index].endTime = e.target.value
                        setSchedule(newSchedule)
                      }}
                      disabled={!day.available}
                      className="border border-gray-300 rounded px-2 py-1 text-sm disabled:bg-gray-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return bio.length >= 50 && specialties.length > 0 && languages.length > 0
      case 2:
        return (certifications.some(cert => cert.name) || education.some(edu => edu.degree)) && experience.years >= 0
      case 3:
        return pricing.pricePerHour > 0 && schedule.some(day => day.available)
      default:
        return false
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 lg:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">상담사 등록</h1>
          
          {/* 진행 단계 */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      step > s ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {renderStep()}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '등록 중...' : '등록 완료'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}