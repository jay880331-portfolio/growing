import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Child from '@/models/Child'
import GrowthLog from '@/models/GrowthLog'

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

    // 관리자 권한 확인
    const admin = await User.findById(userId)
    if (!admin || admin.userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    
    // 날짜 범위 설정
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 }
    const days = daysMap[range as keyof typeof daysMap] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 병렬 데이터 조회
    const [
      totalUsers,
      activeUsers,
      totalChildren,
      totalLogs,
      recentUsers,
      recentLogs
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ 
        updatedAt: { $gte: startDate } 
      }),
      Child.countDocuments({}),
      GrowthLog.countDocuments({}),
      User.find({ 
        createdAt: { $gte: startDate } 
      }).select('createdAt'),
      GrowthLog.find({ 
        createdAt: { $gte: startDate } 
      }).select('category createdAt')
    ])

    // 사용자 증가 추이 계산
    const userGrowthMap = new Map()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      userGrowthMap.set(dateStr, { date: dateStr, newUsers: 0, totalUsers: 0 })
    }

    recentUsers.forEach(user => {
      const dateStr = user.createdAt.toISOString().split('T')[0]
      if (userGrowthMap.has(dateStr)) {
        userGrowthMap.get(dateStr).newUsers++
      }
    })

    // 누적 사용자 수 계산
    let cumulativeUsers = totalUsers - recentUsers.length
    const userGrowth = Array.from(userGrowthMap.values()).map(day => {
      cumulativeUsers += day.newUsers
      return { ...day, totalUsers: cumulativeUsers }
    })

    // AI 사용량 통계 (모의 데이터)
    const aiUsageStats = {
      byProvider: {
        openai: Math.floor(Math.random() * 1000) + 500,
        gemini: Math.floor(Math.random() * 500) + 200
      },
      byType: {
        chat: Math.floor(Math.random() * 300) + 200,
        analysis: Math.floor(Math.random() * 400) + 300,
        quest: Math.floor(Math.random() * 200) + 100,
        guide: Math.floor(Math.random() * 250) + 150
      },
      byPlan: {
        free: Math.floor(Math.random() * 800) + 400,
        premium: Math.floor(Math.random() * 300) + 150
      }
    }

    // 인기 기능 통계
    const featureUsage = {
      '성장 기록': recentLogs.filter(log => log.category === 'growth').length,
      '수면 기록': recentLogs.filter(log => log.category === 'sleep').length,
      '식사 기록': recentLogs.filter(log => log.category === 'feeding').length,
      'AI 코치': Math.floor(Math.random() * 200) + 100,
      '성장 가이드': Math.floor(Math.random() * 150) + 80
    }

    const totalFeatureUsage = Object.values(featureUsage).reduce((a, b) => a + b, 0)
    const topFeatures = Object.entries(featureUsage)
      .map(([feature, count]) => ({
        feature,
        usageCount: count,
        percentage: totalFeatureUsage > 0 ? Math.round((count / totalFeatureUsage) * 100) : 0
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)

    // 오류 통계 (모의 데이터)
    const errorStats = {
      total: Math.floor(Math.random() * 50) + 10,
      byType: [
        { type: 'API 오류', count: Math.floor(Math.random() * 20) + 5 },
        { type: '인증 오류', count: Math.floor(Math.random() * 15) + 3 },
        { type: '데이터베이스 오류', count: Math.floor(Math.random() * 10) + 2 },
        { type: '기타', count: Math.floor(Math.random() * 5) + 1 }
      ]
    }

    // 성능 통계 (모의 데이터)
    const performanceStats = {
      avgResponseTime: Math.floor(Math.random() * 200) + 100,
      successRate: 95 + Math.random() * 4,
      uptime: 99 + Math.random() * 1
    }

    const reports = {
      overview: {
        totalUsers,
        activeUsers,
        totalChildren,
        totalLogs,
        totalAiRequests: aiUsageStats.byProvider.openai + aiUsageStats.byProvider.gemini,
        totalCost: ((aiUsageStats.byProvider.openai * 0.001) + (aiUsageStats.byProvider.gemini * 0.0005))
      },
      userGrowth,
      aiUsageStats,
      topFeatures,
      errorStats,
      performanceStats
    }

    return NextResponse.json({
      reports
    })
  } catch (error) {
    console.error('리포트 조회 오류:', error)
    return NextResponse.json(
      { error: '리포트 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}