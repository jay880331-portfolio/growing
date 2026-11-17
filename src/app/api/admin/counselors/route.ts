import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Counselor from '@/models/Counselor'

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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 필터 조건 구성
    const filter: any = {}
    if (status) {
      filter.status = status
    }
    if (verified !== null) {
      filter.isVerified = verified === 'true'
    }

    const counselors = await Counselor.find(filter)
      .populate('userId', 'name email createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const total = await Counselor.countDocuments(filter)

    return NextResponse.json({
      counselors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('상담사 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '상담사 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}