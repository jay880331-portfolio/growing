import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { USAGE_LIMITS } from '@/lib/ai-usage-tracker'

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

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // aiUsage 필드가 없으면 생성
    if (!user.aiUsage) {
      user.aiUsage = {}
    }

    // 기본값 설정
    const plan = user.aiUsage.plan || 'free'
    const monthlyLimit = USAGE_LIMITS[plan as keyof typeof USAGE_LIMITS] || 50

    // 모든 필드 강제 업데이트
    user.aiUsage = {
      monthlyUsed: user.aiUsage.monthlyUsed || 0,
      monthlyLimit: monthlyLimit,
      lastReset: user.aiUsage.lastReset || new Date(),
      plan: plan as 'free' | 'premium'
    }

    // userType이 없으면 설정
    if (!user.userType) {
      user.userType = 'parent'
    }

    // subscription이 없으면 설정
    if (!user.subscription) {
      user.subscription = {
        plan: 'free',
        status: 'inactive',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }

    console.log('수정 전 사용자 데이터:', JSON.stringify(user.toObject(), null, 2))
    
    const result = await user.save()
    
    console.log('수정 후 사용자 데이터:', JSON.stringify(result.toObject(), null, 2))

    return NextResponse.json({
      success: true,
      message: '사용자 데이터가 수정되었습니다.',
      beforeUpdate: {
        aiUsage: user.aiUsage,
        userType: user.userType,
        subscription: user.subscription
      },
      afterUpdate: {
        aiUsage: result.aiUsage,
        userType: result.userType,
        subscription: result.subscription
      }
    })
  } catch (error) {
    console.error('사용자 데이터 수정 오류:', error)
    return NextResponse.json(
      { error: '데이터 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}