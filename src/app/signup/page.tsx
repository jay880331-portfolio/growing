'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { useTranslation } from '@/hooks/useTranslation'
import Layout from '@/components/Layout'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const { login } = useAuthStore()
  const { t, auth, common } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다')
      }

      login(data.token, data.user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* 로고/아이콘 영역 */}
          <div className="text-center mb-6 lg:mb-8">
            <div className="text-4xl lg:text-6xl mb-4">🌱</div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
              {t('signup.title')}
            </h2>
            <p className="mt-2 text-sm lg:text-base text-gray-600">
              {t('signup.subtitle')}
            </p>
          </div>
          
          <div className="bg-white py-6 lg:py-8 px-6 lg:px-8 shadow-lg rounded-lg">
            <div className="mb-6">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 text-center mb-2">{t('auth.signupTitle')}</h3>
              <p className="text-center text-sm text-gray-600">
                {t('auth.hasAccount')}{' '}
                <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  {t('auth.loginButton')}
                </Link>
              </p>
            </div>
            
            <form className="space-y-4 lg:space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-50 p-3 lg:p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.name')}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base lg:text-sm"
                    placeholder={t('auth.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.email')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base lg:text-sm"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.password')}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base lg:text-sm"
                    placeholder={t('signup.passwordMinLength')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('signup.passwordError')}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 lg:py-2 px-4 border border-transparent text-base lg:text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('signup.signingUp') : t('auth.signupButton')}
              </button>
            </form>
            
            {/* 서비스 안내 */}
            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs lg:text-sm text-green-800 text-center leading-relaxed">
                <strong>🎉 가입하시면 다음을 이용할 수 있어요:</strong><br />
                • AI 기반 성장 분석 및 조언<br />
                • 월령별 맞춤 발달 가이드<br />
                • 일일 퀘스트 및 활동 추천
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}