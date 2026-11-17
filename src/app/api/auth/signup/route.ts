import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { email, password, name } = await request.json()

    // 입력 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요' },
        { status: 400 }
      )
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용중인 이메일입니다' },
        { status: 400 }
      )
    }

    // 사용자 생성
    const user = await User.create({
      email,
      password,
      name,
    })

    // JWT 토큰 생성
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
    })

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('회원가입 오류:', error)
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}