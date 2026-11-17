// 상담사 구독 플랜 정의

export interface CounselorPlan {
  id: string
  name: string
  price: number
  currency: string
  period: 'monthly' | 'yearly'
  features: string[]
  maxConsultations: number // 월 최대 상담 횟수
  commissionRate: number // 플랫폼 수수료율 (%)
  prioritySupport: boolean
  profileBoost: boolean // 프로필 우선 노출
  analytics: boolean // 상세 분석 리포트
}

export const COUNSELOR_PLANS: CounselorPlan[] = [
  {
    id: 'counselor-basic',
    name: '베이직',
    price: 29000,
    currency: 'KRW',
    period: 'monthly',
    features: [
      '월 최대 20회 상담',
      '기본 프로필 등록',
      '상담 일정 관리',
      '기본 수익 분석',
      '이메일 지원'
    ],
    maxConsultations: 20,
    commissionRate: 20, // 20% 수수료
    prioritySupport: false,
    profileBoost: false,
    analytics: false
  },
  {
    id: 'counselor-pro',
    name: '프로',
    price: 59000,
    currency: 'KRW',
    period: 'monthly',
    features: [
      '월 최대 50회 상담',
      '프리미엄 프로필 배지',
      '우선 노출 혜택',
      '상세 수익 분석',
      '우선 고객 지원',
      '마케팅 도구'
    ],
    maxConsultations: 50,
    commissionRate: 15, // 15% 수수료
    prioritySupport: true,
    profileBoost: true,
    analytics: true
  },
  {
    id: 'counselor-premium',
    name: '프리미엄',
    price: 99000,
    currency: 'KRW',
    period: 'monthly',
    features: [
      '무제한 상담',
      '프리미엄 프로필 배지',
      '최우선 노출',
      '고급 수익 분석',
      '1:1 전담 지원',
      '마케팅 도구',
      '세미나/교육 참여',
      '전용 대시보드'
    ],
    maxConsultations: -1, // 무제한
    commissionRate: 10, // 10% 수수료
    prioritySupport: true,
    profileBoost: true,
    analytics: true
  }
]

// 연간 결제 시 할인율
export const YEARLY_DISCOUNT = 0.2 // 20% 할인

export function getCounselorPlan(planId: string): CounselorPlan | null {
  return COUNSELOR_PLANS.find(plan => plan.id === planId) || null
}

export function getYearlyPrice(monthlyPrice: number): number {
  return Math.floor(monthlyPrice * 12 * (1 - YEARLY_DISCOUNT))
}

export function formatPrice(price: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: currency
  }).format(price)
}

// 수수료 계산
export function calculateCommission(amount: number, commissionRate: number): number {
  return Math.floor(amount * (commissionRate / 100))
}

// 실제 수익 계산 (수수료 차감 후)
export function calculateNetEarnings(amount: number, commissionRate: number): number {
  return amount - calculateCommission(amount, commissionRate)
}