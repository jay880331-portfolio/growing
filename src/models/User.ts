import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser {
  _id: string
  email: string
  password: string
  name: string
  userType: 'parent' | 'counselor' | 'admin'
  aiUsage: {
    monthlyUsed: number
    monthlyLimit: number
    lastReset: Date
    plan: 'free' | 'premium'
  }
  subscription: {
    plan: string
    status: 'active' | 'inactive' | 'pending'
    validUntil: Date
    paymentMethod?: string
  }
  createdAt: Date
  updatedAt: Date
  comparePassword: (password: string) => Promise<boolean>
}

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, '이메일은 필수입니다'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다'],
      minlength: 6,
    },
    name: {
      type: String,
      required: [true, '이름은 필수입니다'],
      trim: true,
    },
    userType: {
      type: String,
      enum: ['parent', 'counselor', 'admin'],
      default: 'parent',
      required: true,
    },
    aiUsage: {
      monthlyUsed: {
        type: Number,
        default: 0,
      },
      monthlyLimit: {
        type: Number,
        default: 50, // 무료 플랜 기본 50회
      },
      lastReset: {
        type: Date,
        default: Date.now,
      },
      plan: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free',
      },
    },
    subscription: {
      plan: {
        type: String,
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'inactive',
      },
      validUntil: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
      },
      paymentMethod: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
)

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

UserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password)
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)