import { NextRequest, NextResponse } from 'next/server'
import { captureOrder } from '@/lib/paypal'
import dbConnect from '@/lib/mongodb'
import PaymentRequest from '@/models/PaymentRequest'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { orderId, paymentRequestId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID가 필요합니다' },
        { status: 400 }
      )
    }

    // PayPal에서 결제 캡처
    const captureResponse = await captureOrder(orderId)
    
    if (captureResponse.result.status !== 'COMPLETED') {
      throw new Error('결제가 완료되지 않았습니다')
    }

    // 결제 요청 상태 업데이트
    const paymentRequest = await PaymentRequest.findById(paymentRequestId)
    if (!paymentRequest) {
      throw new Error('결제 요청을 찾을 수 없습니다')
    }

    paymentRequest.status = 'paid'
    paymentRequest.processedAt = new Date()
    paymentRequest.notes += `\nPayPal Capture ID: ${captureResponse.result.purchase_units[0].payments.captures[0].id}`
    await paymentRequest.save()

    // 사용자 프리미엄 활성화
    const user = await User.findById(paymentRequest.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 프리미엄 기간 계산
    const currentDate = new Date()
    const premiumDuration = paymentRequest.plan === 'yearly' ? 365 : 30 // 일 단위
    const premiumUntil = new Date(currentDate.getTime() + (premiumDuration * 24 * 60 * 60 * 1000))

    // User 모델에 premium 필드 추가 (필요시 스키마 업데이트)
    await User.findByIdAndUpdate(paymentRequest.userId, {
      $set: {
        premiumUntil: premiumUntil,
        premiumPlan: paymentRequest.plan,
        updatedAt: new Date()
      }
    })

    // 결제 요청 최종 완료 처리
    paymentRequest.status = 'processed'
    await paymentRequest.save()

    return NextResponse.json({
      success: true,
      message: '결제가 완료되었습니다',
      premiumUntil: premiumUntil,
      captureId: captureResponse.result.purchase_units[0].payments.captures[0].id
    })

  } catch (error: any) {
    console.error('PayPal 결제 캡처 오류:', error)
    return NextResponse.json(
      { error: error.message || 'PayPal 결제 처리 실패' },
      { status: 500 }
    )
  }
}