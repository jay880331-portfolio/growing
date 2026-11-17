import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Child from '@/models/Child'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    
    const params = await context.params
    const userId = request.headers.get('x-user-id')
    const child = await Child.findOne({ _id: params.id, userId })
    
    if (!child) {
      return NextResponse.json(
        { error: '아이 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ child })
  } catch (error) {
    console.error('아이 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '아이 정보를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    
    const params = await context.params
    const userId = request.headers.get('x-user-id')
    const body = await request.json()
    
    const child = await Child.findOneAndUpdate(
      { _id: params.id, userId },
      body,
      { new: true, runValidators: true }
    )
    
    if (!child) {
      return NextResponse.json(
        { error: '아이 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ child })
  } catch (error) {
    console.error('아이 정보 수정 오류:', error)
    return NextResponse.json(
      { error: '아이 정보 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    
    const params = await context.params
    const userId = request.headers.get('x-user-id')
    const child = await Child.findOneAndDelete({ _id: params.id, userId })
    
    if (!child) {
      return NextResponse.json(
        { error: '아이 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: '아이 정보가 삭제되었습니다' })
  } catch (error) {
    console.error('아이 정보 삭제 오류:', error)
    return NextResponse.json(
      { error: '아이 정보 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}