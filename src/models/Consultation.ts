import mongoose from 'mongoose'

export interface IConsultation {
  _id: string
  parentId: string // 부모 User ID
  counselorId: string // 상담사 Counselor ID
  childId?: string // 상담 대상 아이 (선택사항)
  type: 'chat' | 'video' | 'phone'
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  scheduledAt: Date
  startedAt?: Date
  endedAt?: Date
  duration: number // 예약된 시간 (분)
  actualDuration?: number // 실제 상담 시간 (분)
  topic: string
  description: string
  notes?: string // 상담사 메모
  parentNotes?: string // 부모 메모
  pricing: {
    hourlyRate: number
    totalAmount: number
    platformFee: number // 플랫폼 수수료 (20%)
    counselorEarnings: number // 상담사 수익 (80%)
  }
  payment: {
    status: 'pending' | 'paid' | 'refunded' | 'failed'
    method?: string
    transactionId?: string
    paidAt?: Date
  }
  feedback: {
    parentRating?: number // 1-5
    parentComment?: string
    counselorRating?: number // 1-5
    counselorComment?: string
  }
  followUp: {
    recommended: boolean
    nextSessionDate?: Date
    recommendations?: string[]
  }
  chatHistory?: Array<{
    sender: 'parent' | 'counselor'
    message: string
    timestamp: Date
  }>
  createdAt: Date
  updatedAt: Date
}

const ConsultationSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counselor',
      required: true,
    },
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
    },
    type: {
      type: String,
      enum: ['chat', 'video', 'phone'],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      required: true, // 분 단위
      min: 15,
      max: 180,
    },
    actualDuration: {
      type: Number,
    },
    topic: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
    parentNotes: {
      type: String,
      maxlength: 1000,
    },
    pricing: {
      hourlyRate: {
        type: Number,
        required: true,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      platformFee: {
        type: Number,
        required: true,
      },
      counselorEarnings: {
        type: Number,
        required: true,
      },
    },
    payment: {
      status: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'pending',
      },
      method: {
        type: String,
      },
      transactionId: {
        type: String,
      },
      paidAt: {
        type: Date,
      },
    },
    feedback: {
      parentRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      parentComment: {
        type: String,
        maxlength: 500,
      },
      counselorRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      counselorComment: {
        type: String,
        maxlength: 500,
      },
    },
    followUp: {
      recommended: {
        type: Boolean,
        default: false,
      },
      nextSessionDate: {
        type: Date,
      },
      recommendations: [{
        type: String,
      }],
    },
    chatHistory: [{
      sender: {
        type: String,
        enum: ['parent', 'counselor'],
        required: true,
      },
      message: {
        type: String,
        required: true,
        maxlength: 1000,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
)

// 인덱스 설정
ConsultationSchema.index({ parentId: 1, scheduledAt: -1 })
ConsultationSchema.index({ counselorId: 1, scheduledAt: -1 })
ConsultationSchema.index({ status: 1, scheduledAt: 1 })
ConsultationSchema.index({ childId: 1 })

export default mongoose.models.Consultation || mongoose.model<IConsultation>('Consultation', ConsultationSchema)