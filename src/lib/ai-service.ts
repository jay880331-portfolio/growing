// 통합 AI 서비스 - OpenAI와 Gemini 지원
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logAIUsage } from './ai-usage-tracker'
import { getUserLanguage, addLanguageInstructionToPrompt, systemMessageTemplates, type SupportedLanguage } from './ai-language-helper'

// AI 제공자 타입
export type AIProvider = 'openai' | 'gemini'

// OpenAI 클라이언트
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Gemini 클라이언트
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' }) // 원래 모델 유지

// 현재 사용할 AI 제공자 (환경변수에서 설정)
const currentProvider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || 'openai'

console.log(`AI Provider 설정: ${currentProvider}`)

/**
 * 통합 AI 응답 생성 함수 (사용량 추적 포함)
 * 환경변수 AI_PROVIDER에 따라 OpenAI 또는 Gemini 사용
 */
export async function generateAIResponse(
  prompt: string, 
  userId?: string,
  trackingInfo?: {
    endpoint: string
    requestType: 'chat' | 'analysis' | 'quest' | 'guide' | 'pattern-detection' | 'input-helper'
    childId?: string
  },
  systemMessageType?: 'aiCoach' | 'analysis' | 'quest'
): Promise<string> {
  console.log(`AI 요청 - Provider: ${currentProvider}, Prompt 길이: ${prompt.length}`)
  const startTime = Date.now()
  
  // 사용자 언어 설정 가져오기
  const userLanguage = await getUserLanguage()
  
  // 언어에 맞는 시스템 메시지 준비
  let systemMessage = ''
  if (systemMessageType && systemMessageTemplates[userLanguage][systemMessageType]) {
    systemMessage = systemMessageTemplates[userLanguage][systemMessageType]
  }
  
  // 프롬프트에 언어 지시사항 추가
  const localizedPrompt = addLanguageInstructionToPrompt(prompt, userLanguage)
  
  let response: string
  let success = false
  let errorMessage: string | undefined
  let inputTokens = 0
  let outputTokens = 0
  let actualProvider = currentProvider

  try {
    if (currentProvider === 'openai') {
      const result = await generateOpenAIResponseWithTracking(localizedPrompt, systemMessage)
      response = result.response
      inputTokens = result.inputTokens
      outputTokens = result.outputTokens
    } else if (currentProvider === 'gemini') {
      const result = await generateGeminiResponseWithTracking(localizedPrompt)
      response = result.response
      inputTokens = result.inputTokens
      outputTokens = result.outputTokens
    } else {
      throw new Error(`지원되지 않는 AI Provider: ${currentProvider}`)
    }
    success = true
  } catch (error: any) {
    console.error(`${currentProvider} AI 오류:`, error.message)
    errorMessage = error.message
    
    // 실패 시 다른 제공자로 fallback
    const fallbackProvider = currentProvider === 'openai' ? 'gemini' : 'openai'
    console.log(`Fallback to ${fallbackProvider}`)
    actualProvider = fallbackProvider
    
    try {
      if (fallbackProvider === 'openai') {
        const result = await generateOpenAIResponseWithTracking(prompt)
        response = result.response
        inputTokens = result.inputTokens
        outputTokens = result.outputTokens
      } else {
        const result = await generateGeminiResponseWithTracking(prompt)
        response = result.response
        inputTokens = result.inputTokens
        outputTokens = result.outputTokens
      }
      success = true
      errorMessage = undefined
    } catch (fallbackError: any) {
      console.error(`Fallback ${fallbackProvider} 오류:`, fallbackError.message)
      errorMessage = fallbackError.message
      response = 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
  }

  // 사용량 로깅 (userId와 trackingInfo가 있을 때만)
  const responseTime = Date.now() - startTime
  if (userId && trackingInfo) {
    await logAIUsage({
      userId,
      endpoint: trackingInfo.endpoint,
      provider: actualProvider,
      model: actualProvider === 'openai' ? 'gpt-4.1-nano-2025-04-14' : 'gemini-2.5-flash-preview-05-20',
      inputTokens,
      outputTokens,
      requestType: trackingInfo.requestType,
      childId: trackingInfo.childId,
      responseTime,
      success,
      errorMessage,
      metadata: {
        promptLength: prompt.length,
        responseLength: response.length
      }
    })
  }

  if (!success && errorMessage) {
    throw new Error(errorMessage)
  }

  return response
}

/**
 * OpenAI GPT 응답 생성 (토큰 추적 포함)
 */
async function generateOpenAIResponseWithTracking(prompt: string, systemMessage?: string): Promise<{
  response: string
  inputTokens: number
  outputTokens: number
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다')
  }

  const messages: any[] = []
  
  if (systemMessage) {
    messages.push({
      role: 'system',
      content: systemMessage
    })
  }
  
  messages.push({
    role: 'user',
    content: prompt
  })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-nano-2025-04-14',
    messages,
    max_tokens: 800,
    temperature: 0.7,
  })

  const response = completion.choices[0]?.message?.content || '응답을 생성할 수 없습니다.'
  const usage = completion.usage

  return {
    response,
    inputTokens: usage?.prompt_tokens || 0,
    outputTokens: usage?.completion_tokens || 0
  }
}

/**
 * OpenAI GPT 응답 생성 (기존 호환성용)
 */
async function generateOpenAIResponse(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다')
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-nano-2025-04-14', // 원래 모델 유지
    messages: [
      {
        role: 'system',
        content: `당신은 전문적인 육아 상담사입니다. 
- 따뜻하고 친근하게 답변해주세요
- 실용적이고 구체적인 조언을 제공해주세요
- 의학적 진단은 피하고, 필요시 전문의 상담을 권하세요
- 부모의 불안감을 덜어주는 방향으로 답변해주세요`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 800, // 약간만 줄여서 토큰 절약
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content || '응답을 생성할 수 없습니다.'
}

/**
 * Google Gemini 응답 생성 (토큰 추적 포함)
 */
async function generateGeminiResponseWithTracking(prompt: string): Promise<{
  response: string
  inputTokens: number
  outputTokens: number
}> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('Google AI API 키가 설정되지 않았습니다')
  }

  const enhancedPrompt = `당신은 전문적인 육아 상담사입니다. \n- 따뜻하고 친근하게 답변해주세요\n- 실용적이고 구체적인 조언을 제공해주세요\n- 의학적 진단은 피하고, 필요시 전문의 상담을 권하세요\n- 부모의 불안감을 덜어주는 방향으로 답변해주세요\n\n사용자 질문: ${prompt}`

  const result = await geminiModel.generateContent(enhancedPrompt)
  const response = await result.response
  const text = response.text()

  // Gemini는 정확한 토큰 수를 제공하지 않으므로 추정
  const estimatedInputTokens = Math.ceil(enhancedPrompt.length / 4)
  const estimatedOutputTokens = Math.ceil(text.length / 4)

  return {
    response: text,
    inputTokens: estimatedInputTokens,
    outputTokens: estimatedOutputTokens
  }
}

/**
 * Google Gemini 응답 생성 (기존 호환성용)
 */
async function generateGeminiResponse(prompt: string): Promise<string> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('Google AI API 키가 설정되지 않았습니다')
  }

  const enhancedPrompt = `당신은 전문적인 육아 상담사입니다. 
- 따뜻하고 친근하게 답변해주세요
- 실용적이고 구체적인 조언을 제공해주세요
- 의학적 진단은 피하고, 필요시 전문의 상담을 권하세요
- 부모의 불안감을 덜어주는 방향으로 답변해주세요

사용자 질문: ${prompt}`

  const result = await geminiModel.generateContent(enhancedPrompt)
  const response = await result.response
  return response.text()
}

/**
 * 아이 데이터 분석 (AI 인사이트 생성용)
 */
export async function analyzeChildData(data: any): Promise<{
  insights: string[]
  recommendations: string[]
  confidence: number
}> {
  const prompt = `
다음은 아이의 성장 데이터입니다:
${JSON.stringify(data, null, 2)}

**중요: 반드시 아래 JSON 형태로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.**

{
  "insights": ["인사이트1", "인사이트2", "인사이트3"],
  "recommendations": ["추천1", "추천2", "추천3"],
  "confidence": 0.8
}
  `
  
  try {
    const response = await generateAIResponse(prompt)
    
    // JSON 파싱 시도
    try {
      return JSON.parse(response)
    } catch (parseError) {
      console.log('데이터 분석 JSON 파싱 실패:', response.substring(0, 200))
      throw parseError // 기본 응답으로 fallback
    }
  } catch (error) {
    console.error('데이터 분석 오류:', error)
    return {
      insights: ['데이터 분석 중 오류가 발생했습니다'],
      recommendations: ['더 많은 데이터를 수집해주세요'],
      confidence: 0.3
    }
  }
}

/**
 * AI 제공자 변경 (런타임에서 변경 가능)
 */
export function setAIProvider(provider: AIProvider) {
  // 주의: 이 함수는 런타임에서 제공자를 변경하지만,
  // 실제로는 환경변수 AI_PROVIDER를 변경하고 서버를 재시작하는 것을 권장
  console.log(`AI Provider 변경: ${provider}`)
  // process.env.AI_PROVIDER = provider // 이는 권장하지 않음
}

/**
 * 현재 AI 제공자 확인
 */
export function getCurrentAIProvider(): AIProvider {
  return currentProvider
}

/**
 * 실시간 성장기록 AI 분석
 */
export async function analyzeGrowthLogRealtime(logData: {
  type: string
  data: any
  timestamp: string
  childAge: number
  recentLogs: any[]
}): Promise<{
  insights: string[]
  suggestions: string[]
  alerts: string[]
  nextRecommendations: string[]
}> {
  const prompt = `
다음은 방금 입력된 아이의 성장 기록입니다:

입력된 기록:
- 유형: ${logData.type}
- 시간: ${logData.timestamp}
- 세부 정보: ${JSON.stringify(logData.data)}
- 아이 나이: ${logData.childAge}개월

최근 7일 기록 요약:
${logData.recentLogs.slice(0, 10).map((log: any) => 
  `- ${log.type}: ${JSON.stringify(log.data)} (${log.timestamp})`
).join('\n')}

이 기록을 분석하여 다음을 JSON 형식으로 제공해주세요:

1. insights: 이 기록에서 발견되는 즉시 인사이트 (1-2개)
2. suggestions: 부모를 위한 즉각적인 제안사항 (1-2개)
3. alerts: 주의가 필요한 패턴이나 이상 징후 (있을 경우만)
4. nextRecommendations: 다음에 기록하면 좋을 것들 (1-2개)

**중요: 반드시 아래 JSON 형태로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.**

{
  "insights": ["인사이트1", "인사이트2"],
  "suggestions": ["제안1", "제안2"],
  "alerts": ["알림1"],
  "nextRecommendations": ["추천1", "추천2"]
}

주의사항:
- 간결하고 실용적인 조언 제공
- 의학적 진단은 피하고 관찰 위주로 설명
- 부모를 안심시키는 톤으로 작성
`

  try {
    const response = await generateAIResponse(prompt)
    
    // JSON 파싱 시도
    let analysis
    try {
      analysis = JSON.parse(response)
    } catch (parseError) {
      console.log('실시간 분석 JSON 파싱 실패:', response.substring(0, 200))
      throw parseError // 기본 응답으로 fallback
    }
    
    return {
      insights: analysis.insights || [],
      suggestions: analysis.suggestions || [],
      alerts: analysis.alerts || [],
      nextRecommendations: analysis.nextRecommendations || []
    }
  } catch (error) {
    console.error('실시간 분석 오류:', error)
    return {
      insights: ['기록이 성공적으로 저장되었습니다.'],
      suggestions: ['꾸준한 기록으로 성장 패턴을 파악해보세요.'],
      alerts: [],
      nextRecommendations: []
    }
  }
}

/**
 * 이상 패턴 감지 및 알림
 */
export async function detectAbnormalPatterns(data: {
  childAge: number
  recentLogs: any[]
  childInfo: any
}): Promise<{
  alerts: Array<{
    type: 'warning' | 'critical' | 'info'
    category: string
    message: string
    suggestion: string
    severity: number // 1-10
  }>
  normalPatterns: string[]
  recommendations: string[]
}> {
  const prompt = `
다음은 아이의 최근 성장 기록 데이터입니다:

아이 정보:
- 나이: ${data.childAge}개월
- 성별: ${data.childInfo.gender}
- 이름: ${data.childInfo.name}

최근 14일간의 기록:
${data.recentLogs.map((log: any, index: number) => 
  `${index + 1}. ${log.type}: ${JSON.stringify(log.data)} - ${log.timestamp}`
).join('\n')}

이 데이터를 분석하여 다음을 JSON 형식으로 제공해주세요:

1. alerts: 이상 패턴이나 주의가 필요한 부분들
2. normalPatterns: 정상적이고 건강한 패턴들
3. recommendations: 개선을 위한 구체적인 제안

**중요: 반드시 아래 JSON 형태로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.**

{
  "alerts": [
    {
      "type": "warning|critical|info",
      "category": "sleep|feeding|activity|development|health",
      "message": "감지된 이상 패턴 설명",
      "suggestion": "구체적인 개선 방안",
      "severity": 1-10
    }
  ],
  "normalPatterns": [
    "정상적인 패턴 설명"
  ],
  "recommendations": [
    "전반적인 개선 제안"
  ]
}

감지해야 할 이상 패턴들:
- 수면: 급격한 수면시간 변화, 불규칙한 패턴, 너무 짧거나 긴 수면
- 식사: 식사량/횟수 급변, 편식, 거부
- 활동: 활동량 급감, 반응 저하
- 발달: 월령에 비해 늦은 발달
- 건강: 반복되는 증상, 컨디션 저하

주의사항:
- 의학적 진단은 피하고 관찰 사실만 언급
- 부모의 불안을 과도하게 조성하지 않도록 균형있게 작성
- 전문의 상담이 필요한 경우에만 권유
- 개월수에 따른 정상 범위 고려
`

  try {
    const response = await generateAIResponse(prompt)
    
    // JSON 파싱 시도
    let analysis
    try {
      analysis = JSON.parse(response)
    } catch (parseError) {
      console.log('이상 패턴 감지 JSON 파싱 실패:', response.substring(0, 200))
      throw parseError // 기본 응답으로 fallback
    }
    
    return {
      alerts: analysis.alerts || [],
      normalPatterns: analysis.normalPatterns || [],
      recommendations: analysis.recommendations || []
    }
  } catch (error) {
    console.error('이상 패턴 감지 오류:', error)
    return {
      alerts: [],
      normalPatterns: ['기록을 더 수집한 후 패턴 분석이 가능합니다.'],
      recommendations: ['꾸준한 기록으로 건강한 성장을 추적해보세요.']
    }
  }
}

/**
 * 월령별 맞춤 성장 가이드
 */
export async function generateMonthlyGrowthGuide(data: {
  childAge: number
  childInfo: any
  currentLogs?: any[]
}): Promise<{
  milestones: Array<{
    category: string
    title: string
    description: string
    achieved: boolean
    expectedTimeframe: string
  }>
  activities: Array<{
    title: string
    description: string
    benefits: string[]
    duration: string
  }>
  nutritionGuide: {
    recommendations: string[]
    portions: string
    schedule: string
  }
  sleepGuide: {
    expectedDuration: string
    schedule: string
    tips: string[]
  }
  developmentFocus: string[]
  nextMonthPreview: string[]
}> {
  const prompt = `
다음 아이의 월령별 맞춤 성장 가이드를 작성해주세요:

아이 정보:
- 나이: ${data.childAge}개월
- 성별: ${data.childInfo.gender}
- 이름: ${data.childInfo.name}

${data.currentLogs ? `현재 기록 패턴:
${data.currentLogs.map((log: any) => `- ${log.type}: ${JSON.stringify(log.data)}`).join('\n')}` : ''}

**중요: 반드시 아래 JSON 형태로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.**

{
  "milestones": [
    {
      "category": "physical|cognitive|social|language",
      "title": "마일스톤 제목",
      "description": "구체적인 설명",
      "achieved": false,
      "expectedTimeframe": "언제까지 달성 예상"
    }
  ],
  "activities": [
    {
      "title": "활동 제목",
      "description": "활동 방법",
      "benefits": ["효과1", "효과2"],
      "duration": "권장 시간"
    }
  ],
  "nutritionGuide": {
    "recommendations": ["영양 권장사항"],
    "portions": "권장 식사량",
    "schedule": "식사 스케줄"
  },
  "sleepGuide": {
    "expectedDuration": "권장 수면시간",
    "schedule": "수면 스케줄",
    "tips": ["수면 팁들"]
  },
  "developmentFocus": [
    "이번 달 중점 발달 영역"
  ],
  "nextMonthPreview": [
    "다음 달 예상 변화"
  ]
}

월령별 특징:
- 0-3개월: 기본 생존 기능, 감각 발달
- 4-6개월: 목 가누기, 뒤집기, 이유식 시작
- 7-12개월: 앉기, 기기, 걷기 준비
- 13-24개월: 걷기, 언어 발달, 자립성
- 25개월+: 복잡한 놀이, 사회성 발달

주의사항:
- 개별 발달 속도 차이 인정
- 강제하지 않는 자연스러운 발달 유도
- 안전을 최우선으로 고려
- 즐거운 상호작용 중심
`

  try {
    const response = await generateAIResponse(prompt)
    
    // JSON 파싱 시도
    let guide
    try {
      guide = JSON.parse(response)
    } catch (parseError) {
      console.log('월령별 가이드 JSON 파싱 실패:', response.substring(0, 200))
      throw parseError // 기본 응답으로 fallback
    }
    
    return {
      milestones: guide.milestones || [],
      activities: guide.activities || [],
      nutritionGuide: guide.nutritionGuide || {
        recommendations: [],
        portions: '',
        schedule: ''
      },
      sleepGuide: guide.sleepGuide || {
        expectedDuration: '',
        schedule: '',
        tips: []
      },
      developmentFocus: guide.developmentFocus || [],
      nextMonthPreview: guide.nextMonthPreview || []
    }
  } catch (error) {
    console.error('월령별 가이드 생성 오류:', error)
    return {
      milestones: [],
      activities: [],
      nutritionGuide: {
        recommendations: ['월령에 맞는 영양 관리가 중요합니다.'],
        portions: '아이의 식욕에 맞춰 조절해주세요.',
        schedule: '규칙적인 식사 시간을 유지해주세요.'
      },
      sleepGuide: {
        expectedDuration: '충분한 수면이 성장에 중요합니다.',
        schedule: '일정한 수면 패턴을 만들어주세요.',
        tips: ['조용하고 어두운 환경', '일정한 취침 루틴']
      },
      developmentFocus: ['꾸준한 관찰과 사랑으로 발달을 도와주세요.'],
      nextMonthPreview: ['매달 새로운 변화가 기대됩니다.']
    }
  }
}

/**
 * AI 기반 기록 입력 도우미
 */
export async function getSmartInputSuggestions(data: {
  logType: string
  currentInput: string
  childAge: number
  recentLogs: any[]
}): Promise<{
  suggestions: Array<{
    field: string
    value: any
    reason: string
  }>
  autoComplete: Array<{
    text: string
    confidence: number
  }>
  validationTips: string[]
}> {
  const prompt = `
사용자가 아이의 성장 기록을 입력하고 있습니다. 스마트한 입력 도우미 역할을 해주세요.

현재 입력 상황:
- 기록 유형: ${data.logType}
- 현재 입력된 내용: ${data.currentInput}
- 아이 나이: ${data.childAge}개월

최근 패턴 (참고용):
${data.recentLogs.map((log: any) => 
  `- ${log.type}: ${JSON.stringify(log.data)} (${log.timestamp})`
).join('\n')}

**중요: 반드시 아래 JSON 형태로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.**

{
  "suggestions": [
    {
      "field": "필드명",
      "value": "제안값",
      "reason": "제안 이유"
    }
  ],
  "autoComplete": [
    {
      "text": "자동완성 텍스트",
      "confidence": 0.8
    }
  ],
  "validationTips": [
    "입력 시 주의사항이나 팁"
  ]
}

기록 유형별 도움말:
- sleep: 적정 수면시간, 수면 패턴 제안
- meal: 적정 식사량, 영양 균형 제안  
- activity: 발달에 도움되는 활동 제안
- health: 일반적인 증상 패턴 안내
- milestone: 월령별 기대 발달사항

주의사항:
- 개인차를 고려한 범위형 제안
- 의학적 진단 금지
- 실용적이고 구체적인 도움 제공
- 부모의 입력 부담 줄이기
`

  try {
    const response = await generateAIResponse(prompt)
    
    // JSON 파싱 시도
    let helper
    try {
      helper = JSON.parse(response)
    } catch (parseError) {
      console.log('입력 도우미 JSON 파싱 실패:', response.substring(0, 200))
      throw parseError // 기본 응답으로 fallback
    }
    
    return {
      suggestions: helper.suggestions || [],
      autoComplete: helper.autoComplete || [],
      validationTips: helper.validationTips || []
    }
  } catch (error) {
    console.error('입력 도우미 오류:', error)
    return {
      suggestions: [],
      autoComplete: [],
      validationTips: ['정확한 정보를 입력해주세요.']
    }
  }
}