import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const userType = searchParams.get('userType')
    const search = searchParams.get('search')

    // 필터 조건 구성
    const filter: any = {}
    if (userType && userType !== 'all') {
      filter.userType = userType
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // aiUsage와 subscription 필드가 없는 기존 사용자들을 위한 기본값 설정
    const normalizedUsers = users.map(user => ({
      ...user,
      aiUsage: user.aiUsage || {
        monthlyUsed: 0,
        monthlyLimit: 50,
        lastReset: new Date(),
        plan: 'free'
      },
      subscription: user.subscription || {
        plan: 'free',
        status: 'inactive',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }))

    const total = await User.countDocuments(filter)

    return NextResponse.json({
      users: normalizedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '사용자 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}