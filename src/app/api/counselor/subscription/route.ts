import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Counselor from '@/models/Counselor'
import { getCounselorPlan, COUNSELOR_PLANS } from '@/utils/counselorPlans'

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

    const { planId, billingCycle } = await request.json()

    // 플랜 유효성 검증
    const plan = getCounselorPlan(planId)
    if (!plan) {
      return NextResponse.json(
        { error: '유효하지 않은 플랜입니다' },
        { status: 400 }
      )
    }

    // 상담사 정보 조회
    const counselor = await Counselor.findOne({ userId })
    if (!counselor) {
      return NextResponse.json(
        { error: '상담사 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 결제 처리 로직 (실제 결제 시스템 연동 필요)
    // 여기서는 시뮬레이션으로 처리
    const paymentSuccess = await processPayment({
      counselorId: counselor._id,
      planId,
      billingCycle,
      amount: billingCycle === 'yearly' ? plan.price * 12 * 0.8 : plan.price
    })

    if (!paymentSuccess) {
      return NextResponse.json(
        { error: '결제 처리 중 오류가 발생했습니다' },
        { status: 400 }
      )
    }

    // 구독 정보 업데이트
    const validUntil = new Date()
    if (billingCycle === 'yearly') {
      validUntil.setFullYear(validUntil.getFullYear() + 1)
    } else {
      validUntil.setMonth(validUntil.getMonth() + 1)
    }

    await Counselor.findByIdAndUpdate(counselor._id, {
      'subscription.plan': planId,
      'subscription.status': 'active',
      'subscription.validUntil': validUntil,
      'subscription.lastPayment': new Date()
    })

    return NextResponse.json({
      message: '구독 플랜이 성공적으로 변경되었습니다',
      subscription: {
        plan: planId,
        status: 'active',
        validUntil: validUntil.toISOString()
      }
    })
  } catch (error) {
    console.error('구독 변경 오류:', error)
    return NextResponse.json(
      { error: '구독 변경 중 오류가 발생했습니다' },
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

    const counselor = await Counselor.findOne({ userId }).select('subscription earnings')
    if (!counselor) {
      return NextResponse.json(
        { error: '상담사 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      subscription: counselor.subscription,
      earnings: counselor.earnings,
      availablePlans: COUNSELOR_PLANS
    })
  } catch (error) {
    console.error('구독 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '구독 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 결제 처리 시뮬레이션 (실제로는 PG사 API 연동)
async function processPayment(paymentData: {
  counselorId: string
  planId: string
  billingCycle: string
  amount: number
}): Promise<boolean> {
  // 실제 구현시에는 다음과 같은 PG사들과 연동:
  // - 토스페이먼츠
  // - 아임포트 (PortOne)
  // - 카카오페이
  // - 네이버페이 등
  
  console.log('결제 처리:', paymentData)
  
  // 시뮬레이션: 95% 확률로 성공
  const success = Math.random() > 0.05
  
  if (success) {
    console.log('결제 성공')
    // 결제 기록 저장 (PaymentHistory 모델 필요)
    // await PaymentHistory.create({
    //   counselorId: paymentData.counselorId,
    //   planId: paymentData.planId,
    //   amount: paymentData.amount,
    //   status: 'completed',
    //   paymentMethod: 'card',
    //   transactionId: 'sim_' + Date.now()
    // })
  } else {
    console.log('결제 실패')
  }
  
  return success
}