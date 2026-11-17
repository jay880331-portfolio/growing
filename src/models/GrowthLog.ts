import mongoose from 'mongoose'

export interface IGrowthLog {
  _id: string
  childId: string
  type: 'sleep' | 'meal' | 'diaper' | 'activity' | 'milestone' | 'health'
  timestamp: Date
  data: Record<string, any>
  media?: {
    type: 'image' | 'video' | 'audio'
    url: string
  }[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const GrowthLogSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
    },
    type: {
      type: String,
      enum: ['sleep', 'meal', 'diaper', 'activity', 'milestone', 'health'],
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    media: [{
      type: {
        type: String,
        enum: ['image', 'video', 'audio'],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    }],
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.GrowthLog || mongoose.model<IGrowthLog>('GrowthLog', GrowthLogSchema)