import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { USAGE_LIMITS } from '@/lib/ai-usage-tracker'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    // 모든 사용자의 AI 사용량 설정 확인 및 수정
    const users = await User.find({})
    
    let fixedCount = 0
    
    for (const user of users) {
      let needsUpdate = false
      
      // aiUsage가 없거나 잘못된 경우 초기화
      if (!user.aiUsage) {
        user.aiUsage = {
          monthlyUsed: 0,
          monthlyLimit: 50,
          lastReset: new Date(),
          plan: 'free'
        }
        needsUpdate = true
      } else {
        // monthlyLimit이 0이거나 설정되지 않은 경우
        if (!user.aiUsage.monthlyLimit || user.aiUsage.monthlyLimit === 0) {
          const plan = user.aiUsage.plan || 'free'
          user.aiUsage.monthlyLimit = USAGE_LIMITS[plan as keyof typeof USAGE_LIMITS] || 50
          needsUpdate = true
        }
        
        // plan이 설정되지 않은 경우
        if (!user.aiUsage.plan) {
          user.aiUsage.plan = 'free'
          needsUpdate = true
        }
        
        // lastReset이 설정되지 않은 경우
        if (!user.aiUsage.lastReset) {
          user.aiUsage.lastReset = new Date()
          needsUpdate = true
        }
      }
      
      if (needsUpdate) {
        await user.save()
        fixedCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${fixedCount}명의 사용자 데이터를 수정했습니다.`,
      totalUsers: users.length,
      fixedUsers: fixedCount
    })
  } catch (error) {
    console.error('사용량 데이터 수정 오류:', error)
    return NextResponse.json(
      { error: '데이터 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}