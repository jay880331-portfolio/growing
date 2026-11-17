import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Quest from '@/models/Quest'
import Child from '@/models/Child'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    
    const params = await context.params
    const userId = request.headers.get('x-user-id')
    const body = await request.json()
    
    const quest = await Quest.findById(params.id).populate('childId')
    
    if (!quest) {
      return NextResponse.json(
        { error: '퀘스트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    // 해당 아이가 사용자의 아이인지 확인
    const child = await Child.findOne({ _id: quest.childId, userId })
    if (!child) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }
    
    // 상태 업데이트
    const updateData: any = {}
    
    if (body.status) {
      updateData.status = body.status
      if (body.status === 'completed') {
        updateData.completedAt = new Date()
      }
    }
    
    if (body.parentNotes) {
      updateData.parentNotes = body.parentNotes
    }
    
    const updatedQuest = await Quest.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )
    
    return NextResponse.json({ quest: updatedQuest })
  } catch (error) {
    console.error('퀘스트 업데이트 오류:', error)
    return NextResponse.json(
      { error: '퀘스트 업데이트 중 오류가 발생했습니다' },
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
    
    const quest = await Quest.findById(params.id).populate('childId')
    
    if (!quest) {
      return NextResponse.json(
        { error: '퀘스트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    // 해당 아이가 사용자의 아이인지 확인
    const child = await Child.findOne({ _id: quest.childId, userId })
    if (!child) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }
    
    await Quest.findByIdAndDelete(params.id)
    
    return NextResponse.json({ message: '퀘스트가 삭제되었습니다' })
  } catch (error) {
    console.error('퀘스트 삭제 오류:', error)
    return NextResponse.json(
      { error: '퀘스트 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}