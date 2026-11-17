import mongoose from 'mongoose'

export interface IAIRecommendation {
  _id: string
  userId: string
  childId?: string
  type: 'growth_guide' | 'health_alert' | 'input_suggestion' | 'analysis' | 'quest' | 'suggestion'
  category?: string
  title: string
  content: string
  metadata?: any // 추가 데이터 (예: 심각도, 추천 활동 등)
  relatedLogIds?: string[] // 관련 성장 기록 ID
  aiProvider: 'openai' | 'gemini'
  confidence?: number
  isRead: boolean
  isActionTaken: boolean
  actionTakenAt?: Date
  createdAt: Date
  updatedAt: Date
}

const AIRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: false,
    },
    type: {
      type: String,
      enum: ['growth_guide', 'health_alert', 'input_suggestion', 'analysis', 'quest', 'suggestion'],
      required: true,
    },
    category: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    relatedLogIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GrowthLog',
    }],
    aiProvider: {
      type: String,
      enum: ['openai', 'gemini'],
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isActionTaken: {
      type: Boolean,
      default: false,
    },
    actionTakenAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// 인덱스 추가 (성능 최적화)
AIRecommendationSchema.index({ userId: 1, createdAt: -1 })
AIRecommendationSchema.index({ childId: 1, type: 1, createdAt: -1 })
AIRecommendationSchema.index({ isRead: 1, userId: 1 })

export default mongoose.models.AIRecommendation || mongoose.model<IAIRecommendation>('AIRecommendation', AIRecommendationSchema)