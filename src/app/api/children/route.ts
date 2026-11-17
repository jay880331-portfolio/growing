import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Child from '@/models/Child'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 아이 API 호출됨')
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    console.log('🔍 userId:', userId)
    
    const children = await Child.find({ userId }).sort({ createdAt: -1 })
    console.log('🔍 조회된 아이들:', children.length, '명')
    console.log('🔍 아이 데이터:', children)
    
    return NextResponse.json({ children })
  } catch (error) {
    console.error('아이 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '아이 목록을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const body = await request.json()
    
    const { name, birthDate, gender, profileImage } = body
    
    // 입력 검증
    if (!name || !birthDate || !gender) {
      return NextResponse.json(
        { error: '필수 정보를 모두 입력해주세요' },
        { status: 400 }
      )
    }
    
    const child = await Child.create({
      userId,
      name,
      birthDate: new Date(birthDate),
      gender,
      profileImage,
    })
    
    return NextResponse.json({ child }, { status: 201 })
  } catch (error) {
    console.error('아이 프로필 생성 오류:', error)
    return NextResponse.json(
      { error: '아이 프로필 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}