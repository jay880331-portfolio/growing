import mongoose from 'mongoose'

export interface IChild {
  _id: string
  userId: string
  name: string
  birthDate: Date
  gender: 'male' | 'female' | 'other'
  profileImage?: string
  createdAt: Date
  updatedAt: Date
}

const ChildSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, '아이 이름은 필수입니다'],
      trim: true,
    },
    birthDate: {
      type: Date,
      required: [true, '생년월일은 필수입니다'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, '성별은 필수입니다'],
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Child || mongoose.model<IChild>('Child', ChildSchema)