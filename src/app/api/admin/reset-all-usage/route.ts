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

    // 모든 사용자의 AI 사용량 리셋
    const result = await User.updateMany(
      {},
      {
        'aiUsage.monthlyUsed': 0,
        'aiUsage.lastReset': new Date()
      }
    )

    console.log(`전체 사용량 리셋: ${result.modifiedCount}명의 사용자 - ${admin.email}에 의해`)

    return NextResponse.json({
      message: `${result.modifiedCount}명의 사용자 AI 사용량이 리셋되었습니다`,
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error('전체 사용량 리셋 오류:', error)
    return NextResponse.json(
      { error: '전체 사용량 리셋 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}