import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function PATCH(
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

    const { userType, aiUsage, subscription } = await request.json()
    const resolvedParams = await params
    const targetUserId = resolvedParams.id

    // 자기 자신의 권한은 변경할 수 없음
    if (targetUserId === userId && userType && userType !== admin.userType) {
      return NextResponse.json(
        { error: '자신의 관리자 권한은 변경할 수 없습니다' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (userType !== undefined) {
      updateData.userType = userType
    }
    if (aiUsage !== undefined) {
      updateData.aiUsage = aiUsage
    }
    if (subscription !== undefined) {
      updateData.subscription = subscription
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      updateData,
      { new: true }
    ).select('-password')

    if (!updatedUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    console.log(`사용자 정보 변경: ${updatedUser.email} - ${admin.email}에 의해`)

    return NextResponse.json({
      message: '사용자 정보가 업데이트되었습니다',
      user: updatedUser
    })
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error)
    return NextResponse.json(
      { error: '사용자 정보 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}