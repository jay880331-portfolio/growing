import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse, getCurrentAIProvider } from '@/lib/ai-service'
import { aiUsageLimitMiddleware, checkAIUsageLimit } from '@/lib/ai-usage-tracker'
import dbConnect from '@/lib/mongodb'
import Child from '@/models/Child'
import GrowthLog from '@/models/GrowthLog'
import AIConversation from '@/models/AIConversation'
import AIRecommendation from '@/models/AIRecommendation'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const { message, childId, conversationId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }
    
    if (!message) {
      return NextResponse.json(
        { error: '메시지를 입력해주세요' },
        { status: 400 }
      )
    }

    // AI 사용량 제한 확인
    const usageCheck = await aiUsageLimitMiddleware(userId)
    if (!usageCheck.proceed) {
      return NextResponse.json(
        { 
          error: usageCheck.error,
          usageInfo: usageCheck.usageInfo,
          limitExceeded: true
        },
        { status: 429 }
      )
    }
    
    // 아이 정보와 최근 기록 가져오기
    let context = ''
    if (childId) {
      const child = await Child.findOne({ _id: childId, userId })
      if (child) {
        const recentLogs = await GrowthLog.find({ childId })
          .sort({ timestamp: -1 })
          .limit(10)
        
        context = `
아이 정보:
- 이름: ${child.name}
- 나이: ${Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30))}개월
- 성별: ${child.gender}

최근 기록:
${recentLogs.map(log => `- ${log.type}: ${JSON.stringify(log.data)}`).join('\n')}
        `
      }
    }
    
    const prompt = `
당신은 육아 전문가 AI 어시스턴트입니다. 부모의 질문에 친절하고 전문적으로 답변해주세요.

${context}

부모의 질문: ${message}

답변:
    `
    
    const response = await generateAIResponse(prompt, userId, {
      endpoint: '/api/ai/chat',
      requestType: 'chat',
      childId: childId || undefined
    }, 'aiCoach')
    
    // 대화 내역 저장 또는 업데이트
    let conversation
    if (conversationId) {
      // 기존 대화에 추가
      conversation = await AIConversation.findOneAndUpdate(
        { _id: conversationId, userId },
        {
          $push: {
            messages: [
              { role: 'user', content: message, timestamp: new Date() },
              { role: 'assistant', content: response, timestamp: new Date() }
            ]
          },
          aiProvider: getCurrentAIProvider()
        },
        { new: true }
      )
    } else {
      // 새 대화 생성
      conversation = await AIConversation.create({
        userId,
        childId,
        messages: [
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: response, timestamp: new Date() }
        ],
        aiProvider: getCurrentAIProvider()
      })
    }
    
    // AI 추천 내용 저장 (중요한 조언이나 추천사항 감지)
    if (response.includes('추천') || response.includes('권장') || response.includes('주의')) {
      await AIRecommendation.create({
        userId,
        childId,
        type: 'analysis',
        category: 'ai_coach',
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        content: response,
        aiProvider: getCurrentAIProvider(),
        confidence: 0.8
      })
    }
    
    // AI 사용 후 업데이트된 사용량 정보 가져오기
    const updatedUsageInfo = await checkAIUsageLimit(userId)
    
    return NextResponse.json({ 
      response,
      conversationId: conversation._id,
      usageInfo: updatedUsageInfo
    })
  } catch (error) {
    console.error('AI 채팅 오류:', error)
    return NextResponse.json(
      { error: 'AI 응답 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}