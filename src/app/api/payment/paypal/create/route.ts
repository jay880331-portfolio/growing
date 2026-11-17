import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/paypal'
import dbConnect from '@/lib/mongodb'
import PaymentRequest from '@/models/PaymentRequest'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 PayPal 환경변수 체크:', {
      clientId: process.env.PAYPAL_CLIENT_ID ? '설정됨' : '누락',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET ? '설정됨' : '누락',
      mode: process.env.PAYPAL_MODE
    })

    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { plan, amount, currency } = await request.json()
    console.log('💰 결제 요청 정보:', { plan, amount, currency })

    // PayPal 주문 생성
    const paypalResponse = await createOrder(amount, currency)
    const orderId = paypalResponse.result.id
    
    // 승인 URL 찾기
    const approvalUrl = paypalResponse.result.links?.find(
      (link: any) => link.rel === 'approve'
    )?.href

    if (!approvalUrl) {
      throw new Error('PayPal 승인 URL을 찾을 수 없습니다')
    }

    // 데이터베이스에 결제 요청 저장
    const paymentRequest = new PaymentRequest({
      userId,
      email: userEmail,
      region: currency === 'VND' ? 'vietnam' : 'korea',
      paymentMethod: 'paypal',
      amount,
      currency,
      plan,
      status: 'pending',
      notes: `PayPal Order ID: ${orderId}`
    })

    await paymentRequest.save()

    return NextResponse.json({
      success: true,
      orderId,
      approvalUrl,
      paymentRequestId: paymentRequest._id
    })

  } catch (error: any) {
    console.error('PayPal 주문 생성 오류:', error)
    return NextResponse.json(
      { error: error.message || 'PayPal 주문 생성 실패' },
      { status: 500 }
    )
  }
}