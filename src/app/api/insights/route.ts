import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Child from '@/models/Child'
import GrowthLog from '@/models/GrowthLog'
import AIInsight from '@/models/AIInsight'
import { analyzeChildData } from '@/lib/ai-service'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')
    const type = searchParams.get('type') // daily, weekly, monthly, milestone, alert
    const category = searchParams.get('category') // development, health, behavior, nutrition, sleep
    
    // 쿼리 빌드
    const query: any = {}
    if (childId) {
      // 사용자의 아이인지 확인
      const child = await Child.findOne({ _id: childId, userId })
      if (!child) {
        return NextResponse.json(
          { error: '권한이 없습니다' },
          { status: 403 }
        )
      }
      query.childId = childId
    } else {
      // 사용자의 모든 아이들의 인사이트 조회
      const children = await Child.find({ userId })
      query.childId = { $in: children.map(child => child._id) }
    }
    
    if (type) query.type = type
    if (category) query.category = category
    
    const insights = await AIInsight.find(query)
      .populate('childId', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
    
    return NextResponse.json({ insights })
  } catch (error) {
    console.error('AI 인사이트 조회 오류:', error)
    return NextResponse.json(
      { error: 'AI 인사이트를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const { childId, type = 'manual', category = 'development' } = await request.json()
    
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
    
    // 최근 성장 기록 조회 (최근 30일)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentLogs = await GrowthLog.find({
      childId,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: -1 })
    
    if (recentLogs.length < 3) {
      return NextResponse.json(
        { error: '충분한 데이터가 없습니다. 더 많은 기록을 추가해주세요.' },
        { status: 400 }
      )
    }
    
    // 데이터 분석을 위한 구조화
    const analysisData = {
      child: {
        name: child.name,
        ageInMonths: Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30)),
        gender: child.gender
      },
      logs: recentLogs.map(log => ({
        type: log.type,
        timestamp: log.timestamp,
        data: log.data,
        notes: log.notes
      })),
      stats: {
        totalLogs: recentLogs.length,
        sleepLogs: recentLogs.filter(log => log.type === 'sleep').length,
        mealLogs: recentLogs.filter(log => log.type === 'meal').length,
        activityLogs: recentLogs.filter(log => log.type === 'activity').length,
        milestoneLogs: recentLogs.filter(log => log.type === 'milestone').length,
      }
    }
    
    // AI 분석 실행
    const analysis = await analyzeChildData(analysisData)
    
    // AI 인사이트 저장
    const insight = await AIInsight.create({
      childId,
      type,
      category,
      title: `${child.name}의 최근 성장 분석`,
      content: analysis.insights.join('\n\n'),
      recommendations: analysis.recommendations,
      confidence: analysis.confidence,
      dataPoints: recentLogs.map(log => log._id)
    })
    
    const populatedInsight = await AIInsight.findById(insight._id)
      .populate('childId', 'name')
    
    return NextResponse.json({ insight: populatedInsight }, { status: 201 })
  } catch (error) {
    console.error('AI 인사이트 생성 오류:', error)
    return NextResponse.json(
      { error: 'AI 인사이트 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}