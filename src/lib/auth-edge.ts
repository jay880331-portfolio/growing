// Edge Runtime 호환 버전의 인증 함수
export function verifyTokenEdge(token: string): { userId: string; email: string } | null {
  try {
    console.log('🔍 토큰 검증 시작:', token.substring(0, 50) + '...')
    
    // Edge Runtime에서는 JWT 검증을 간단하게 처리
    // 실제 프로덕션에서는 Edge 호환 JWT 라이브러리 사용 권장
    const [header, payload, signature] = token.split('.')
    console.log('🔍 토큰 분할:', { 
      hasHeader: !!header, 
      hasPayload: !!payload, 
      hasSignature: !!signature 
    })
    
    if (!header || !payload || !signature) {
      console.log('❌ 토큰 형식 오류: 3개 부분으로 분할되지 않음')
      return null
    }
    
    const decodedPayload = JSON.parse(atob(payload))
    console.log('🔍 디코딩된 페이로드:', JSON.stringify(decodedPayload, null, 2))
    
    // 만료 시간 확인
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
      console.log('❌ 토큰 만료됨:', { 
        exp: decodedPayload.exp, 
        now: Date.now() / 1000,
        expired: true
      })
      return null
    }
    
    console.log('✅ 토큰 검증 성공:', {
      userId: decodedPayload.userId,
      email: decodedPayload.email
    })
    
    return {
      userId: decodedPayload.userId,
      email: decodedPayload.email,
    }
  } catch (error) {
    console.log('❌ 토큰 검증 실패:', error)
    return null
  }
}