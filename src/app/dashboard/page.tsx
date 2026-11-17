'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import Layout from '@/components/Layout'
import PaymentModal from '@/components/PaymentModal'

// JWT 디코딩 함수
function decodeJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('❌ 잘못된 JWT 형식: 3개 부분이 아님', parts.length)
      return null
    }
    
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    console.log('🔓 JWT 페이로드 디코딩 성공:', decoded)
    
    // 토큰 만료 시간 확인
    if (decoded.exp) {
      const now = Math.floor(Date.now() / 1000)
      const isExpired = decoded.exp < now
      console.log('⏰ 토큰 만료 정보:', {
        exp: decoded.exp,
        현재시간: now,
        만료여부: isExpired,
        남은시간: decoded.exp - now,
        만료시간: new Date(decoded.exp * 1000).toLocaleString()
      })
    }
    
    return decoded
  } catch (error) {
    console.error('❌ JWT 디코딩 실패:', error)
    return null
  }
}

// localStorage에서 직접 토큰 확인
function checkLocalStorageToken() {
  try {
    const token = localStorage.getItem('auth-token')
    const storedAuth = localStorage.getItem('auth-storage')
    
    console.log('💾 localStorage 직접 확인:')
    console.log('  - auth-token:', token ? `있음 (${token.length}자)` : '없음')
    console.log('  - auth-storage:', storedAuth ? '있음' : '없음')
    
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth)
        console.log('  - auth-storage 파싱:', parsed)
      } catch (e) {
        console.error('  - auth-storage 파싱 실패:', e)
      }
    }
    
    return { token, storedAuth }
  } catch (error) {
    console.error('💾 localStorage 확인 실패:', error)
    return { token: null, storedAuth: null }
  }
}

interface Child {
  _id: string
  name: string
  birthDate: string
  gender: 'male' | 'female' | 'other'
  profileImage?: string
  createdAt: string
}

interface Quest {
  _id: string
  title: string
  description: string
  completed: boolean
  createdAt: string
}

export default function Dashboard() {
  const authStore = useAuthStore()
  const { isAuthenticated, isHydrated, token, user, adminMode } = authStore
  
  // 🔍 포괄적인 인증 상태 디버깅
  console.log('🚀 === 대시보드 인증 상태 디버깅 시작 ===')
  console.log('📊 authStore 전체 상태:', JSON.stringify(authStore, null, 2))
  console.log('🔐 주요 인증 정보:', JSON.stringify({
    isAuthenticated,
    isHydrated,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? token.substring(0, 50) + '...' : '없음',
    user: user ? { id: user.id, email: user.email, name: user.name } : '없음',
    adminMode
  }, null, 2))
  
  // localStorage 직접 확인
  if (typeof window !== 'undefined') {
    const localStorage디버깅 = checkLocalStorageToken()
    
    // JWT 토큰 디코딩 (zustand 토큰)
    if (token) {
      console.log('🔓 Zustand 토큰 디코딩:')
      const decodedZustand = decodeJWT(token)
      if (decodedZustand) {
        console.log('  ✅ Zustand 토큰 유효:', JSON.stringify(decodedZustand, null, 2))
      }
    } else {
      console.log('❌ Zustand에 토큰 없음')
    }
    
    // localStorage 토큰 디코딩
    if (localStorage디버깅.token) {
      console.log('🔓 localStorage 토큰 디코딩:')
      const decodedLS = decodeJWT(localStorage디버깅.token)
      if (decodedLS) {
        console.log('  ✅ localStorage 토큰 유효:', JSON.stringify(decodedLS, null, 2))
      }
    } else {
      console.log('❌ localStorage에 토큰 없음')
    }
    
    // 토큰 일치 여부 확인
    if (token && localStorage디버깅.token) {
      const isTokenMatch = token === localStorage디버깅.token
      console.log('🔄 토큰 일치 여부:', isTokenMatch)
      if (!isTokenMatch) {
        console.log('⚠️ Zustand와 localStorage 토큰이 다름!')
        console.log('  - Zustand 토큰 앞 20자:', token.substring(0, 20))
        console.log('  - localStorage 토큰 앞 20자:', localStorage디버깅.token.substring(0, 20))
      }
    }
  }
  
  console.log('🏁 === 대시보드 인증 상태 디버깅 완료 ===\n')
  const { t, dashboard, common, locale, quickActions, children: childrenT, quests: questsT } = useTranslation()
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    console.log('\n🔄 === useEffect 실행 ===')
    console.log('📊 useEffect 상태 체크:', { 
      isHydrated, 
      isAuthenticated, 
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : '없음'
    })
    
    if (!isHydrated) {
      console.log('⏸️ hydration 아직 완료되지 않음, 대기중...')
      return
    }
    
    if (!isAuthenticated || !token) {
      console.log('❌ 인증 실패 - 로그인 페이지로 리다이렉트')
      console.log('  상세 정보:', {
        isAuthenticated,
        hasToken: !!token,
        reason: !isAuthenticated ? '인증 안됨' : '토큰 없음'
      })
      router.push('/login')
      return
    }
    
    // 토큰 만료 확인
    if (token) {
      const tokenInfo = decodeJWT(token)
      if (tokenInfo && tokenInfo.만료여부) {
        console.log('🚨 토큰 만료 감지 - 자동 로그아웃 및 로그인 페이지 이동')
        authStore.logout()
        router.push('/login')
        return
      }
    }
    
    console.log('✅ 인증 확인 완료 - 데이터 로드 시작')
    console.log('🔗 사용할 토큰 정보:', {
      길이: token.length,
      시작: token.substring(0, 30),
      끝: token.substring(token.length - 30)
    })
    
    fetchChildren()
    fetchQuests()
    
    console.log('🏁 === useEffect 완료 ===\n')
  }, [isAuthenticated, isHydrated, router, token, authStore])

  const fetchChildren = async () => {
    try {
      console.log('\n👶 === 아이 정보 API 호출 시작 ===')
      
      // 요청 전 토큰 상태 확인
      const authHeader = `Bearer ${token}`
      console.log('📋 요청 정보:', {
        URL: '/api/children',
        method: 'GET',
        hasToken: !!token,
        tokenLength: token?.length,
        authHeaderLength: authHeader.length,
        authHeaderPreview: authHeader.substring(0, 50) + '...'
      })
      
      // 실제 요청 헤더 확인
      const headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
      console.log('📤 실제 요청 헤더:', headers)
      
      const response = await fetch('/api/children', {
        method: 'GET',
        headers: headers,
      })
      
      console.log('📥 응답 기본 정보:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        type: response.type
      })
      
      // 응답 헤더 상세 정보
      console.log('📋 응답 헤더 상세:')
      response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`)
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 성공 응답 데이터:', data)
        console.log('📊 데이터 구조 분석:', {
          type: typeof data,
          isArray: Array.isArray(data),
          hasChildren: 'children' in data,
          keys: Object.keys(data),
          dataLength: data?.length,
          childrenLength: data?.children?.length
        })
        
        // API 응답이 { children: [...] } 형태인지 확인
        if (data.children) {
          console.log('📝 children 필드 사용:', data.children)
          setChildren(data.children || [])
        } else {
          console.log('📝 직접 배열 사용:', data)
          setChildren(data || [])
        }
      } else {
        console.log('❌ 응답 실패 - 에러 상세 분석 시작')
        
        let errorData = {}
        let errorText = ''
        
        try {
          const responseClone = response.clone()
          errorText = await responseClone.text()
          console.log('📄 에러 응답 원본 텍스트:', errorText)
          
          errorData = JSON.parse(errorText)
          console.log('📋 에러 응답 파싱 성공:', errorData)
        } catch (parseError) {
          console.log('❌ 에러 응답 JSON 파싱 실패:', parseError)
          console.log('📄 파싱 실패한 텍스트:', errorText)
        }
        
        console.log('🚨 최종 에러 정보:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          is401: response.status === 401,
          is403: response.status === 403,
          is500: response.status === 500
        })
        
        // 401 에러 특별 처리
        if (response.status === 401) {
          console.log('🔐 401 Unauthorized 상세 분석:')
          console.log('  - 토큰 존재 여부:', !!token)
          console.log('  - 토큰 길이:', token?.length)
          console.log('  - Authorization 헤더:', authHeader.substring(0, 50))
          
          // 토큰 재검증 및 만료 시 자동 로그아웃
          if (token) {
            const reDecodedToken = decodeJWT(token)
            console.log('  - 토큰 재검증 결과:', reDecodedToken)
            
            // 토큰이 만료되었으면 자동 로그아웃
            if (reDecodedToken && reDecodedToken.만료여부) {
              console.log('🚨 API 호출 중 토큰 만료 감지 - 자동 로그아웃 처리')
              authStore.logout()
              router.push('/login')
              return
            }
          }
        }
      }
      
      console.log('🏁 === 아이 정보 API 호출 완료 ===\n')
    } catch (error) {
      console.log('💥 아이 정보 요청 네트워크 에러:', error)
      console.log('🔍 에러 상세:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  const fetchQuests = async () => {
    try {
      console.log('\n🎯 === 퀘스트 정보 API 호출 시작 ===')
      
      // 요청 전 토큰 상태 확인
      const authHeader = `Bearer ${token}`
      console.log('📋 요청 정보:', {
        URL: '/api/quests',
        method: 'GET',
        hasToken: !!token,
        tokenLength: token?.length,
        authHeaderLength: authHeader.length,
        authHeaderPreview: authHeader.substring(0, 50) + '...'
      })
      
      // 실제 요청 헤더 확인
      const headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
      console.log('📤 실제 요청 헤더:', headers)
      
      const response = await fetch('/api/quests', {
        method: 'GET',
        headers: headers,
      })
      
      console.log('📥 응답 기본 정보:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        type: response.type
      })
      
      // 응답 헤더 상세 정보
      console.log('📋 응답 헤더 상세:')
      response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`)
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ 성공 응답 데이터:', data)
        console.log('📊 데이터 구조 분석:', {
          type: typeof data,
          isArray: Array.isArray(data),
          hasQuests: 'quests' in data,
          keys: Object.keys(data),
          dataLength: data?.length,
          questsLength: data?.quests?.length
        })
        
        // API 응답이 { quests: [...] } 형태인지 확인
        if (data.quests) {
          console.log('📝 quests 필드 사용:', data.quests)
          setQuests(data.quests || [])
        } else {
          console.log('📝 직접 배열 사용:', data)
          setQuests(data || [])
        }
      } else {
        console.log('❌ 응답 실패 - 에러 상세 분석 시작')
        
        let errorData = {}
        let errorText = ''
        
        try {
          const responseClone = response.clone()
          errorText = await responseClone.text()
          console.log('📄 에러 응답 원본 텍스트:', errorText)
          
          errorData = JSON.parse(errorText)
          console.log('📋 에러 응답 파싱 성공:', errorData)
        } catch (parseError) {
          console.log('❌ 에러 응답 JSON 파싱 실패:', parseError)
          console.log('📄 파싱 실패한 텍스트:', errorText)
        }
        
        console.log('🚨 최종 에러 정보:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          is401: response.status === 401,
          is403: response.status === 403,
          is500: response.status === 500
        })
        
        // 401 에러 특별 처리
        if (response.status === 401) {
          console.log('🔐 401 Unauthorized 상세 분석:')
          console.log('  - 토큰 존재 여부:', !!token)
          console.log('  - 토큰 길이:', token?.length)
          console.log('  - Authorization 헤더:', authHeader.substring(0, 50))
          
          // 토큰 재검증 및 만료 시 자동 로그아웃
          if (token) {
            const reDecodedToken = decodeJWT(token)
            console.log('  - 토큰 재검증 결과:', reDecodedToken)
            
            // 토큰이 만료되었으면 자동 로그아웃
            if (reDecodedToken && reDecodedToken.만료여부) {
              console.log('🚨 API 호출 중 토큰 만료 감지 - 자동 로그아웃 처리')
              authStore.logout()
              router.push('/login')
              return
            }
          }
        }
      }
      
      console.log('🏁 === 퀘스트 정보 API 호출 완료 ===\n')
    } catch (error) {
      console.log('💥 퀘스트 정보 요청 네트워크 에러:', error)
      console.log('🔍 에러 상세:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {dashboard('title') || '대시보드'}
          </h1>
          <p className="text-gray-600">
            {dashboard('subtitle') || 'AI 기반 성장 인사이트와 맞춤형 추천'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push('/logs')}
            className="bg-emerald-500 text-white p-4 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm font-medium">{quickActions('addLog') || '성장 기록'}</div>
          </button>
          
          <button
            onClick={() => router.push('/ai-coach')}
            className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm font-medium">{quickActions('aiCoach') || 'AI 코치'}</div>
          </button>
          
          <button
            onClick={() => router.push('/growth-guide')}
            className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition-colors"
          >
            <div className="text-2xl mb-2">📚</div>
            <div className="text-sm font-medium">{quickActions('growthGuide') || '성장 가이드'}</div>
          </button>
          
          <button
            onClick={() => router.push('/children')}
            className="bg-pink-500 text-white p-4 rounded-lg hover:bg-pink-600 transition-colors"
          >
            <div className="text-2xl mb-2">👶</div>
            <div className="text-sm font-medium">{quickActions('manageChildren') || '아이 관리'}</div>
          </button>
        </div>

        {/* Children Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{childrenT('title') || '우리 아이들'}</h2>
          {children.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((child) => (
                <div key={child._id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {child.gender === 'male' ? '👦' : child.gender === 'female' ? '👧' : '👶'}
                    </div>
                    <div>
                      <div className="font-medium">{child.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date().getFullYear() - new Date(child.birthDate).getFullYear()}세
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">👶</div>
              <p>{childrenT('empty') || '아직 등록된 아이가 없습니다.'}</p>
              <button
                onClick={() => router.push('/children')}
                className="mt-4 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                {childrenT('addFirst') || '첫 번째 아이 등록하기'}
              </button>
            </div>
          )}
        </div>

        {/* Premium Upgrade - 모든 사용자에게 보임 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {locale === 'vi' ? '💎 Nâng cấp Premium' : '💎 프리미엄 업그레이드'}
            </h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              {locale === 'vi' ? 'Miễn phí' : '무료 플랜'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Plan */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  {locale === 'vi' ? 'Gói hiện tại' : '현재 플랜'}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      {locale === 'vi' ? 'Gói miễn phí' : '무료 플랜'}
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {locale === 'vi' ? 'Miễn phí' : '무료'}
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {locale === 'vi' ? '10 lần phân tích AI/tháng' : '월 10회 AI 분석'}</li>
                    <li>• {locale === 'vi' ? 'Ghi chép cơ bản' : '기본 기록 기능'}</li>
                    <li>• {locale === 'vi' ? 'Hỗ trợ cộng đồng' : '커뮤니티 지원'}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  {locale === 'vi' ? 'Nâng cấp Premium' : '프리미엄 업그레이드'}
                </h3>
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 p-4 rounded-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      {locale === 'vi' ? 'Gói Premium' : '프리미엄 플랜'}
                    </span>
                    <span className="text-lg font-bold">
                      {locale === 'vi' 
                        ? '36.000₫/tháng' 
                        : '월 1,900원'
                      }
                      <span className="text-sm text-emerald-200 ml-1">
                        {locale === 'ko' ? '(계좌이체)' : '($1.49 USD)'}
                      </span>
                    </span>
                  </div>
                  <ul className="text-sm text-emerald-100 space-y-1 mb-4">
                    <li>✅ {locale === 'vi' ? '500 lần phân tích AI/tháng' : '월 500회 AI 분석'}</li>
                    <li>✅ {locale === 'vi' ? 'Hỗ trợ khách hàng ưu tiên' : '우선 고객지원'}</li>
                  </ul>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-white text-emerald-600 py-2 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    {locale === 'vi' ? 'Nâng cấp ngay' : '지금 업그레이드'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Quests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">{questsT('title') || '오늘의 퀘스트'}</h2>
          {quests.length > 0 ? (
            <div className="space-y-3">
              {quests.slice(0, 3).map((quest) => (
                <div key={quest._id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className={`w-4 h-4 rounded-full ${quest.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className="flex-1">
                    <div className="font-medium">{quest.title}</div>
                    <div className="text-sm text-gray-500">{quest.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🎯</div>
              <p>{questsT('empty') || '오늘의 퀘스트를 생성중입니다.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </Layout>
  )
}