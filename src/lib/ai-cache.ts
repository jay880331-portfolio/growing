import DailyAICache from '@/models/DailyAICache'
import { getCurrentAIProvider } from './ai-service'
import dbConnect from './mongodb'

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * 일일 AI 캐시 조회
 */
export async function getDailyAICache(
  userId: string,
  cacheType: 'growth-guide' | 'quest' | 'health-alert',
  childId?: string
): Promise<any | null> {
  await dbConnect()
  
  try {
    const today = getTodayString()
    
    const cache = await DailyAICache.findOne({
      userId,
      childId: childId || null,
      cacheType,
      date: today
    })

    if (cache) {
      console.log(`캐시 적중: ${cacheType} for user ${userId}`)
      return cache.data
    }

    console.log(`캐시 미스: ${cacheType} for user ${userId}`)
    return null
  } catch (error) {
    console.error('캐시 조회 오류:', error)
    return null
  }
}

/**
 * 일일 AI 캐시 저장
 */
export async function setDailyAICache(
  userId: string,
  cacheType: 'growth-guide' | 'quest' | 'health-alert',
  data: any,
  childId?: string
): Promise<void> {
  await dbConnect()
  
  try {
    const today = getTodayString()
    
    console.log(`캐시 저장 시도: ${cacheType} for user ${userId}, date: ${today}`)
    
    const result = await DailyAICache.findOneAndUpdate(
      {
        userId,
        childId: childId || null,
        cacheType,
        date: today
      },
      {
        userId,
        childId: childId || null,
        cacheType,
        date: today,
        data,
        aiProvider: getCurrentAIProvider(),
        generatedAt: new Date()
      },
      {
        upsert: true,
        new: true
      }
    )

    console.log(`캐시 저장 성공: ${cacheType} for user ${userId}, ID: ${result._id}`)
  } catch (error) {
    console.error('캐시 저장 오류:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    throw error  // 에러를 다시 던져서 호출부에서 확인 가능
  }
}

/**
 * 캐시 만료 및 정리 (선택적)
 */
export async function clearExpiredCache(): Promise<void> {
  await dbConnect()
  
  try {
    const result = await DailyAICache.deleteMany({
      expiresAt: { $lt: new Date() }
    })
    
    console.log(`만료된 캐시 ${result.deletedCount}개 삭제`)
  } catch (error) {
    console.error('캐시 정리 오류:', error)
  }
}

/**
 * 특정 사용자의 모든 캐시 삭제 (디버깅용)
 */
export async function clearUserCache(userId: string): Promise<void> {
  await dbConnect()
  
  try {
    const result = await DailyAICache.deleteMany({ userId })
    console.log(`사용자 ${userId}의 캐시 ${result.deletedCount}개 삭제`)
  } catch (error) {
    console.error('사용자 캐시 삭제 오류:', error)
  }
}

/**
 * 캐시 통계 조회
 */
export async function getCacheStats(): Promise<{
  totalCaches: number
  cachesByType: Record<string, number>
  todayCaches: number
}> {
  await dbConnect()
  
  try {
    const today = getTodayString()
    
    const [totalCaches, cachesByType, todayCaches] = await Promise.all([
      DailyAICache.countDocuments(),
      DailyAICache.aggregate([
        { $group: { _id: '$cacheType', count: { $sum: 1 } } }
      ]),
      DailyAICache.countDocuments({ date: today })
    ])

    const cacheTypeStats = cachesByType.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {} as Record<string, number>)

    return {
      totalCaches,
      cachesByType: cacheTypeStats,
      todayCaches
    }
  } catch (error) {
    console.error('캐시 통계 조회 오류:', error)
    return {
      totalCaches: 0,
      cachesByType: {},
      todayCaches: 0
    }
  }
}