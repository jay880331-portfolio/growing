'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter, usePathname } from 'next/navigation'
import ClientOnly from './ClientOnly'
import AuthChecker from './AuthChecker'
import { useAppSettings } from '@/hooks/useAppSettings'
import { useTranslation } from '@/hooks/useTranslation'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user, adminMode, logout, toggleAdminMode, isHydrated, setHydrated } = useAuthStore()
  const { isFeatureEnabled, shouldHideSubscription, shouldHideCounselor, getCustomMessage } = useAppSettings()
  const { t, common, navigation, footer } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setHydrated()
  }, [setHydrated])

  const handleLogout = () => {
    logout()
    router.push('/')
    setMobileMenuOpen(false)
  }

  const getNavigationItems = () => {
    // 디버깅용 콘솔 로그
    console.log('Layout - Current user:', user)
    console.log('Layout - User type:', user?.userType)
    console.log('Layout - Admin mode:', adminMode)
    
    // 관리자인 경우 관리자 전용 메뉴 (adminMode가 true일 때만)
    if (user?.userType === 'admin' && adminMode) {
      return [
        { href: '/admin', label: '관리자 홈', icon: '👑' },
        { href: '/admin/counselors', label: '상담사 관리', icon: '🩺' },
        { href: '/admin/users', label: '사용자 관리', icon: '👥' },
        { href: '/admin/upgrade-requests', label: '업그레이드 신청', icon: '📈' },
        { href: '/admin/ai-usage', label: 'AI 사용량', icon: '🤖' },
        { href: '/admin/system', label: '시스템 설정', icon: '⚙️' },
        { href: '/admin/reports', label: '관리 리포트', icon: '📊' },
        { href: '/settings', label: '설정', icon: '🔧' }
      ]
    }

    // 일반 사용자 메뉴 - 앱 설정에 따라 동적으로 필터링
    const baseItems = [
      { href: '/dashboard', label: navigation('dashboard'), icon: '📊' },
      { href: '/children', label: navigation('children'), icon: '👶' },
      { href: '/logs', label: navigation('logs'), icon: '📝' },
      { href: '/ai-coach', label: navigation('aiCoach'), icon: '🤖', feature: 'aiCoach' as const },
      { href: '/counselors', label: navigation('counselors'), icon: '👩‍⚕️', feature: 'counselor' as const },
      { href: '/quests', label: navigation('quests'), icon: '🎯', feature: 'quest' as const },
      { href: '/growth-guide', label: navigation('growthGuide'), icon: '📖', feature: 'growthGuide' as const },
      { href: '/reports', label: navigation('reports'), icon: '📊', feature: 'reports' as const },
      { href: '/subscription', label: navigation('subscription'), icon: '💳', feature: 'subscription' as const },
      { href: '/settings', label: common('settings'), icon: '⚙️' }
    ]

    // 앱 설정에 따라 메뉴 항목 필터링
    return baseItems.filter(item => {
      // 기능 속성이 없는 경우 항상 표시
      if (!item.feature) return true
      
      // 구독 관련 기능 특별 처리 (관리자가 아닐 때만)
      if (item.feature === 'subscription') {
        return !shouldHideSubscription() && isFeatureEnabled(item.feature) && !(user?.userType === 'admin')
      }
      
      // 상담사 관련 기능 특별 처리
      if (item.feature === 'counselor') {
        return !shouldHideCounselor() && isFeatureEnabled(item.feature)
      }
      
      // 기타 기능들은 기본적으로 활성화 (AI코치, 퀘스트 등)
      return isFeatureEnabled(item.feature)
    })
  }

  const navigationItems = getNavigationItems()

  const isActivePath = (path: string) => pathname === path

  // Hydration 완료 전까지 전체 화면 로딩
  if (!isHydrated) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-primary-50 to-white flex items-center justify-center z-[9999]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-6"></div>
          <div className="text-xl font-bold text-gray-700 mb-2">🌱 {common('appName')}</div>
          <div className="text-sm text-gray-500">{common('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthChecker />
      {/* 데스크톱 & 모바일 공통 헤더 */}
      <nav className="bg-white shadow-sm relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl lg:text-2xl font-bold text-primary-600">
                🌱 {common('appName')}
              </Link>
              
              {/* 데스크톱 메뉴 - 드롭다운 방식 */}
              <ClientOnly>
                {isAuthenticated && (
                  <div className="hidden lg:ml-10 lg:flex lg:items-center lg:space-x-2">
                    {user?.userType === 'admin' && adminMode ? (
                      // 관리자 메뉴는 더 간결하게
                      <>
                        <Link
                          href="/admin"
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActivePath('/admin')
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          👑 관리자 홈
                        </Link>
                        <div className="relative group">
                          <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors">
                            관리 도구 ▾
                          </button>
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="py-1">
                              <Link href="/admin/counselors" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">🩺 상담사 관리</Link>
                              <Link href="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">👥 사용자 관리</Link>
                              <Link href="/admin/upgrade-requests" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">📈 업그레이드 신청</Link>
                              <Link href="/admin/ai-usage" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">🤖 AI 사용량</Link>
                              <Link href="/admin/system" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">⚙️ 시스템 설정</Link>
                              <Link href="/admin/reports" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">📊 관리 리포트</Link>
                            </div>
                          </div>
                        </div>
                        <Link
                          href="/settings"
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActivePath('/settings')
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                          }`}
                        >
                          🔧 설정
                        </Link>
                      </>
                    ) : (
                      // 일반 사용자 메뉴 - 카테고리별 그룹핑
                      <>
                        <Link
                          href="/dashboard"
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActivePath('/dashboard')
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                          }`}
                        >
                          📊 {navigation('dashboard')}
                        </Link>
                        
                        {/* 기록 관리 드롭다운 */}
                        <div className="relative group">
                          <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors">
                            {navigation('recordManagement')} ▾
                          </button>
                          <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="py-1">
                              <Link href="/children" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">👶 아이 프로필</Link>
                              <Link href="/logs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">📝 성장 기록</Link>
                              <Link href="/reports" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">📊 성장 리포트</Link>
                            </div>
                          </div>
                        </div>

                        {/* AI 기능 드롭다운 */}
                        {(isFeatureEnabled('aiCoach') || isFeatureEnabled('quest') || isFeatureEnabled('growthGuide')) && (
                          <div className="relative group">
                            <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors">
                              {navigation('aiFeatures')} ▾
                            </button>
                            <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                              <div className="py-1">
                                {isFeatureEnabled('aiCoach') && (
                                  <Link href="/ai-coach" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">🤖 {navigation('aiCoach')}</Link>
                                )}
                                {isFeatureEnabled('quest') && (
                                  <Link href="/quests" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">🎯 {navigation('quests')}</Link>
                                )}
                                {isFeatureEnabled('growthGuide') && (
                                  <Link href="/growth-guide" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">📖 {navigation('growthGuide')}</Link>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {!shouldHideCounselor() && isFeatureEnabled('counselor') && (
                          <Link
                            href="/counselors"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isActivePath('/counselors')
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                            }`}
                          >
                            👩‍⚕️ {navigation('counselors')}
                          </Link>
                        )}

                        {!shouldHideSubscription() && isFeatureEnabled('subscription') && !(user?.userType === 'admin') && (
                          <Link
                            href="/subscription"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isActivePath('/subscription')
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                            }`}
                          >
                            💳 {navigation('subscription')}
                          </Link>
                        )}

                        <Link
                          href="/settings"
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActivePath('/settings')
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                          }`}
                        >
                          ⚙️ {common('settings')}
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </ClientOnly>
            </div>

            <div className="flex items-center">
              {/* 데스크톱 사용자 메뉴 */}
              <ClientOnly fallback={
                <div className="hidden lg:flex lg:items-center lg:space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    회원가입
                  </Link>
                </div>
              }>
                {isAuthenticated ? (
                  <>
                    {/* 데스크톱 사용자 정보 */}
                    <div className="hidden lg:flex lg:items-center lg:space-x-4">
                      {user?.userType === 'admin' && (
                        <button
                          onClick={toggleAdminMode}
                          className="text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-md font-medium transition-colors"
                        >
                          {adminMode ? '👤 사용자 모드' : '👑 관리자 모드'}
                        </button>
                      )}
                      <span className="text-sm text-gray-700">{user?.name}님</span>
                      <button
                        onClick={handleLogout}
                        className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        로그아웃
                      </button>
                    </div>
                    
                    {/* 모바일 햄버거 메뉴 */}
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="lg:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {mobileMenuOpen ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    {/* 데스크톱 로그인/회원가입 */}
                    <div className="hidden lg:flex lg:items-center lg:space-x-4">
                      <Link
                        href="/login"
                        className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        {common('login')}
                      </Link>
                      <Link
                        href="/signup"
                        className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        {common('signup')}
                      </Link>
                    </div>
                    
                    {/* 모바일 로그인 버튼 */}
                    <Link
                      href="/login"
                      className="lg:hidden text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      {common('login')}
                    </Link>
                  </>
                )}
              </ClientOnly>
            </div>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        <ClientOnly>
          {isAuthenticated && mobileMenuOpen && (
            <div className="lg:hidden absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-20">
              <div className="px-4 py-2 space-y-1">
                {/* 사용자 정보 */}
                <div className="px-3 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{user?.name}님</span>
                    {user?.userType === 'admin' && (
                      <button
                        onClick={toggleAdminMode}
                        className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded font-medium transition-colors"
                      >
                        {adminMode ? '👤' : '👑'}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 네비게이션 아이템 */}
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActivePath(item.href)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                
                {/* 로그아웃 */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-3 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                >
                  <span className="mr-3 text-lg">🚪</span>
                  {common('logout')}
                </button>
              </div>
            </div>
          )}
        </ClientOnly>
      </nav>

      {/* 앱스토어 심사 모드 메시지 */}
      <ClientOnly>
        {getCustomMessage() && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 mt-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-400 text-xl">ℹ️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {getCustomMessage()}
                </p>
              </div>
            </div>
          </div>
        )}
      </ClientOnly>

      {/* 메인 콘텐츠 */}
      <main className="pb-20 lg:pb-0">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold mb-4">{footer('appName')}</h3>
              <p className="text-gray-300 mb-4">
                {footer('appDescription')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{footer('services')}</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/ai-coach" className="hover:text-white">{footer('aiCoach')}</Link></li>
                <li><Link href="/counselors" className="hover:text-white">{footer('counseling')}</Link></li>
                <li><Link href="/growth-guide" className="hover:text-white">{footer('growthGuide')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{footer('counselors')}</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/counselor/register" className="hover:text-white">{footer('counselorRegister')}</Link></li>
                <li><Link href="/counselor/dashboard" className="hover:text-white">{footer('counselorDashboard')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>{footer('copyright')}</p>
          </div>
        </div>
      </footer>

      {/* 모바일 하단 네비게이션 (인증된 사용자만) */}
      <ClientOnly>
        {isAuthenticated && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
            <div className="grid grid-cols-4 gap-1">
              {navigationItems.slice(0, 4).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors ${
                    isActivePath(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <span className="text-lg mb-1">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </ClientOnly>

      {/* 모바일 메뉴 오버레이 */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-25 z-10"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}