'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useAuthStore } from '@/store/useAuthStore'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { locale, common, subscription } = useTranslation()
  const { user, token } = useAuthStore()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'manual'>(locale === 'ko' ? 'manual' : 'paypal')
  const [loading, setLoading] = useState(false)

  // 지역별 가격 설정 (PayPal은 USD만 지원)
  const pricing = {
    ko: {
      monthly: { amount: 1.49, currency: 'USD', symbol: '$', localDisplay: '월 1,900원' },
      yearly: { amount: 14.99, currency: 'USD', symbol: '$', localDisplay: '연 19,000원' }
    },
    vi: {
      monthly: { amount: 1.49, currency: 'USD', symbol: '$', localDisplay: '36.000₫/tháng' },
      yearly: { amount: 14.99, currency: 'USD', symbol: '$', localDisplay: '360.000₫/năm' }
    }
  }

  const currentPricing = pricing[locale as keyof typeof pricing] || pricing.ko
  const selectedPrice = currentPricing[selectedPlan]

  const handlePayPalPayment = async () => {
    setLoading(true)
    try {
      console.log('PayPal 결제 요청 시작:', { token: token ? '토큰 있음' : '토큰 없음', user })
      
      // PayPal 결제 요청 생성
      const response = await fetch('/api/payment/paypal/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          amount: selectedPrice.amount,
          currency: selectedPrice.currency
        })
      })

      console.log('PayPal API 응답:', response.status, response.statusText)

      const data = await response.json()
      console.log('PayPal API 데이터:', data)
      
      if (response.ok && data.approvalUrl) {
        // PayPal 결제 페이지로 리다이렉트
        window.location.href = data.approvalUrl
      } else {
        console.log('PayPal API 오류:', data)
        alert(data.error || (locale === 'vi' ? 'Lỗi tạo đơn hàng PayPal' : 'PayPal 주문 생성 실패'))
      }
    } catch (error) {
      console.log('PayPal 결제 오류:', error)
      alert(locale === 'vi' ? 'Lỗi thanh toán' : '결제 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleManualPayment = async () => {
    setLoading(true)
    try {
      console.log('수동 결제 요청 시작:', { 
        token: token ? '토큰 있음' : '토큰 없음', 
        user,
        plan: selectedPlan,
        amount: selectedPrice.amount,
        currency: selectedPrice.currency,
        region: locale === 'vi' ? 'vietnam' : 'korea'
      })

      const response = await fetch('/api/payment/manual-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          amount: locale === 'ko' ? (selectedPlan === 'monthly' ? 1900 : 19000) : (selectedPlan === 'monthly' ? 36000 : 360000),
          currency: locale === 'ko' ? 'KRW' : 'VND',
          region: locale === 'vi' ? 'vietnam' : 'korea'
        })
      })

      console.log('수동 결제 API 응답:', response.status, response.statusText)

      const data = await response.json()
      console.log('수동 결제 API 데이터:', data)
      
      if (response.ok && data.success) {
        // 간단한 이메일 안내 메시지로 변경
        alert(locale === 'vi' ? 'Chúng tôi sẽ hướng dẫn bạn qua email.' : '이메일로 안내드리겠습니다.')
        onClose()
      } else {
        console.log('수동 결제 API 오류:', data)
        alert(data.error || (locale === 'vi' ? 'Lỗi tạo yêu cầu thanh toán' : '결제 요청 생성 오류'))
      }
    } catch (error) {
      console.log('수동 결제 요청 오류:', error)
      alert(locale === 'vi' ? 'Lỗi tạo yêu cầu thanh toán' : '결제 요청 생성 오류')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {locale === 'vi' ? 'Nâng cấp Premium' : '프리미엄 구독'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* 플랜 선택 */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">
              {locale === 'vi' ? 'Chọn gói' : '플랜 선택'}
            </h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="plan"
                  value="monthly"
                  checked={selectedPlan === 'monthly'}
                  onChange={(e) => setSelectedPlan(e.target.value as 'monthly')}
                  className="text-emerald-500"
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {locale === 'vi' ? 'Hàng tháng' : '월간 구독'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentPricing.monthly.localDisplay}
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="plan"
                  value="yearly"
                  checked={selectedPlan === 'yearly'}
                  onChange={(e) => setSelectedPlan(e.target.value as 'yearly')}
                  className="text-emerald-500"
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {locale === 'vi' ? 'Hàng năm' : '연간 구독'}
                    <span className="text-emerald-500 text-sm ml-2">
                      {locale === 'vi' ? '(Tiết kiệm 2 tháng!)' : '(2개월 할인!)'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentPricing.yearly.localDisplay}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 결제 방법 선택 */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">
              {locale === 'vi' ? 'Phương thức thanh toán' : '결제 방법'}
            </h3>
            <div className="space-y-3">
              {/* 베트남어일 때만 PayPal 옵션 표시 */}
              {locale === 'vi' && (
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'paypal' | 'manual')}
                    className="text-emerald-500"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🅿️</span>
                    <div>
                      <div className="font-medium">PayPal</div>
                      <div className="text-sm text-gray-500">
                        PayPal 계정 (USD)
                      </div>
                    </div>
                  </div>
                </label>
              )}

              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="manual"
                  checked={paymentMethod === 'manual'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'paypal' | 'manual')}
                  className="text-emerald-500"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {locale === 'vi' ? '🏦' : '💬'}
                  </span>
                  <div>
                    <div className="font-medium">
                      {locale === 'vi' ? 'Chuyển khoản' : '수동 결제'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {locale === 'vi' 
                        ? 'Chuyển khoản ngân hàng / Zalo' 
                        : '계좌이체 / 카카오톡'
                      }
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 결제 버튼 */}
          <div className="space-y-3">
            {paymentMethod === 'paypal' ? (
              <button
                onClick={handlePayPalPayment}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  locale === 'vi' ? 'Đang xử lý...' : '처리 중...'
                ) : (
                  locale === 'vi' 
                    ? `Thanh toán $${selectedPrice.amount} qua PayPal`
                    : `$${selectedPrice.amount} PayPal 결제하기`
                )}
              </button>
            ) : (
              <button
                onClick={handleManualPayment}
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  locale === 'vi' ? 'Đang tạo yêu cầu...' : '요청 생성 중...'
                ) : (
                  locale === 'vi' ? 'Tạo yêu cầu thanh toán' : '결제 요청하기'
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              {locale === 'vi' ? 'Hủy' : '취소'}
            </button>
          </div>

          {/* 프리미엄 기능 안내 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">
              {locale === 'vi' ? 'Tính năng Premium:' : '프리미엄 기능:'}
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ {locale === 'vi' ? '500 lần phân tích AI/tháng' : '월 500회 AI 분석'}</li>
              <li>✅ {locale === 'vi' ? 'Hỗ trợ khách hàng ưu tiên' : '우선 고객지원'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}