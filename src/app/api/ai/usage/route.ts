import { NextRequest, NextResponse } from 'next/server'
import { checkAIUsageLimit, getMonthlyUsageStats, upgradeAIPlan, PLAN_PRICING } from '@/lib/ai-usage-tracker'
import dbConnect from '@/lib/mongodb'

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

    const url = new URL(request.url)
    const year = url.searchParams.get('year')
    const month = url.searchParams.get('month')

    // 현재 사용량 정보 조회
    const usageInfo = await checkAIUsageLimit(userId)
    
    // 월별 통계 조회
    const stats = await getMonthlyUsageStats(
      userId, 
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined
    )

    return NextResponse.json({
      currentUsage: usageInfo,
      monthlyStats: stats,
      planPricing: PLAN_PRICING
    })
  } catch (error) {
    console.error('AI 사용량 조회 오류:', error)
    return NextResponse.json(
      { error: '사용량 정보를 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}

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

    const { action, plan } = await request.json()

    if (action === 'upgrade' && plan) {
      if (!['free', 'premium'].includes(plan)) {
        return NextResponse.json(
          { error: '유효하지 않은 플랜입니다' },
          { status: 400 }
        )
      }

      await upgradeAIPlan(userId, plan)
      
      return NextResponse.json({
        success: true,
        message: `${plan} 플랜으로 업그레이드되었습니다`
      })
    }

    return NextResponse.json(
      { error: '유효하지 않은 요청입니다' },
      { status: 400 }
    )
  } catch (error) {
    console.error('AI 플랜 업그레이드 오류:', error)
    return NextResponse.json(
      { error: '플랜 업그레이드 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}