import User from '@/models/User'
import AIUsageLog from '@/models/AIUsageLog'
import connectToDatabase from '@/lib/mongodb'

// AI 제공자별 비용 계산 (USD 기준)
const AI_PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  openai: {
    'gpt-4.1-nano-2025-04-14': {
      input: 0.00015,  // $0.00015 per 1K tokens
      output: 0.0006,  // $0.0006 per 1K tokens
    }
  },
  gemini: {
    'gemini-2.5-flash-preview-05-20': {
      input: 0.000075, // $0.000075 per 1K tokens  
      output: 0.0003,  // $0.0003 per 1K tokens
    }
  }
}

// 플랜별 월 사용량 제한
export const USAGE_LIMITS = {
  free: 50,
  premium: 500
}

// 플랜별 가격 (월/KRW)
export const PLAN_PRICING = {
  free: 0,
  premium: 4900    // 4,900원
}

/**
 * 사용자의 AI 사용량 확인 및 제한 체크
 */
export async function checkAIUsageLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  totalUsed: number
  plan: string
  resetDate: Date
}> {
  await connectToDatabase()
  
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 월별 사용량 리셋 체크
    const now = new Date()
    const lastReset = new Date(user.aiUsage.lastReset)
    const shouldReset = (
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()
    )

    if (shouldReset) {
      user.aiUsage.monthlyUsed = 0
      user.aiUsage.lastReset = now
      await user.save()
    }

    // 기본값 보장
    const limit = user.aiUsage.monthlyLimit || USAGE_LIMITS[user.aiUsage.plan as keyof typeof USAGE_LIMITS] || 50
    const used = user.aiUsage.monthlyUsed || 0
    const remaining = Math.max(0, limit - used)
    
    // monthlyLimit이 0이거나 설정되지 않은 경우 업데이트
    if (!user.aiUsage.monthlyLimit || user.aiUsage.monthlyLimit === 0) {
      user.aiUsage.monthlyLimit = limit
      await user.save()
    }
    
    // 다음 달 1일 계산
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    return {
      allowed: remaining > 0,
      remaining,
      totalUsed: used,
      plan: user.aiUsage.plan,
      resetDate: nextMonth
    }
  } catch (error) {
    console.error('AI 사용량 확인 오류:', error)
    return {
      allowed: false,
      remaining: 0,
      totalUsed: 0,
      plan: 'free',
      resetDate: new Date()
    }
  }
}

/**
 * AI 사용량 로깅 및 사용자 사용량 업데이트
 */
export async function logAIUsage(params: {
  userId: string
  endpoint: string
  provider: 'openai' | 'gemini'
  model: string
  inputTokens: number
  outputTokens: number
  requestType: 'chat' | 'analysis' | 'quest' | 'guide' | 'pattern-detection' | 'input-helper'
  childId?: string
  responseTime: number
  success: boolean
  errorMessage?: string
  metadata?: {
    promptLength: number
    responseLength: number
    features?: string[]
  }
}): Promise<void> {
  await connectToDatabase()

  try {
    // 비용 계산
    const pricing = AI_PRICING[params.provider]?.[params.model]
    const cost = pricing ? 
      (params.inputTokens / 1000 * pricing.input) + 
      (params.outputTokens / 1000 * pricing.output) : 0

    // 사용량 로그 생성
    const usageLog = new AIUsageLog({
      userId: params.userId,
      endpoint: params.endpoint,
      provider: params.provider,
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      totalTokens: params.inputTokens + params.outputTokens,
      cost,
      requestType: params.requestType,
      childId: params.childId,
      responseTime: params.responseTime,
      success: params.success,
      errorMessage: params.errorMessage,
      metadata: params.metadata
    })

    await usageLog.save()

    // 성공한 요청만 사용자 사용량에 반영
    if (params.success) {
      await User.findByIdAndUpdate(
        params.userId,
        { $inc: { 'aiUsage.monthlyUsed': 1 } }
      )
    }

    console.log(`AI 사용량 로깅 완료 - User: ${params.userId}, Cost: $${cost.toFixed(6)}`)
  } catch (error) {
    console.error('AI 사용량 로깅 오류:', error)
    // 로깅 실패가 API 요청을 차단하지 않도록 에러를 던지지 않음
  }
}

/**
 * 월별 사용량 통계 조회
 */
export async function getMonthlyUsageStats(userId: string, year?: number, month?: number) {
  await connectToDatabase()

  const now = new Date()
  const targetYear = year || now.getFullYear()
  const targetMonth = month || now.getMonth() + 1

  const startDate = new Date(targetYear, targetMonth - 1, 1)
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)

  try {
    const stats = await AIUsageLog.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: startDate, $lte: endDate },
          success: true
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          totalTokens: { $sum: '$totalTokens' },
          requestsByType: {
            $push: {
              type: '$requestType',
              count: 1,
              cost: '$cost'
            }
          },
          providerUsage: {
            $push: {
              provider: '$provider',
              count: 1,
              cost: '$cost'
            }
          }
        }
      }
    ])

    return stats[0] || {
      totalRequests: 0,
      totalCost: 0,
      totalTokens: 0,
      requestsByType: [],
      providerUsage: []
    }
  } catch (error) {
    console.error('월별 사용량 통계 조회 오류:', error)
    return {
      totalRequests: 0,
      totalCost: 0,
      totalTokens: 0,
      requestsByType: [],
      providerUsage: []
    }
  }
}

/**
 * 사용자의 AI 플랜 업그레이드
 */
export async function upgradeAIPlan(userId: string, newPlan: 'free' | 'premium'): Promise<void> {
  await connectToDatabase()

  try {
    const newLimit = USAGE_LIMITS[newPlan]
    
    await User.findByIdAndUpdate(userId, {
      'aiUsage.plan': newPlan,
      'aiUsage.monthlyLimit': newLimit,
      'subscription.plan': newPlan,
      'subscription.status': 'active',
      'subscription.validUntil': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
    })

    console.log(`사용자 ${userId} AI 플랜 업그레이드: ${newPlan}`)
  } catch (error) {
    console.error('AI 플랜 업그레이드 오류:', error)
    throw error
  }
}

/**
 * AI 사용량 제한 미들웨어 (API 라우트에서 사용)
 */
export async function aiUsageLimitMiddleware(userId: string): Promise<{
  proceed: boolean
  error?: string
  usageInfo?: any
}> {
  try {
    const usageCheck = await checkAIUsageLimit(userId)
    
    if (!usageCheck.allowed) {
      return {
        proceed: false,
        error: `월 사용량 한도를 초과했습니다. (${usageCheck.totalUsed}/${usageCheck.totalUsed + usageCheck.remaining}) 플랜 업그레이드를 고려해보세요.`,
        usageInfo: usageCheck
      }
    }

    return {
      proceed: true,
      usageInfo: usageCheck
    }
  } catch (error) {
    console.error('AI 사용량 제한 미들웨어 오류:', error)
    return {
      proceed: false,
      error: '사용량 확인 중 오류가 발생했습니다.'
    }
  }
}