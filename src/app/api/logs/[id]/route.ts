import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import GrowthLog from '@/models/GrowthLog'
import Child from '@/models/Child'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    
    const params = await context.params
    const userId = request.headers.get('x-user-id')
    
    const log = await GrowthLog.findById(params.id).populate('childId')
    
    if (!log) {
      return NextResponse.json(
        { error: '성장 기록을 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    // 해당 아이가 사용자의 아이인지 확인
    const child = await Child.findOne({ _id: log.childId, userId })
    if (!child) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ log })
  } catch (error) {
    console.error('성장 기록 조회 오류:', error)
    return NextResponse.json(
      { error: '성장 기록을 불러오는 중 오류가 발생했습니다' },
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
    
    const log = await GrowthLog.findById(params.id)
    
    if (!log) {
      return NextResponse.json(
        { error: '성장 기록을 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    // 해당 아이가 사용자의 아이인지 확인
    const child = await Child.findOne({ _id: log.childId, userId })
    if (!child) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }
    
    const updatedLog = await GrowthLog.findByIdAndUpdate(
      params.id,
      {
        ...body,
        timestamp: body.timestamp ? new Date(body.timestamp) : log.timestamp
      },
      { new: true, runValidators: true }
    )
    
    return NextResponse.json({ log: updatedLog })
  } catch (error) {
    console.error('성장 기록 수정 오류:', error)
    return NextResponse.json(
      { error: '성장 기록 수정 중 오류가 발생했습니다' },
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
    
    const log = await GrowthLog.findById(params.id)
    
    if (!log) {
      return NextResponse.json(
        { error: '성장 기록을 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    // 해당 아이가 사용자의 아이인지 확인
    const child = await Child.findOne({ _id: log.childId, userId })
    if (!child) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }
    
    await GrowthLog.findByIdAndDelete(params.id)
    
    return NextResponse.json({ message: '성장 기록이 삭제되었습니다' })
  } catch (error) {
    console.error('성장 기록 삭제 오류:', error)
    return NextResponse.json(
      { error: '성장 기록 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}