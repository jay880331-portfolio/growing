import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  userType?: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isHydrated: boolean
  adminMode: boolean
  login: (token: string, user: User) => void
  logout: () => void
  validateAuth: () => Promise<void>
  setHydrated: () => void
  toggleAdminMode: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      adminMode: true, // 관리자는 기본적으로 관리자 모드
      login: (token, user) => set({ 
        token, 
        user, 
        isAuthenticated: true,
        adminMode: user.userType === 'admin' // 관리자면 관리자 모드 활성화
      }),
      logout: () => set({ 
        token: null, 
        user: null, 
        isAuthenticated: false, 
        adminMode: false 
      }),
      setHydrated: () => set({ isHydrated: true }),
      toggleAdminMode: () => {
        const { user } = get()
        if (user?.userType === 'admin') {
          set(state => ({ adminMode: !state.adminMode }))
        }
      },
      validateAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false })
          return
        }

        try {
          const response = await fetch('/api/auth/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            set({ 
              user: data.user, 
              isAuthenticated: true 
            })
          } else {
            // 토큰이 유효하지 않으면 로그아웃
            set({ 
              token: null, 
              user: null, 
              isAuthenticated: false 
            })
          }
        } catch (error) {
          console.error('인증 검증 오류:', error)
          set({ 
            token: null, 
            user: null, 
            isAuthenticated: false 
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)