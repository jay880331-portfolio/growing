import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import GrowthLog from '@/models/GrowthLog'
import Child from '@/models/Child'
import { analyzeGrowthLogRealtime } from '@/lib/ai-service'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // 사용자의 아이인지 확인
    if (childId) {
      const child = await Child.findOne({ _id: childId, userId })
      if (!child) {
        return NextResponse.json(
          { error: '권한이 없습니다' },
          { status: 403 }
        )
      }
    }
    
    // 쿼리 빌드
    const query: any = {}
    if (childId) query.childId = childId
    if (type) query.type = type
    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) query.timestamp.$gte = new Date(startDate)
      if (endDate) query.timestamp.$lte = new Date(endDate)
    }
    
    const logs = await GrowthLog.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
    
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('성장 기록 조회 오류:', error)
    return NextResponse.json(
      { error: '성장 기록을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const body = await request.json()
    
    const { childId, type, timestamp, data, media, notes } = body
    
    // 입력 검증
    if (!childId || !type || !data) {
      return NextResponse.json(
        { error: '필수 정보를 모두 입력해주세요' },
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
    
    const log = await GrowthLog.create({
      childId,
      type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      data,
      media,
      notes,
    })

    // AI 실시간 분석 수행
    let aiAnalysis = null
    try {
      // 최근 7일 기록 조회
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentLogs = await GrowthLog.find({
        childId,
        timestamp: { $gte: sevenDaysAgo }
      }).sort({ timestamp: -1 }).limit(10)

      // 아이 나이 계산
      const childAge = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))

      aiAnalysis = await analyzeGrowthLogRealtime({
        type,
        data,
        timestamp: log.timestamp.toISOString(),
        childAge,
        recentLogs: recentLogs.map(recentLog => ({
          type: recentLog.type,
          data: recentLog.data,
          timestamp: recentLog.timestamp.toISOString()
        }))
      })
    } catch (aiError) {
      console.error('AI 분석 오류:', aiError)
      // AI 분석 실패해도 기록 저장은 성공으로 처리
    }
    
    return NextResponse.json({ 
      log, 
      aiAnalysis 
    }, { status: 201 })
  } catch (error) {
    console.error('성장 기록 생성 오류:', error)
    return NextResponse.json(
      { error: '성장 기록 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}