import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '토큰이 없습니다' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    // 사용자가 실제로 존재하는지 확인
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('토큰 검증 오류:', error)
    return NextResponse.json(
      { error: '유효하지 않은 토큰입니다' },
      { status: 401 }
    )
  }
}