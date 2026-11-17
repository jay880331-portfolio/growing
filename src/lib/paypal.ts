// @ts-ignore
import checkoutNodeJssdk from '@paypal/checkout-server-sdk'

// PayPal 환경 설정
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!
  
  if (process.env.PAYPAL_MODE === 'sandbox') {
    return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret)
  } else {
    return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
  }
}

// PayPal 클라이언트
export function paypalClient() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment())
}

// 주문 생성
export async function createOrder(amount: number, currency: string = 'KRW') {
  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest()
  
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount.toString()
      },
      description: 'Growing Premium Subscription'
    }],
    application_context: {
      brand_name: 'Growing',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`
    }
  })

  const client = paypalClient()
  const response = await client.execute(request)
  
  return response
}

// 주문 캡처 (결제 완료)
export async function captureOrder(orderId: string) {
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId)
  
  const client = paypalClient()
  const response = await client.execute(request)
  
  return response
}

// 구독 플랜 생성 (선택사항)
export async function createSubscriptionPlan(planName: string, amount: number, currency: string = 'KRW') {
  // PayPal 구독 API 사용
  // 이 부분은 필요시 구현
}