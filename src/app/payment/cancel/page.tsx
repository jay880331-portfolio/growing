'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import Layout from '@/components/Layout'

export default function PaymentCancel() {
  const router = useRouter()
  const { locale } = useTranslation()

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            {locale === 'vi' ? 'Thanh toán đã hủy' : '결제가 취소되었습니다'}
          </h2>
          <p className="text-gray-600 mb-6">
            {locale === 'vi' 
              ? 'Bạn đã hủy quá trình thanh toán. Bạn có thể thử lại bất cứ lúc nào.'
              : '결제를 취소하셨습니다. 언제든지 다시 시도하실 수 있습니다.'
            }
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600"
            >
              {locale === 'vi' ? 'Về trang chủ' : '대시보드로 돌아가기'}
            </button>
            
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
            >
              {locale === 'vi' ? 'Thử lại thanh toán' : '결제 다시 시도'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}