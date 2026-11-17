import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import mongoose from 'mongoose'

// 업그레이드 신청 데이터 모델
interface IUpgradeRequest {
  _id: string
  userId: string
  email: string
  currentPlan: string
  requestedPlan: string
  status: 'pending' | 'contacted' | 'completed' | 'cancelled'
  createdAt: Date
  contactedAt?: Date
  completedAt?: Date
  notes?: string
}

const UpgradeRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    currentPlan: {
      type: String,
      required: true,
    },
    requestedPlan: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'completed', 'cancelled'],
      default: 'pending',
    },
    contactedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

const UpgradeRequest = mongoose.models.UpgradeRequest || mongoose.model<IUpgradeRequest>('UpgradeRequest', UpgradeRequestSchema)

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

    const { plan, email, currentPlan } = await request.json()

    if (!plan || !email) {
      return NextResponse.json(
        { error: '플랜과 이메일이 필요합니다' },
        { status: 400 }
      )
    }

    // 이미 대기 중인 신청이 있는지 확인
    const existingRequest = await UpgradeRequest.findOne({
      userId,
      status: 'pending'
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: '이미 처리 중인 업그레이드 신청이 있습니다' },
        { status: 400 }
      )
    }

    // 새로운 업그레이드 신청 생성
    const upgradeRequest = await UpgradeRequest.create({
      userId,
      email,
      currentPlan: currentPlan || 'free',
      requestedPlan: plan,
      status: 'pending'
    })

    // 관리자에게 알림 (향후 이메일 또는 슬랙 연동)
    console.log(`새로운 업그레이드 신청:`, {
      userId,
      email,
      currentPlan,
      requestedPlan: plan,
      requestId: upgradeRequest._id
    })

    return NextResponse.json({
      message: '업그레이드 신청이 완료되었습니다',
      requestId: upgradeRequest._id
    })
  } catch (error) {
    console.error('업그레이드 신청 처리 오류:', error)
    return NextResponse.json(
      { error: '업그레이드 신청 처리 중 오류가 발생했습니다' },
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

    // 관리자 권한 확인 (관리자만 전체 신청 목록 조회 가능)
    const user = await User.findById(userId)
    if (user?.userType === 'admin') {
      const requests = await UpgradeRequest.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(50)

      return NextResponse.json({ requests })
    } else {
      // 일반 사용자는 본인 신청만 조회
      const requests = await UpgradeRequest.find({ userId })
        .sort({ createdAt: -1 })

      return NextResponse.json({ requests })
    }
  } catch (error) {
    console.error('업그레이드 신청 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '업그레이드 신청 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}