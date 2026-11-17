import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import GrowthLog from '@/models/GrowthLog'
import Child from '@/models/Child'
import { detectAbnormalPatterns } from '@/lib/ai-service'
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

    // 최근 14일 기록 조회
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const recentLogs = await GrowthLog.find({
      childId,
      timestamp: { $gte: fourteenDaysAgo }
    }).sort({ timestamp: -1 })

    // 기록이 충분하지 않으면 분석하지 않음
    if (recentLogs.length < 5) {
      return NextResponse.json({
        alerts: [],
        normalPatterns: ['기록을 더 수집한 후 패턴 분석이 가능합니다.'],
        recommendations: ['최소 5개 이상의 기록이 필요합니다.'],
        message: 'insufficient_data'
      })
    }

    // 1. 캐시된 건강 알림 확인
    const cachedAlerts = await getDailyAICache(userId!, 'health-alert', childId)
    if (cachedAlerts) {
      console.log('건강 알림 캐시 사용')
      return NextResponse.json({
        ...cachedAlerts,
        fromCache: true,
        cacheInfo: {
          message: '오늘 이미 분석된 건강 알림입니다',
          generatedAt: cachedAlerts.generatedAt
        }
      })
    }

    // 아이 나이 계산
    const childAge = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))

    // 2. 캐시가 없을 때만 AI 분석
    console.log('건강 알림 새로 분석 중...')
    
    // AI 이상 패턴 감지
    const analysis = await detectAbnormalPatterns({
      childAge,
      recentLogs: recentLogs.map(log => ({
        type: log.type,
        data: log.data,
        timestamp: log.timestamp.toISOString(),
        notes: log.notes
      })),
      childInfo: {
        name: child.name,
        gender: child.gender,
        birthDate: child.birthDate
      }
    })

    // 3. 분석 결과 준비
    const alertsData = {
      ...analysis,
      stats: {
        totalLogs: recentLogs.length,
        analysisDate: new Date().toISOString(),
        childAge
      },
      generatedAt: new Date().toISOString()
    }

    // 4. 캐시에 저장
    await setDailyAICache(userId!, 'health-alert', alertsData, childId)

    return NextResponse.json({
      ...alertsData,
      fromCache: false,
      cacheInfo: {
        message: '새로 분석된 건강 알림입니다',
        generatedAt: alertsData.generatedAt
      }
    })
  } catch (error) {
    console.error('건강 알림 조회 오류:', error)
    return NextResponse.json(
      { error: '건강 알림을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}