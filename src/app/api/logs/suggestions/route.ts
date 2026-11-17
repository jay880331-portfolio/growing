import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import GrowthLog from '@/models/GrowthLog'
import Child from '@/models/Child'
import { generateAIResponse } from '@/lib/ai-service'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')
    
    if (!childId) {
      return NextResponse.json(
        { error: '아이 ID가 필요합니다' },
        { status: 400 }
      )
    }
    
    // 사용자의 아이인지 확인
    const child = await Child.findOne({ _id: childId, userId })
    if (!child) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 최근 24시간과 최근 7일 기록 조회
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [todayLogs, recentLogs] = await Promise.all([
      GrowthLog.find({
        childId,
        timestamp: { $gte: oneDayAgo }
      }).sort({ timestamp: -1 }),
      
      GrowthLog.find({
        childId,
        timestamp: { $gte: sevenDaysAgo }
      }).sort({ timestamp: -1 }).limit(20)
    ])

    // 아이 나이 계산
    const childAge = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))

    // AI에게 추천 요청
    const prompt = `
다음은 아이의 최근 성장 기록입니다:

아이 정보:
- 이름: ${child.name}
- 나이: ${childAge}개월
- 성별: ${child.gender}

오늘(최근 24시간) 기록:
${todayLogs.map(log => 
  `- ${log.type}: ${JSON.stringify(log.data)} (${log.timestamp.toLocaleString('ko-KR')})`
).join('\n')}

최근 7일 패턴:
${recentLogs.map(log => 
  `- ${log.type}: ${JSON.stringify(log.data)} (${log.timestamp.toLocaleDateString('ko-KR')})`
).join('\n')}

현재 시간: ${now.toLocaleString('ko-KR')}

**중요: 반드시 아래 JSON 형태로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.**

{
  "urgentSuggestions": [
    {
      "type": "기록 유형",
      "reason": "추천 이유",
      "priority": "high|medium|low"
    }
  ],
  "generalSuggestions": [
    {
      "type": "기록 유형", 
      "reason": "추천 이유",
      "timing": "권장 시간"
    }
  ],
  "patterns": [
    "발견된 패턴 설명"
  ]
}

고려사항:
- 아이의 나이에 맞는 적절한 기록 주기
- 최근 기록된 시간과 일반적인 간격
- 누락되거나 불규칙한 패턴
- 건강하고 규칙적인 성장을 위한 제안
`

    try {
      const aiResponse = await generateAIResponse(prompt)
      
      // JSON 파싱 시도
      let suggestions
      try {
        suggestions = JSON.parse(aiResponse)
      } catch (parseError) {
        console.log('AI JSON 파싱 실패, 텍스트 응답:', aiResponse.substring(0, 200))
        
        // JSON이 아닌 경우 기본 추천 사용
        const basicSuggestions = generateBasicSuggestions(todayLogs, childAge)
        return NextResponse.json({ 
          suggestions: basicSuggestions,
          stats: {
            todayLogsCount: todayLogs.length,
            recentLogsCount: recentLogs.length,
            childAge
          },
          fromAI: false
        })
      }
      
      return NextResponse.json({ 
        suggestions,
        stats: {
          todayLogsCount: todayLogs.length,
          recentLogsCount: recentLogs.length,
          childAge
        },
        fromAI: true
      })
    } catch (aiError) {
      console.error('AI 추천 오류:', aiError)
      
      // AI 실패 시 기본 추천
      const basicSuggestions = generateBasicSuggestions(todayLogs, childAge)
      return NextResponse.json({ 
        suggestions: basicSuggestions,
        stats: {
          todayLogsCount: todayLogs.length,
          recentLogsCount: recentLogs.length,
          childAge
        }
      })
    }
  } catch (error) {
    console.error('추천 조회 오류:', error)
    return NextResponse.json(
      { error: '추천을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

function generateBasicSuggestions(todayLogs: any[], childAge: number) {
  const logTypes = todayLogs.map(log => log.type)
  const suggestions: any = {
    urgentSuggestions: [],
    generalSuggestions: [],
    patterns: []
  }

  // 기본적인 누락 체크
  if (!logTypes.includes('meal')) {
    suggestions.urgentSuggestions.push({
      type: 'meal',
      reason: '오늘 식사 기록이 없습니다',
      priority: 'high'
    })
  }

  if (!logTypes.includes('sleep')) {
    suggestions.generalSuggestions.push({
      type: 'sleep',
      reason: '수면 패턴 추적을 위해 기록해보세요',
      timing: '잠들기 전'
    })
  }

  if (!logTypes.includes('activity')) {
    suggestions.generalSuggestions.push({
      type: 'activity',
      reason: '일일 활동을 기록해보세요',
      timing: '언제든지'
    })
  }

  return suggestions
}