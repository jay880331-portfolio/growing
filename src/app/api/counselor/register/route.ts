import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Counselor from '@/models/Counselor'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 이미 상담사로 등록되어 있는지 확인
    const existingCounselor = await Counselor.findOne({ userId })
    if (existingCounselor) {
      return NextResponse.json(
        { error: '이미 상담사로 등록되어 있습니다' },
        { status: 400 }
      )
    }

    const data = await request.json()

    // 필수 필드 검증
    if (!data.bio || data.bio.length < 100) {
      return NextResponse.json(
        { error: '자기소개는 최소 100자 이상 작성해주세요' },
        { status: 400 }
      )
    }

    if (!data.specialties || data.specialties.length === 0) {
      return NextResponse.json(
        { error: '최소 1개 이상의 전문분야를 선택해주세요' },
        { status: 400 }
      )
    }

    if (!data.certifications || !data.certifications.some((cert: any) => cert.name)) {
      return NextResponse.json(
        { error: '최소 1개 이상의 자격증 정보를 입력해주세요' },
        { status: 400 }
      )
    }

    // 상담사 정보 생성
    const counselor = await Counselor.create({
      userId,
      profileImage: data.profileImage,
      bio: data.bio,
      languages: data.languages,
      specialties: data.specialties,
      certifications: data.certifications,
      experience: data.experience,
      education: data.education,
      pricing: data.pricing,
      availability: data.availability,
      // 기본값들
      rating: { average: 0, count: 0 },
      isVerified: false,
      subscription: {
        plan: 'counselor-basic',
        status: 'pending',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      earnings: {
        totalEarned: 0,
        currentMonthEarned: 0,
        pendingPayout: 0
      },
      status: 'inactive' // 관리자 승인 전까지는 비활성
    })

    // 사용자 타입 업데이트
    await User.findByIdAndUpdate(userId, {
      userType: 'counselor',
      counselorId: counselor._id
    })

    return NextResponse.json({
      message: '상담사 등록이 완료되었습니다',
      counselor: {
        _id: counselor._id,
        status: counselor.status,
        isVerified: counselor.isVerified
      }
    })
  } catch (error) {
    console.error('상담사 등록 오류:', error)
    return NextResponse.json(
      { error: '상담사 등록 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

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

    const counselor = await Counselor.findOne({ userId })
    
    if (!counselor) {
      return NextResponse.json(
        { registered: false },
        { status: 200 }
      )
    }

    return NextResponse.json({
      registered: true,
      counselor: {
        _id: counselor._id,
        status: counselor.status,
        isVerified: counselor.isVerified,
        rating: counselor.rating,
        earnings: counselor.earnings,
        subscription: counselor.subscription
      }
    })
  } catch (error) {
    console.error('상담사 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '상담사 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}