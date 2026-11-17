import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        aiUsage: user.aiUsage,
        subscription: user.subscription,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('현재 사용자 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '사용자 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}