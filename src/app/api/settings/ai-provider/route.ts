import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAIProvider } from '@/lib/ai-service'

export async function GET(request: NextRequest) {
  try {
    const provider = getCurrentAIProvider()
    
    return NextResponse.json({ 
      provider,
      available: ['openai', 'gemini'],
      description: {
        openai: 'OpenAI GPT-4o-mini - 뛰어난 대화 품질과 창의적 답변',
        gemini: 'Google Gemini 2.5 Flash - 빠른 응답 속도와 무료 사용량'
      }
    })
  } catch (error) {
    console.error('AI 제공자 조회 오류:', error)
    return NextResponse.json(
      { error: 'AI 제공자 정보를 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}