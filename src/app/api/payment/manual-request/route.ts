import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PaymentRequest from '@/models/PaymentRequest'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const { plan, amount, currency, region } = await request.json()

    // 이미 처리되지 않은 요청이 있는지 확인
    const existingRequest = await PaymentRequest.findOne({
      userId,
      status: { $in: ['pending', 'paid'] }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: region === 'vietnam' ? 'Đã có yêu cầu thanh toán đang xử lý' : '이미 처리 중인 결제 요청이 있습니다' },
        { status: 400 }
      )
    }

    // 결제 방법 결정
    const paymentMethod = region === 'vietnam' ? 'bank_transfer' : 'kakao'

    // 결제 요청 생성
    const paymentRequest = new PaymentRequest({
      userId,
      email: userEmail,
      region,
      paymentMethod,
      amount,
      currency,
      plan,
      status: 'pending'
    })

    await paymentRequest.save()

    // 지역별 결제 안내 정보
    const paymentInfo = {
      vietnam: {
        title: 'Hướng dẫn thanh toán',
        steps: [
          '📱 Chuyển khoản qua ngân hàng:',
          '🏦 Ngân hàng: Vietcombank',
          '💳 Số tài khoản: 1234567890', // 실제 계좌로 변경 필요
          '👤 Chủ tài khoản: GROWING VIETNAM',
          '💰 Số tiền: ' + amount.toLocaleString() + '₫',
          '📝 Nội dung: PREMIUM_' + userId.slice(-6),
          '',
          '📲 Hoặc chuyển qua Zalo Pay:',
          '🔗 Liên hệ: @growing_vietnam', // 실제 Zalo 계정으로 변경 필요
          '',
          '✅ Sau khi chuyển khoản, vui lòng gửi ảnh chụp màn hình để xác nhận.'
        ],
        contact: 'https://zalo.me/growing_vietnam' // 실제 연락처로 변경 필요
      },
      korea: {
        title: '결제 안내',
        steps: [
          '💬 카카오톡으로 결제:',
          '🔗 채널: @growing_support', // 실제 채널로 변경 필요
          '💰 결제 금액: ' + amount.toLocaleString() + '원',
          '📝 결제 ID: PREMIUM_' + userId.slice(-6),
          '',
          '📱 토스로 송금:',
          '☎️ 전화번호: 010-XXXX-XXXX', // 실제 번호로 변경 필요
          '💰 송금 금액: ' + amount.toLocaleString() + '원',
          '',
          '✅ 결제 완료 후 스크린샷을 채널로 전송해주세요.'
        ],
        contact: 'http://pf.kakao.com/growing_support' // 실제 채널로 변경 필요
      }
    }

    const regionInfo = paymentInfo[region as keyof typeof paymentInfo]

    return NextResponse.json({
      success: true,
      requestId: paymentRequest._id,
      paymentInfo: regionInfo,
      message: region === 'vietnam' 
        ? 'Yêu cầu thanh toán đã được tạo thành công. Vui lòng làm theo hướng dẫn bên dưới.'
        : '결제 요청이 생성되었습니다. 아래 안내에 따라 결제해주세요.'
    })

  } catch (error) {
    console.error('수동 결제 요청 생성 오류:', error)
    return NextResponse.json(
      { error: '결제 요청 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}