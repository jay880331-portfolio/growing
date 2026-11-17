import mongoose from 'mongoose'

export interface IAppSettings {
  _id: string
  // UI 표시 설정
  showSubscriptionFeatures: boolean // 구독 관련 기능 표시 여부
  showCounselorFeatures: boolean    // 상담사 기능 표시 여부
  showAICoachFeatures: boolean      // AI 코치 기능 표시 여부
  
  // 앱스토어 심사 관련
  isUnderAppStoreReview: boolean    // 앱스토어 심사 중 여부
  appStoreReviewMode: {
    hideSubscription: boolean       // 구독 관련 UI 숨김
    hidePremiumFeatures: boolean    // 프리미엄 기능 숨김
    hidePaymentRelated: boolean     // 결제 관련 기능 숨김
    customMessage?: string          // 사용자에게 보여줄 메시지
  }
  
  // 기능별 활성화 설정
  features: {
    subscription: boolean
    counselor: boolean
    aiCoach: boolean
    quest: boolean
    growthGuide: boolean
    reports: boolean
    healthAlerts: boolean
  }
  
  // 메타데이터
  lastUpdatedBy: string
  updatedAt: Date
  createdAt: Date
}

const AppSettingsSchema = new mongoose.Schema(
  {
    // UI 표시 설정
    showSubscriptionFeatures: {
      type: Boolean,
      default: true,
      required: true,
    },
    showCounselorFeatures: {
      type: Boolean,
      default: true,
      required: true,
    },
    showAICoachFeatures: {
      type: Boolean,
      default: true,
      required: true,
    },
    
    // 앱스토어 심사 관련
    isUnderAppStoreReview: {
      type: Boolean,
      default: false,
      required: true,
    },
    appStoreReviewMode: {
      hideSubscription: {
        type: Boolean,
        default: false,
      },
      hidePremiumFeatures: {
        type: Boolean,
        default: false,
      },
      hidePaymentRelated: {
        type: Boolean,
        default: false,
      },
      customMessage: {
        type: String,
        default: '',
      },
    },
    
    // 기능별 활성화 설정
    features: {
      subscription: {
        type: Boolean,
        default: true,
      },
      counselor: {
        type: Boolean,
        default: true,
      },
      aiCoach: {
        type: Boolean,
        default: true,
      },
      quest: {
        type: Boolean,
        default: true,
      },
      growthGuide: {
        type: Boolean,
        default: true,
      },
      reports: {
        type: Boolean,
        default: true,
      },
      healthAlerts: {
        type: Boolean,
        default: true,
      },
    },
    
    // 메타데이터
    lastUpdatedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// 싱글톤 패턴: 설정은 하나만 존재해야 함
AppSettingsSchema.index({}, { unique: true })

export default mongoose.models.AppSettings || mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema)