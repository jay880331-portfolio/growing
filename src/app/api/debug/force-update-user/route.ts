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

    console.log('사용자 ID:', userId)

    // MongoDB에서 직접 업데이트
    const updateResult = await User.updateOne(
      { _id: userId },
      {
        $set: {
          userType: 'parent',
          'aiUsage.monthlyUsed': 0,
          'aiUsage.monthlyLimit': 50,
          'aiUsage.lastReset': new Date(),
          'aiUsage.plan': 'free',
          'subscription.plan': 'free',
          'subscription.status': 'inactive',
          'subscription.validUntil': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      },
      { upsert: false }
    )

    console.log('업데이트 결과:', updateResult)

    // 업데이트 후 데이터 조회
    const updatedUser = await User.findById(userId)
    console.log('업데이트 후 사용자 데이터:', JSON.stringify(updatedUser?.toObject(), null, 2))

    return NextResponse.json({
      success: true,
      message: '강제 업데이트 완료',
      updateResult,
      updatedData: {
        userType: updatedUser?.userType,
        aiUsage: updatedUser?.aiUsage,
        subscription: updatedUser?.subscription
      }
    })
  } catch (error) {
    console.error('강제 업데이트 오류:', error)
    return NextResponse.json(
      { error: '강제 업데이트 중 오류가 발생했습니다', details: error },
      { status: 500 }
    )
  }
}