import mongoose from 'mongoose'

export interface IQuest {
  _id: string
  childId: string
  title: string
  description: string
  category: 'activity' | 'milestone' | 'health' | 'bonding' | 'learning'
  estimatedTime: string
  tips: string[]
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  targetParent: 'mom' | 'dad' | 'grandpa' | 'grandma' | 'both' | 'parents' | 'grandparents' | 'family'
  aiProvider: 'openai' | 'gemini'
  generatedAt: Date
  completedAt?: Date
  parentNotes?: string
  createdAt: Date
  updatedAt: Date
}

const QuestSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['activity', 'milestone', 'health', 'bonding', 'learning'],
      required: true,
    },
    estimatedTime: {
      type: String,
      required: true,
    },
    tips: [{
      type: String,
    }],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped'],
      default: 'pending',
    },
    targetParent: {
      type: String,
      enum: ['mom', 'dad', 'grandpa', 'grandma', 'both', 'parents', 'grandparents', 'family'],
      default: 'family',
      required: true,
    },
    aiProvider: {
      type: String,
      enum: ['openai', 'gemini'],
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    parentNotes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Quest || mongoose.model<IQuest>('Quest', QuestSchema)