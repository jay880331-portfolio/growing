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
    const period = searchParams.get('period') || 'weekly' // daily, weekly, monthly
    
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
    
    // 기간 설정
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
    
    // 성장 기록 조회
    const logs = await GrowthLog.find({
      childId,
      timestamp: { $gte: startDate, $lte: now }
    }).sort({ timestamp: -1 })
    
    // 기존 AI 인사이트 조회
    const existingInsights = await AIInsight.find({
      childId,
      type: period,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 })
    
    // 데이터 분석
    const stats = {
      totalLogs: logs.length,
      sleepLogs: logs.filter(log => log.type === 'sleep').length,
      mealLogs: logs.filter(log => log.type === 'meal').length,
      activityLogs: logs.filter(log => log.type === 'activity').length,
      milestoneLogs: logs.filter(log => log.type === 'milestone').length,
    }
    
    // 수면 패턴 분석
    const sleepLogs = logs.filter(log => log.type === 'sleep')
    const avgSleepHours = sleepLogs.length > 0 
      ? sleepLogs.reduce((sum, log) => sum + (log.data.duration || 0), 0) / sleepLogs.length
      : 0
    
    // 식사 패턴 분석
    const mealLogs = logs.filter(log => log.type === 'meal')
    const avgMealsPerDay = mealLogs.length / Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)))
    
    // AI 인사이트가 없으면 새로 생성
    let aiInsights = existingInsights
    if (existingInsights.length === 0 && logs.length > 5) {
      try {
        const analysisData = {
          child: {
            name: child.name,
            ageInMonths: Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30)),
            gender: child.gender
          },
          period,
          stats,
          recentLogs: logs.slice(0, 10).map(log => ({
            type: log.type,
            timestamp: log.timestamp,
            data: log.data
          }))
        }
        
        const analysis = await analyzeChildData(analysisData)
        
        // AI 인사이트 저장
        const newInsight = await AIInsight.create({
          childId,
          type: period,
          category: 'development',
          title: `${period === 'daily' ? '일간' : period === 'weekly' ? '주간' : '월간'} 성장 분석`,
          content: analysis.insights.join('\n'),
          recommendations: analysis.recommendations,
          confidence: analysis.confidence,
          dataPoints: logs.map(log => log._id)
        })
        
        aiInsights = [newInsight]
      } catch (error) {
        console.error('AI 분석 오류:', error)
      }
    }
    
    const report = {
      child: {
        id: child._id,
        name: child.name,
        ageInMonths: Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      },
      period,
      dateRange: {
        start: startDate,
        end: now
      },
      stats,
      patterns: {
        avgSleepHours: Math.round(avgSleepHours * 10) / 10,
        avgMealsPerDay: Math.round(avgMealsPerDay * 10) / 10,
      },
      insights: aiInsights,
      recentLogs: logs.slice(0, 10)
    }
    
    return NextResponse.json({ report })
  } catch (error) {
    console.error('리포트 생성 오류:', error)
    return NextResponse.json(
      { error: '리포트 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}