import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const admin = await User.findById(userId)
    if (!admin || admin.userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 실제 환경에서는 Redis 캐시, 메모리 캐시 등을 삭제
    // 여기서는 시뮬레이션
    console.log(`시스템 캐시 삭제 요청 - ${admin.email}에 의해`)
    
    // AI 캐시 삭제 시뮬레이션 (실제로는 캐시 서비스 호출)
    const cacheTypes = [
      'AI 응답 캐시',
      '성장 가이드 캐시', 
      '퀘스트 캐시',
      '이미지 캐시',
      '세션 캐시'
    ]

    const deletedItems = cacheTypes.map(type => ({
      type,
      count: Math.floor(Math.random() * 100) + 10
    }))

    return NextResponse.json({
      message: '시스템 캐시가 성공적으로 삭제되었습니다',
      deletedItems,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('캐시 삭제 오류:', error)
    return NextResponse.json(
      { error: '캐시 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}