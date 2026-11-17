import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const targetUserId = resolvedParams.id

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      {
        'aiUsage.monthlyUsed': 0,
        'aiUsage.lastReset': new Date()
      },
      { new: true }
    ).select('-password')

    if (!updatedUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    console.log(`AI 사용량 리셋: ${updatedUser.email} - ${admin.email}에 의해`)

    return NextResponse.json({
      message: 'AI 사용량이 리셋되었습니다',
      user: updatedUser
    })
  } catch (error) {
    console.error('AI 사용량 리셋 오류:', error)
    return NextResponse.json(
      { error: 'AI 사용량 리셋 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}