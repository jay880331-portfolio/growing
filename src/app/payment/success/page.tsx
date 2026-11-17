'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useTranslation } from '@/hooks/useTranslation'
import Layout from '@/components/Layout'

export default function PaymentSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuthStore()
  const { locale } = useTranslation()
  const [processing, setProcessing] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const processPayment = async () => {
      const orderId = searchParams.get('token') // PayPal returns token as orderId
      const paymentRequestId = searchParams.get('paymentRequestId')
      
      if (!orderId) {
        setError(locale === 'vi' ? 'Thiếu thông tin đơn hàng' : '주문 정보가 없습니다')
        setProcessing(false)
        return
      }

      try {
        const response = await fetch('/api/payment/paypal/capture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ orderId, paymentRequestId })
        })

        const data = await response.json()

        if (data.success) {
          setSuccess(true)
          // 3초 후 대시보드로 리다이렉트
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        } else {
          setError(data.error || (locale === 'vi' ? 'Xử lý thanh toán thất bại' : '결제 처리 실패'))
        }
      } catch (error) {
        console.error('결제 처리 오류:', error)
        setError(locale === 'vi' ? 'Lỗi xử lý thanh toán' : '결제 처리 중 오류가 발생했습니다')
      } finally {
        setProcessing(false)
      }
    }

    if (token) {
      processPayment()
    }
  }, [token, searchParams, router, locale])

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          {processing && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold mb-2">
                {locale === 'vi' ? 'Đang xử lý thanh toán...' : '결제 처리 중...'}
              </h2>
              <p className="text-gray-600">
                {locale === 'vi' 
                  ? 'Vui lòng đợi, chúng tôi đang xác nhận thanh toán của bạn.'
                  : '결제 확인 중입니다. 잠시만 기다려 주세요.'
                }
              </p>
            </>
          )}

          {!processing && success && (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-emerald-600 mb-2">
                {locale === 'vi' ? 'Thanh toán thành công!' : '결제 완료!'}
              </h2>
              <p className="text-gray-600 mb-4">
                {locale === 'vi' 
                  ? 'Chúc mừng! Tài khoản Premium của bạn đã được kích hoạt.'
                  : '축하합니다! 프리미엄 계정이 활성화되었습니다.'
                }
              </p>
              <div className="bg-emerald-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-emerald-800 mb-2">
                  {locale === 'vi' ? 'Tính năng đã mở khóa:' : '활성화된 기능:'}
                </h3>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>✅ {locale === 'vi' ? 'Phân tích AI không giới hạn' : '무제한 AI 분석'}</li>
                  <li>✅ {locale === 'vi' ? 'Kết nối chuyên gia' : '전문가 상담 연결'}</li>
                  <li>✅ {locale === 'vi' ? 'Báo cáo nâng cao' : '고급 리포트'}</li>
                  <li>✅ {locale === 'vi' ? 'Xuất dữ liệu' : '데이터 내보내기'}</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500">
                {locale === 'vi' 
                  ? '3초 후 tự động chuyển về trang chủ...'
                  : '3초 후 대시보드로 이동합니다...'
                }
              </p>
            </>
          )}

          {!processing && error && (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-red-600 mb-2">
                {locale === 'vi' ? 'Thanh toán thất bại' : '결제 실패'}
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600"
              >
                {locale === 'vi' ? 'Về trang chủ' : '대시보드로 돌아가기'}
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}