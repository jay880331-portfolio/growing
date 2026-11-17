import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Counselor from '@/models/Counselor'

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
    const user = await User.findById(userId)
    if (!user || user.userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const { status, isVerified } = await request.json()
    const resolvedParams = await params
    const counselorId = resolvedParams.id

    const updateData: any = {}
    if (status !== undefined) {
      updateData.status = status
    }
    if (isVerified !== undefined) {
      updateData.isVerified = isVerified
      if (isVerified) {
        updateData.verificationDate = new Date()
      }
    }

    const counselor = await Counselor.findByIdAndUpdate(
      counselorId,
      updateData,
      { new: true }
    ).populate('userId', 'name email')

    if (!counselor) {
      return NextResponse.json(
        { error: '상담사를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 승인/거부 시 이메일 알림 로직 (향후 구현)
    if (status === 'active' && isVerified) {
      console.log(`상담사 승인: ${counselor.userId.email}`)
      // 승인 이메일 발송 로직
    } else if (status === 'suspended') {
      console.log(`상담사 정지: ${counselor.userId.email}`)
      // 정지 이메일 발송 로직
    }

    return NextResponse.json({
      message: '상담사 상태가 업데이트되었습니다',
      counselor
    })
  } catch (error) {
    console.error('상담사 상태 업데이트 오류:', error)
    return NextResponse.json(
      { error: '상담사 상태 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}