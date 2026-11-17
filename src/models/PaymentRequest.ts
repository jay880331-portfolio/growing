import mongoose from 'mongoose'

const PaymentRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  region: {
    type: String,
    enum: ['korea', 'vietnam'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['kakao', 'zalo', 'momo', 'bank_transfer', 'toss', 'paypal'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['KRW', 'VND', 'USD'],
    required: true
  },
  plan: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'processed', 'failed'],
    default: 'pending'
  },
  paymentProof: {
    type: String, // 결제 증빙 이미지 URL
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  processedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.models.PaymentRequest || mongoose.model('PaymentRequest', PaymentRequestSchema)