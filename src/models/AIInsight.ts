import mongoose from 'mongoose'

export interface IAIInsight {
  _id: string
  childId: string
  type: 'daily' | 'weekly' | 'monthly' | 'milestone' | 'alert'
  category: 'development' | 'health' | 'behavior' | 'nutrition' | 'sleep'
  title: string
  content: string
  recommendations?: string[]
  confidence: number
  dataPoints: string[] // References to GrowthLog IDs
  createdAt: Date
  updatedAt: Date
}

const AIInsightSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'milestone', 'alert'],
      required: true,
    },
    category: {
      type: String,
      enum: ['development', 'health', 'behavior', 'nutrition', 'sleep'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    recommendations: [{
      type: String,
    }],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    dataPoints: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GrowthLog',
    }],
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.AIInsight || mongoose.model<IAIInsight>('AIInsight', AIInsightSchema)