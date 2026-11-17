import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import mongoose from 'mongoose'

// UpgradeRequest 모델 (동일한 스키마 재사용)
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

const UpgradeRequest = mongoose.models.UpgradeRequest || mongoose.model('UpgradeRequest', UpgradeRequestSchema)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { status, notes } = await request.json()
    const resolvedParams = await params
    const requestId = resolvedParams.id

    const updateData: any = {}
    if (status !== undefined) {
      updateData.status = status
      
      // 상태별 타임스탬프 업데이트
      if (status === 'contacted') {
        updateData.contactedAt = new Date()
      } else if (status === 'completed') {
        updateData.completedAt = new Date()
      }
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const upgradeRequest = await UpgradeRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    ).populate('userId', 'name email')

    if (!upgradeRequest) {
      return NextResponse.json(
        { error: '업그레이드 신청을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 상태 변경 로그
    console.log(`업그레이드 신청 상태 변경:`, {
      requestId,
      userId: upgradeRequest.userId._id,
      userEmail: upgradeRequest.userId.email,
      oldStatus: upgradeRequest.status,
      newStatus: status,
      adminId: userId
    })

    return NextResponse.json({
      message: '업그레이드 신청 상태가 업데이트되었습니다',
      request: upgradeRequest
    })
  } catch (error) {
    console.error('업그레이드 신청 상태 업데이트 오류:', error)
    return NextResponse.json(
      { error: '업그레이드 신청 상태 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}