import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GOOGLE_AI_API_KEY || ''
console.log('Gemini API Key 확인:', apiKey ? `키 존재 (길이: ${apiKey.length})` : '키 없음')

const genAI = new GoogleGenerativeAI(apiKey)

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' })

export async function generateAIResponse(prompt: string): Promise<string> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('Google AI API 키가 설정되지 않았습니다')
  }

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    console.error('Gemini API 상세 오류:', {
      message: error.message,
      status: error.status,
      details: error.details || error
    })
    
    // API 키 관련 오류
    if (error.message?.includes('API_KEY') || error.status === 400) {
      throw new Error('AI API 설정에 문제가 있습니다. 관리자에게 문의해주세요.')
    }
    
    // 할당량 초과
    if (error.status === 429) {
      throw new Error('AI 서비스 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.')
    }
    
    // 일반적인 오류
    throw new Error('AI 응답 생성 중 일시적인 오류가 발생했습니다. 다시 시도해주세요.')
  }
}

export async function analyzeChildData(data: any): Promise<{
  insights: string[]
  recommendations: string[]
  confidence: number
}> {
  const prompt = `
    다음은 아이의 성장 데이터입니다:
    ${JSON.stringify(data, null, 2)}
    
    이 데이터를 분석하여:
    1. 주요 인사이트 3개
    2. 부모를 위한 추천 사항 3개
    3. 분석의 신뢰도 (0-1 사이의 값)
    
    를 JSON 형식으로 제공해주세요.
  `
  
  try {
    const response = await generateAIResponse(prompt)
    return JSON.parse(response)
  } catch (error) {
    return {
      insights: ['데이터 분석 중 오류가 발생했습니다'],
      recommendations: ['더 많은 데이터를 수집해주세요'],
      confidence: 0.3
    }
  }
}