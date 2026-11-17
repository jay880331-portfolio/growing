import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Counselor from '@/models/Counselor'
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
    const user = await User.findById(userId)
    if (!user || user.userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 병렬로 통계 데이터 수집
    const [
      totalUsers,
      totalCounselors,
      pendingCounselors,
      activeCounselors,
      totalChildren,
      totalLogs,
      todayLogs,
      monthlyAiUsage
    ] = await Promise.all([
      User.countDocuments(),
      Counselor.countDocuments(),
      Counselor.countDocuments({ status: 'inactive', isVerified: false }),
      Counselor.countDocuments({ status: 'active', isVerified: true }),
      Child.countDocuments(),
      GrowthLog.countDocuments(),
      GrowthLog.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalUsage: { $sum: '$aiUsage.monthlyUsed' }
          }
        }
      ])
    ])

    const stats = {
      totalUsers,
      totalCounselors,
      pendingCounselors,
      activeCounselors,
      totalChildren,
      totalLogs,
      aiUsageToday: todayLogs,
      aiUsageMonth: monthlyAiUsage[0]?.totalUsage || 0
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('관리자 통계 조회 오류:', error)
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}