import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import AIConversation from '@/models/AIConversation'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    
    const query: any = { userId }
    if (childId) {
      query.childId = childId
    }
    
    const conversations = await AIConversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('childId', 'name')
    
    const total = await AIConversation.countDocuments(query)
    
    return NextResponse.json({
      conversations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('대화 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '대화 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}