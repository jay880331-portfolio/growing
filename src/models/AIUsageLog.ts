import mongoose from 'mongoose'

export interface IAIUsageLog {
  _id: string
  userId: string
  endpoint: string // 호출된 API 엔드포인트
  provider: 'openai' | 'gemini'
  model: string // 사용된 모델명
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number // 예상 비용 (USD)
  requestType: 'chat' | 'analysis' | 'quest' | 'guide' | 'pattern-detection' | 'input-helper'
  childId?: string // 아이 관련 요청일 경우
  responseTime: number // 응답 시간 (ms)
  success: boolean
  errorMessage?: string
  metadata?: {
    promptLength: number
    responseLength: number
    features?: string[] // 사용된 기능들
  }
  createdAt: Date
}

const AIUsageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['openai', 'gemini'],
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    inputTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    outputTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    totalTokens: {
      type: Number,
      required: true,
      default: 0,
    },
    cost: {
      type: Number,
      required: true,
      default: 0,
    },
    requestType: {
      type: String,
      enum: ['chat', 'analysis', 'quest', 'guide', 'pattern-detection', 'input-helper'],
      required: true,
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
    },
    responseTime: {
      type: Number,
      required: true,
      default: 0,
    },
    success: {
      type: Boolean,
      required: true,
      default: true,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      promptLength: {
        type: Number,
        default: 0,
      },
      responseLength: {
        type: Number,
        default: 0,
      },
      features: [{
        type: String,
      }],
    },
  },
  {
    timestamps: true,
  }
)

// 인덱스 설정
AIUsageLogSchema.index({ userId: 1, createdAt: -1 })
AIUsageLogSchema.index({ provider: 1, createdAt: -1 })
AIUsageLogSchema.index({ requestType: 1, createdAt: -1 })
AIUsageLogSchema.index({ success: 1 })

// 가상 필드 - 월별 사용량 계산용
AIUsageLogSchema.virtual('monthKey').get(function() {
  const date = this.createdAt || new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
})

export default mongoose.models.AIUsageLog || mongoose.model<IAIUsageLog>('AIUsageLog', AIUsageLogSchema)