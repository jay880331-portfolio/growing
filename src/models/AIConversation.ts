import mongoose from 'mongoose'

export interface IMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface IAIConversation {
  _id: string
  userId: string
  childId?: string
  messages: IMessage[]
  sessionTitle?: string
  aiProvider: 'openai' | 'gemini'
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

const AIConversationSchema = new mongoose.Schema(
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
    messages: [MessageSchema],
    sessionTitle: {
      type: String,
    },
    aiProvider: {
      type: String,
      enum: ['openai', 'gemini'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// 세션 제목 자동 생성 (첫 번째 사용자 메시지 기반)
AIConversationSchema.pre('save', function(next) {
  if (!this.sessionTitle && this.messages.length > 0) {
    const firstUserMessage = this.messages.find(m => m.role === 'user')
    if (firstUserMessage) {
      this.sessionTitle = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
    }
  }
  next()
})

export default mongoose.models.AIConversation || mongoose.model<IAIConversation>('AIConversation', AIConversationSchema)