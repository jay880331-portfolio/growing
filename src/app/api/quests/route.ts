import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Child from '@/models/Child'
import GrowthLog from '@/models/GrowthLog'
import Quest from '@/models/Quest'
import AIRecommendation from '@/models/AIRecommendation'
import { generateAIResponse, getCurrentAIProvider } from '@/lib/ai-service'
import { getDailyAICache, setDailyAICache } from '@/lib/ai-cache'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    let childId = searchParams.get('childId')
    const action = searchParams.get('action') || 'today' // 'today', 'history'
    const forceNew = searchParams.get('forceNew') === 'true' // 새로운 퀘스트 강제 생성
    
    // childId가 없으면 사용자의 첫 번째 아이를 자동 선택
    let child
    if (!childId) {
      child = await Child.findOne({ userId }).sort({ createdAt: 1 })
      if (!child) {
        return NextResponse.json(
          { error: '등록된 아이가 없습니다. 먼저 아이를 등록해주세요.' },
          { status: 400 }
        )
      }
      childId = child._id.toString()
    } else {
      // 사용자의 아이인지 확인
      child = await Child.findOne({ _id: childId, userId })
      if (!child) {
        return NextResponse.json(
          { error: '권한이 없습니다' },
          { status: 403 }
        )
      }
    }

    // 퀘스트 히스토리 조회
    if (action === 'history') {
      const quests = await Quest.find({ childId })
        .sort({ createdAt: -1 })
        .limit(20)
      
      return NextResponse.json({ quests })
    }

    // 오늘의 퀘스트 조회 (기존 로직)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 오늘 생성된 퀘스트가 있는지 확인 (모든 가족 구성원의 퀘스트)
    const todayQuests = await Quest.find({
      childId,
      generatedAt: { $gte: today, $lt: tomorrow }
    })

    // 1. 캐시 확인 (forceNew가 아닐 때)
    if (!forceNew) {
      const cachedQuests = await getDailyAICache(userId!, 'quest', childId!)
      if (cachedQuests) {
        console.log('퀘스트 캐시 사용')
        return NextResponse.json({
          quests: cachedQuests.quests,
          fromCache: true,
          cacheInfo: {
            message: '오늘 이미 생성된 퀘스트입니다',
            generatedAt: cachedQuests.generatedAt
          }
        })
      }
    }

    // 2. forceNew가 true이면 기존 퀘스트 및 캐시 삭제
    if (forceNew) {
      if (todayQuests.length > 0) {
        await Quest.deleteMany({
          childId,
          generatedAt: { $gte: today, $lt: tomorrow }
        })
      }
      console.log('새로운 퀘스트 강제 생성')
    } else if (todayQuests.length > 0) {
      // 기존 DB 퀘스트가 있으면 반환 (캐시 미스이지만 DB에는 있는 경우)
      return NextResponse.json({ quests: todayQuests, fromCache: false })
    }
    
    // 최근 7일 기록 조회
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentLogs = await GrowthLog.find({
      childId,
      timestamp: { $gte: sevenDaysAgo }
    }).sort({ timestamp: -1 })
    
    // 아이 나이 계산
    const ageInMonths = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    const ageInDays = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24))
    
    // 최근 기록 분석
    const logsByType = recentLogs.reduce((acc, log) => {
      if (!acc[log.type]) acc[log.type] = []
      acc[log.type].push(log)
      return acc
    }, {} as Record<string, any[]>)
    
    // AI에게 퀘스트 요청
    const prompt = `
다음 정보를 바탕으로 오늘 가족 구성원들이 아이와 함께 할 수 있는 의미있는 "오늘의 퀘스트"를 제안해주세요.

아이 정보:
- 이름: ${child.name}
- 나이: ${ageInMonths}개월 (${ageInDays}일)
- 성별: ${child.gender}

최근 7일 기록 요약:
- 수면 기록: ${logsByType.sleep?.length || 0}개
- 식사 기록: ${logsByType.meal?.length || 0}개  
- 활동 기록: ${logsByType.activity?.length || 0}개
- 마일스톤 기록: ${logsByType.milestone?.length || 0}개
- 건강 기록: ${logsByType.health?.length || 0}개

조건:
1. 아이의 발달 단계에 적합한 활동
2. 15-30분 정도로 실현 가능한 활동
3. 가족 구성원별 특성을 고려한 상호작용 활동
4. 기록이 부족한 영역이 있다면 그 영역 개선에 도움되는 활동

가족 구성원별 특성:
- 엄마: 세심한 돌봄, 일상 케어, 감정적 유대
- 아빠: 활동적 놀이, 신체 발달, 도전적 활동
- 할아버지: 지혜 전수, 차분한 활동, 전통 놀이
- 할머니: 따뜻한 돌봄, 요리 활동, 이야기 들려주기

**중요: 반드시 아래 JSON 형태로만 응답해주세요. 다른 텍스트는 절대 포함하지 마세요.**

{
  "quests": [
    {
      "targetParent": "mom",
      "title": "엄마를 위한 퀘스트 제목",
      "description": "엄마와 함께하는 구체적인 활동 설명",
      "category": "activity|milestone|health|bonding|learning",
      "estimatedTime": "예상 소요시간",
      "tips": ["팁1", "팁2", "팁3"]
    },
    {
      "targetParent": "dad", 
      "title": "아빠를 위한 퀘스트 제목",
      "description": "아빠와 함께하는 구체적인 활동 설명",
      "category": "activity|milestone|health|bonding|learning",
      "estimatedTime": "예상 소요시간",
      "tips": ["팁1", "팁2", "팁3"]
    },
    {
      "targetParent": "grandpa",
      "title": "할아버지를 위한 퀘스트 제목",
      "description": "할아버지와 함께하는 구체적인 활동 설명",
      "category": "activity|milestone|health|bonding|learning",
      "estimatedTime": "예상 소요시간",
      "tips": ["팁1", "팁2", "팁3"]
    },
    {
      "targetParent": "grandma",
      "title": "할머니를 위한 퀘스트 제목", 
      "description": "할머니와 함께하는 구체적인 활동 설명",
      "category": "activity|milestone|health|bonding|learning",
      "estimatedTime": "예상 소요시간",
      "tips": ["팁1", "팁2", "팁3"]
    }
  ]
}
    `
    
    const aiResponse = await generateAIResponse(prompt)
    
    try {
      // AI 응답을 JSON으로 파싱
      let parsedResponse
      try {
        parsedResponse = JSON.parse(aiResponse)
      } catch (parseError) {
        console.log('퀘스트 AI JSON 파싱 실패, 기본 퀘스트 사용:', aiResponse.substring(0, 200))
        throw parseError // 기본 퀘스트 로직으로 이동
      }
      
      const questsData = parsedResponse.quests || [parsedResponse] // 이전 형식과의 호환성
      
      // 부모별 퀘스트 저장
      const savedQuests = []
      for (const questData of questsData) {
        const savedQuest = await Quest.create({
          childId,
          title: questData.title,
          description: questData.description,
          category: questData.category,
          estimatedTime: questData.estimatedTime,
          tips: questData.tips || [],
          targetParent: questData.targetParent || 'both',
          aiProvider: getCurrentAIProvider(),
          generatedAt: new Date(),
        })
        savedQuests.push(savedQuest)
      }
      
      // AI 추천 내용 저장
      for (const quest of savedQuests) {
        await AIRecommendation.create({
          userId,
          childId,
          type: 'quest',
          category: quest.category,
          title: quest.title,
          content: quest.description,
          metadata: {
            targetParent: quest.targetParent,
            tips: quest.tips,
            estimatedTime: quest.estimatedTime
          },
          aiProvider: getCurrentAIProvider(),
          confidence: 0.9
        })
      }
      
      // 3. 캐시에 저장
      try {
        const questsDataForCache = {
          quests: savedQuests,
          generatedAt: new Date().toISOString()
        }
        await setDailyAICache(userId!, 'quest', questsDataForCache, childId!)
      } catch (cacheError) {
        console.error('퀘스트 캐시 저장 실패:', cacheError)
        // 캐시 저장 실패해도 API는 정상 응답
      }
      
      return NextResponse.json({ quests: savedQuests, fromCache: false })
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 퀘스트 제공
      const defaultQuests = [
        {
          targetParent: "mom",
          title: "엄마와 함께 책 읽기",
          description: `${child.name}와 함께 그림책을 읽어보세요. 엄마의 따뜻한 목소리로 이야기를 들려주며 상호작용해보세요.`,
          category: "bonding",
          estimatedTime: "15-20분",
          tips: ["아이의 속도에 맞춰 읽기", "그림을 함께 보며 이야기하기", "아이의 반응 기록하기"]
        },
        {
          targetParent: "dad",
          title: "아빠와 감각 놀이 시간",
          description: `${child.name}의 감각 발달을 위한 놀이를 해보세요. 아빠와 함께 다양한 질감의 장난감이나 물건을 탐색해보세요.`,
          category: "activity", 
          estimatedTime: "20-30분",
          tips: ["안전한 재료 사용하기", "아이의 반응 관찰하기", "새로운 감각 경험 제공"]
        },
        {
          targetParent: "grandpa",
          title: "할아버지와 전통 놀이",
          description: `할아버지와 함께 전통적인 놀이를 해보세요. 까꿍놀이나 손유희 등 옛부터 내려온 놀이로 ${child.name}와 소중한 시간을 보내세요.`,
          category: "bonding",
          estimatedTime: "20-25분", 
          tips: ["천천히 반복하며 놀아주기", "할아버지의 지혜 전달하기", "차분한 분위기 만들기"]
        },
        {
          targetParent: "grandma",
          title: "할머니와 요리 놀이",
          description: `할머니와 함께 간단한 요리 활동을 해보세요. ${child.name}가 안전하게 참여할 수 있는 반죽 만들기나 과일 씻기 등을 함께 해보세요.`,
          category: "learning",
          estimatedTime: "25-30분",
          tips: ["안전한 도구만 사용하기", "할머니의 요리 이야기 들려주기", "아이가 직접 참여할 수 있게 하기"]
        }
      ]
      
      // 기본 퀘스트도 부모별로 저장
      const savedQuests = []
      for (const questData of defaultQuests) {
        const savedQuest = await Quest.create({
          childId,
          ...questData,
          aiProvider: getCurrentAIProvider(),
          generatedAt: new Date(),
        })
        savedQuests.push(savedQuest)
        
        // AI 추천 내용 저장
        await AIRecommendation.create({
          userId,
          childId,
          type: 'quest',
          category: questData.category,
          title: questData.title,
          content: questData.description,
          metadata: {
            targetParent: questData.targetParent,
            tips: questData.tips,
            estimatedTime: questData.estimatedTime
          },
          aiProvider: getCurrentAIProvider(),
          confidence: 0.9
        })
      }
      
      // 기본 퀘스트도 캐시에 저장
      try {
        const questsDataForCache = {
          quests: savedQuests,
          generatedAt: new Date().toISOString()
        }
        await setDailyAICache(userId!, 'quest', questsDataForCache, childId!)
      } catch (cacheError) {
        console.error('기본 퀘스트 캐시 저장 실패:', cacheError)
        // 캐시 저장 실패해도 API는 정상 응답
      }
      
      return NextResponse.json({ quests: savedQuests, fromCache: false })
    }
  } catch (error) {
    console.error('퀘스트 생성 오류:', error)
    return NextResponse.json(
      { error: '퀘스트 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}