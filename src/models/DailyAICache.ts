import mongoose from 'mongoose'

export interface IDailyAICache {
  _id: string
  userId: string
  childId?: string
  cacheType: 'growth-guide' | 'quest' | 'health-alert'
  date: string // YYYY-MM-DD 형식
  data: any // 캐시된 AI 응답 데이터
  aiProvider: string
  generatedAt: Date
  expiresAt: Date
}

const DailyAICacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
    },
    cacheType: {
      type: String,
      enum: ['growth-guide', 'quest', 'health-alert'],
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    aiProvider: {
      type: String,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => {
        // 다음 날 자정에 만료
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        return tomorrow
      },
    },
  },
  {
    timestamps: true,
  }
)

// 복합 인덱스 (빠른 조회를 위해)
DailyAICacheSchema.index({ userId: 1, childId: 1, cacheType: 1, date: 1 }, { unique: true })
DailyAICacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // 자동 삭제

export default mongoose.models.DailyAICache || mongoose.model<IDailyAICache>('DailyAICache', DailyAICacheSchema)