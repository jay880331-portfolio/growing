import mongoose from 'mongoose'

export interface ICounselor {
  _id: string
  userId: string // User 모델과 연결
  profileImage?: string
  specialties: string[] // 전문분야 (신생아, 유아, 학령기, 발달장애 등)
  certifications: Array<{
    name: string
    issuer: string
    date: Date
    document?: string // 증빙서류 URL
  }>
  experience: {
    years: number
    description: string
    previousWork?: string[]
  }
  education: Array<{
    degree: string
    school: string
    year: number
  }>
  pricing: {
    pricePerHour: number
    currency: string
  }
  availability: {
    timezone: string
    schedule: Array<{
      day: string // 'monday', 'tuesday', etc.
      startTime: string // '09:00'
      endTime: string // '18:00'
      available: boolean
    }>
  }
  rating: {
    average: number
    count: number
  }
  isVerified: boolean
  verificationDate?: Date
  bio: string
  languages: string[]
  subscription: {
    plan: string
    status: 'active' | 'inactive' | 'pending'
    validUntil: Date
    lastPayment?: Date
  }
  earnings: {
    totalEarned: number
    currentMonthEarned: number
    pendingPayout: number
  }
  status: 'active' | 'inactive' | 'suspended'
  createdAt: Date
  updatedAt: Date
}

const CounselorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    profileImage: {
      type: String,
    },
    specialties: [{
      type: String,
      enum: [
        'newborn', 'infant', 'toddler', 'preschool', 'school-age', 'adolescent',
        'development', 'nutrition', 'sleep', 'behavior', 'special-needs'
      ],
    }],
    certifications: [{
      name: {
        type: String,
        required: true,
      },
      issuer: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      document: {
        type: String, // 증빙서류 URL
      },
    }],
    experience: {
      years: {
        type: Number,
        required: true,
        min: 0,
      },
      description: {
        type: String,
        required: true,
        maxlength: 1000,
      },
      previousWork: [{
        type: String,
      }],
    },
    education: [{
      degree: {
        type: String,
        required: true,
      },
      school: {
        type: String,
        required: true,
      },
      year: {
        type: Number,
        required: true,
      },
    }],
    pricing: {
      pricePerHour: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: 'KRW',
      },
    },
    availability: {
      timezone: {
        type: String,
        default: 'Asia/Seoul',
      },
      schedule: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          required: true,
        },
        startTime: {
          type: String,
          required: true, // '09:00'
        },
        endTime: {
          type: String,
          required: true, // '18:00'
        },
        available: {
          type: Boolean,
          default: true,
        },
      }],
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDate: {
      type: Date,
    },
    bio: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    languages: [{
      type: String,
      default: ['korean'],
    }],
    subscription: {
      plan: {
        type: String,
        default: 'counselor-basic', // 상담사용 플랜
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending',
      },
      validUntil: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      lastPayment: {
        type: Date,
      },
    },
    earnings: {
      totalEarned: {
        type: Number,
        default: 0,
      },
      currentMonthEarned: {
        type: Number,
        default: 0,
      },
      pendingPayout: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'inactive',
    },
  },
  {
    timestamps: true,
  }
)

// 인덱스 설정
CounselorSchema.index({ userId: 1 })
CounselorSchema.index({ specialties: 1 })
CounselorSchema.index({ 'rating.average': -1 })
CounselorSchema.index({ status: 1 })
CounselorSchema.index({ isVerified: 1 })

export default mongoose.models.Counselor || mongoose.model<ICounselor>('Counselor', CounselorSchema)