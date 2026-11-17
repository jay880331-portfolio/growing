import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import GrowthLog from '@/models/GrowthLog'
import Child from '@/models/Child'
import { generateMonthlyGrowthGuide } from '@/lib/ai-service'
import { getDailyAICache, setDailyAICache } from '@/lib/ai-cache'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')
    
    if (!childId) {
      return NextResponse.json(
        { error: '아이 ID가 필요합니다' },
        { status: 400 }
      )
    }
    
    // 사용자의 아이인지 확인
    const child = await Child.findOne({ _id: childId, userId })
    if (!child) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 아이 나이 계산
    const childAge = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))

    // 1. 캐시된 가이드 확인
    const cachedGuide = await getDailyAICache(userId!, 'growth-guide', childId)
    
    if (cachedGuide) {
      console.log('성장 가이드 캐시 사용')
      return NextResponse.json({
        ...cachedGuide,
        fromCache: true,
        cacheInfo: {
          message: '오늘 이미 생성된 가이드입니다',
          generatedAt: cachedGuide.generatedAt
        }
      })
    }

    // 2. 캐시가 없을 때만 AI 생성
    console.log('성장 가이드 새로 생성 중...')
    
    // 최근 기록 조회 (선택적)
    const recentLogs = await GrowthLog.find({
      childId,
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ timestamp: -1 }).limit(10)

    // AI 월령별 가이드 생성
    const guide = await generateMonthlyGrowthGuide({
      childAge,
      childInfo: {
        name: child.name,
        gender: child.gender,
        birthDate: child.birthDate
      },
      currentLogs: recentLogs.length > 0 ? recentLogs.map(log => ({
        type: log.type,
        data: log.data,
        timestamp: log.timestamp.toISOString()
      })) : undefined
    })

    // 3. 가이드 데이터 준비
    const guideData = {
      ...guide,
      childInfo: {
        name: child.name,
        age: childAge,
        gender: child.gender
      },
      generatedAt: new Date().toISOString()
    }

    // 4. 캐시에 저장
    await setDailyAICache(userId!, 'growth-guide', guideData, childId)

    return NextResponse.json({
      ...guideData,
      fromCache: false,
      cacheInfo: {
        message: '새로 생성된 가이드입니다',
        generatedAt: guideData.generatedAt
      }
    })
  } catch (error) {
    console.error('성장 가이드 조회 오류:', error)
    return NextResponse.json(
      { error: '성장 가이드를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}