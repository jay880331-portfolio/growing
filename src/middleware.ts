import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/auth-edge'
import createIntlMiddleware from 'next-intl/middleware'

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ['ko', 'vi'],
  defaultLocale: 'ko',
  localePrefix: 'never' // Don't add locale prefix to URLs
})

export function middleware(request: NextRequest) {
  // Handle API routes with authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 보호된 라우트 정의
    const protectedPaths = ['/api/children', '/api/logs', '/api/reports', '/api/ai', '/api/insights', '/api/quests', '/api/upload', '/api/growth-guide', '/api/health-alerts', '/api/debug', '/api/admin', '/api/subscription', '/api/payment']
    
    // 인증 제외 경로 (관리자 설정용)
    const excludedPaths: string[] = []
    
    // GET 요청만 허용하는 경로들 (앱 설정 조회 등)
    const publicGetPaths = ['/api/admin/app-settings']
    
    const path = request.nextUrl.pathname
    const method = request.method
    
    const isExcludedPath = excludedPaths.some(p => path === p)
    const isPublicGetPath = publicGetPaths.some(p => path === p) && method === 'GET'
    const isProtectedPath = protectedPaths.some(p => path.startsWith(p)) && !isExcludedPath && !isPublicGetPath
    
    if (isProtectedPath) {
      const token = request.headers.get('authorization')?.replace('Bearer ', '')
      
      if (!token) {
        return NextResponse.json(
          { error: '인증이 필요합니다' },
          { status: 401 }
        )
      }
      
      try {
        const decoded = verifyTokenEdge(token)
        if (!decoded) {
          return NextResponse.json(
            { error: '유효하지 않은 토큰입니다' },
            { status: 401 }
          )
        }
        // 요청에 사용자 정보 추가
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', decoded.userId)
        requestHeaders.set('x-user-email', decoded.email)
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
      } catch (error) {
        return NextResponse.json(
          { error: '유효하지 않은 토큰입니다' },
          { status: 401 }
        )
      }
    }
    
    return NextResponse.next()
  }

  // Handle other routes with intl middleware
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Only match API routes for now
    '/api/:path*'
  ],
}