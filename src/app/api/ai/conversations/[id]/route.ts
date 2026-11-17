import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import AIConversation from '@/models/AIConversation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }
    
    const resolvedParams = await params
    const conversation = await AIConversation.findOne({
      _id: resolvedParams.id,
      userId
    }).populate('childId', 'name')
    
    if (!conversation) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('대화 조회 오류:', error)
    return NextResponse.json(
      { error: '대화 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }
    
    const resolvedParams = await params
    const result = await AIConversation.deleteOne({
      _id: resolvedParams.id,
      userId
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: '대화를 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: '대화가 삭제되었습니다' })
  } catch (error) {
    console.error('대화 삭제 오류:', error)
    return NextResponse.json(
      { error: '대화 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}