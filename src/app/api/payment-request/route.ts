import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PaymentRequest from '@/models/PaymentRequest'
import User from '@/models/User'

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

    const { region, paymentMethod, plan } = await request.json()

    // 가격 설정
    const pricing = {
      korea: {
        monthly: { amount: 9900, currency: 'KRW' },
        yearly: { amount: 99000, currency: 'KRW' }
      },
      vietnam: {
        monthly: { amount: 240000, currency: 'VND' },
        yearly: { amount: 2400000, currency: 'VND' }
      }
    }

    const selectedPricing = pricing[region as keyof typeof pricing][plan as keyof typeof pricing.korea]

    // 이미 처리되지 않은 요청이 있는지 확인
    const existingRequest = await PaymentRequest.findOne({
      userId,
      status: { $in: ['pending', 'paid'] }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: '이미 처리 중인 결제 요청이 있습니다' },
        { status: 400 }
      )
    }

    // 결제 요청 생성
    const paymentRequest = new PaymentRequest({
      userId,
      email: userEmail,
      region,
      paymentMethod,
      amount: selectedPricing.amount,
      currency: selectedPricing.currency,
      plan,
      status: 'pending'
    })

    await paymentRequest.save()

    // 결제 방법별 안내 정보
    const paymentInfo = {
      korea: {
        kakao: {
          title: '카카오톡으로 결제하기',
          steps: [
            '아래 링크로 카카오톡 채널 접속',
            '결제 금액과 사용자 정보 전달',
            '카카오페이로 결제',
            '결제 완료 스크린샷 전송'
          ],
          contact: 'http://pf.kakao.com/growing_support', // 실제 채널로 변경 필요
          amount: selectedPricing.amount.toLocaleString() + '원'
        },
        toss: {
          title: '토스로 결제하기',
          steps: [
            '토스 앱에서 송금하기 선택',
            '전화번호: 010-XXXX-XXXX', // 실제 번호로 변경 필요
            '송금 금액 입력',
            '송금 완료 후 채널로 알림'
          ],
          amount: selectedPricing.amount.toLocaleString() + '원'
        }
      },
      vietnam: {
        zalo: {
          title: 'Thanh toán qua Zalo',
          steps: [
            'Truy cập kênh Zalo chính thức',
            'Gửi thông tin thanh toán',
            'Chuyển khoản qua ZaloPay',
            'Gửi ảnh chụp màn hình xác nhận'
          ],
          contact: 'https://zalo.me/growing_vietnam', // 실제 채널로 변경 필요
          amount: selectedPricing.amount.toLocaleString() + '₫'
        },
        momo: {
          title: 'Thanh toán qua MoMo',
          steps: [
            'Mở ứng dụng MoMo',
            'Chọn "Chuyển tiền"',
            'Số điện thoại: +84-XXX-XXX-XXX', // 실제 번호로 변경 필요
            'Gửi ảnh xác nhận thanh toán'
          ],
          amount: selectedPricing.amount.toLocaleString() + '₫'
        },
        bank_transfer: {
          title: 'Chuyển khoản ngân hàng',
          steps: [
            'Ngân hàng: Vietcombank',
            'Số tài khoản: XXXXXXXXXXXX', // 실제 계좌로 변경 필요
            'Tên tài khoản: GROWING VIETNAM',
            'Nội dung: PREMIUM_' + userId.slice(-6)
          ],
          amount: selectedPricing.amount.toLocaleString() + '₫'
        }
      }
    }

    const regionInfo = paymentInfo[region as keyof typeof paymentInfo]
    const methodInfo = regionInfo[paymentMethod as keyof typeof regionInfo]

    return NextResponse.json({
      success: true,
      requestId: paymentRequest._id,
      paymentInfo: methodInfo,
      message: region === 'vietnam' 
        ? 'Yêu cầu thanh toán đã được tạo thành công'
        : '결제 요청이 생성되었습니다'
    })

  } catch (error) {
    console.error('결제 요청 생성 오류:', error)
    return NextResponse.json(
      { error: '결제 요청 생성 중 오류가 발생했습니다' },
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

    // 사용자의 결제 요청 조회
    const paymentRequests = await PaymentRequest.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)

    return NextResponse.json({ paymentRequests })

  } catch (error) {
    console.error('결제 요청 조회 오류:', error)
    return NextResponse.json(
      { error: '결제 요청 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}