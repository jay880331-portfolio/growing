'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

export default function AuthChecker() {
  const { token, isHydrated, validateAuth, setHydrated } = useAuthStore()

  useEffect(() => {
    // Zustand가 hydrate된 후 인증 상태 검증
    if (!isHydrated) {
      setHydrated()
      
      // 토큰이 있으면 검증
      if (token) {
        validateAuth()
      }
    }
  }, [token, isHydrated, validateAuth, setHydrated])

  return null // 이 컴포넌트는 UI를 렌더링하지 않음
}