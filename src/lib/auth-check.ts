// 토큰 유효성 검사 함수
export async function validateToken(token: string): Promise<boolean> {
  if (!token) return false
  
  try {
    const response = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    
    return response.ok
  } catch (error) {
    console.error('토큰 검증 오류:', error)
    return false
  }
}

// JWT 토큰 만료 시간 확인
export function isTokenExpired(token: string): boolean {
  if (!token) return true
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    
    return payload.exp < currentTime
  } catch (error) {
    console.error('토큰 파싱 오류:', error)
    return true
  }
}