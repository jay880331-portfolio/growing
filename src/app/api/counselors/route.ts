import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Counselor from '@/models/Counselor'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get('specialty')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = searchParams.get('sort') || 'rating' // rating, price-low, price-high

    // 쿼리 조건
    const query: any = {
      status: 'active',
      isVerified: true
    }

    if (specialty) {
      query.specialties = specialty
    }

    // 정렬 조건
    let sortOption: any = {}
    switch (sort) {
      case 'rating':
        sortOption = { 'rating.average': -1, 'rating.count': -1 }
        break
      case 'price-low':
        sortOption = { 'pricing.pricePerHour': 1 }
        break
      case 'price-high':
        sortOption = { 'pricing.pricePerHour': -1 }
        break
      default:
        sortOption = { 'rating.average': -1 }
    }

    // 상담사 목록 조회
    const counselors = await Counselor.find(query)
      .populate({
        path: 'userId',
        select: 'name email',
        model: User
      })
      .sort(sortOption)
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-earnings -subscription.lastPayment')

    const total = await Counselor.countDocuments(query)

    return NextResponse.json({
      counselors,
      pagination: {
        total,
        page,
        limit,
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