// 연령별 기록 유형 정의

export interface RecordType {
  type: string
  icon: string
  label: string
  color: string
  bgColor: string
  description: string
  quickActions: Array<{
    label: string
    data: any
    action: 'start' | 'complete'
  }>
}

export interface AgeGroup {
  name: string
  startAge: number // 개월 수
  endAge: number
  description: string
  records: RecordType[]
}

export const AGE_GROUPS: AgeGroup[] = [
  {
    name: '신생아/영아기',
    startAge: 0,
    endAge: 12,
    description: '0~12개월: 기본적인 생리 활동 중심',
    records: [
      {
        type: 'feeding',
        icon: '🍼',
        label: '수유',
        color: 'text-green-800',
        bgColor: 'bg-green-50',
        description: '모유, 분유, 이유식',
        quickActions: [
          { label: '모유', data: { type: 'breast_milk', amount: 120 }, action: 'complete' },
          { label: '분유', data: { type: 'formula', amount: 120 }, action: 'complete' },
          { label: '이유식', data: { type: 'baby_food', amount: 50 }, action: 'complete' }
        ]
      },
      {
        type: 'sleep',
        icon: '😴',
        label: '수면',
        color: 'text-blue-800',
        bgColor: 'bg-blue-50',
        description: '낮잠, 밤잠, 수면 패턴',
        quickActions: [
          { label: '낮잠 시작', data: { duration: 0, type: 'nap' }, action: 'start' },
          { label: '밤잠 시작', data: { duration: 0, type: 'night' }, action: 'start' },
          { label: '깨어남', data: { duration: 8, quality: 'good' }, action: 'complete' }
        ]
      },
      {
        type: 'diaper',
        icon: '🚼',
        label: '기저귀',
        color: 'text-yellow-800',
        bgColor: 'bg-yellow-50',
        description: '기저귀 교체 기록',
        quickActions: [
          { label: '소변', data: { type: 'wet' }, action: 'complete' },
          { label: '대변', data: { type: 'dirty' }, action: 'complete' },
          { label: '혼합', data: { type: 'mixed' }, action: 'complete' }
        ]
      },
      {
        type: 'milestone',
        icon: '🏃',
        label: '발달',
        color: 'text-pink-800',
        bgColor: 'bg-pink-50',
        description: '첫 미소, 뒤집기, 기어가기 등',
        quickActions: [
          { label: '첫 미소', data: { milestone: 'first_smile' }, action: 'complete' },
          { label: '뒤집기', data: { milestone: 'roll_over' }, action: 'complete' },
          { label: '앉기', data: { milestone: 'sitting' }, action: 'complete' }
        ]
      }
    ]
  },
  {
    name: '유아기',
    startAge: 13,
    endAge: 36,
    description: '1~3세: 활동적 놀이와 언어 발달',
    records: [
      {
        type: 'meal',
        icon: '🍽️',
        label: '식사',
        color: 'text-green-800',
        bgColor: 'bg-green-50',
        description: '정식 식사, 간식',
        quickActions: [
          { label: '아침식사', data: { mealType: 'breakfast', completed: true }, action: 'complete' },
          { label: '점심식사', data: { mealType: 'lunch', completed: true }, action: 'complete' },
          { label: '저녁식사', data: { mealType: 'dinner', completed: true }, action: 'complete' },
          { label: '간식', data: { mealType: 'snack', item: '과일' }, action: 'complete' }
        ]
      },
      {
        type: 'play',
        icon: '🎮',
        label: '놀이',
        color: 'text-purple-800',
        bgColor: 'bg-purple-50',
        description: '실내/외 놀이 활동',
        quickActions: [
          { label: '블록놀이', data: { activity: 'blocks', duration: 30 }, action: 'complete' },
          { label: '그림그리기', data: { activity: 'drawing', duration: 20 }, action: 'complete' },
          { label: '공놀이', data: { activity: 'ball_play', duration: 15 }, action: 'complete' },
          { label: '퍼즐', data: { activity: 'puzzle', duration: 25 }, action: 'complete' }
        ]
      },
      {
        type: 'language',
        icon: '🗣️',
        label: '언어',
        color: 'text-indigo-800',
        bgColor: 'bg-indigo-50',
        description: '첫 단어, 문장, 대화',
        quickActions: [
          { label: '새로운 단어', data: { type: 'new_word', word: '' }, action: 'complete' },
          { label: '두 단어 조합', data: { type: 'two_words' }, action: 'complete' },
          { label: '짧은 문장', data: { type: 'short_sentence' }, action: 'complete' }
        ]
      },
      {
        type: 'potty',
        icon: '🚽',
        label: '배변훈련',
        color: 'text-orange-800',
        bgColor: 'bg-orange-50',
        description: '기저귀 떼기, 변기 사용',
        quickActions: [
          { label: '변기 성공', data: { type: 'success', location: 'potty' }, action: 'complete' },
          { label: '기저귀 실수', data: { type: 'accident' }, action: 'complete' },
          { label: '밤 성공', data: { type: 'night_success' }, action: 'complete' }
        ]
      },
      {
        type: 'social',
        icon: '👫',
        label: '사회성',
        color: 'text-teal-800',
        bgColor: 'bg-teal-50',
        description: '친구와 놀기, 공유하기',
        quickActions: [
          { label: '친구와 놀이', data: { activity: 'play_with_friends' }, action: 'complete' },
          { label: '나누어주기', data: { activity: 'sharing' }, action: 'complete' },
          { label: '순서 지키기', data: { activity: 'turn_taking' }, action: 'complete' }
        ]
      }
    ]
  },
  {
    name: '유치원기',
    startAge: 37,
    endAge: 72,
    description: '3~6세: 학습과 창의 활동',
    records: [
      {
        type: 'learning',
        icon: '📚',
        label: '학습',
        color: 'text-blue-800',
        bgColor: 'bg-blue-50',
        description: '한글, 숫자, 영어 학습',
        quickActions: [
          { label: '한글 읽기', data: { subject: 'korean', activity: 'reading' }, action: 'complete' },
          { label: '숫자 세기', data: { subject: 'math', activity: 'counting' }, action: 'complete' },
          { label: '영어 단어', data: { subject: 'english', activity: 'vocabulary' }, action: 'complete' },
          { label: '그림책 읽기', data: { subject: 'reading', book: '' }, action: 'complete' }
        ]
      },
      {
        type: 'creative',
        icon: '🎨',
        label: '창작',
        color: 'text-pink-800',
        bgColor: 'bg-pink-50',
        description: '그림, 만들기, 음악',
        quickActions: [
          { label: '그림 그리기', data: { activity: 'drawing', theme: '' }, action: 'complete' },
          { label: '만들기', data: { activity: 'crafting', item: '' }, action: 'complete' },
          { label: '노래 부르기', data: { activity: 'singing', song: '' }, action: 'complete' },
          { label: '악기 연주', data: { activity: 'instrument', instrument: '' }, action: 'complete' }
        ]
      },
      {
        type: 'physical',
        icon: '🏃‍♂️',
        label: '신체활동',
        color: 'text-green-800',
        bgColor: 'bg-green-50',
        description: '운동, 놀이, 신체 발달',
        quickActions: [
          { label: '자전거 타기', data: { activity: 'cycling', duration: 30 }, action: 'complete' },
          { label: '공원 놀이', data: { activity: 'playground', duration: 60 }, action: 'complete' },
          { label: '수영', data: { activity: 'swimming', duration: 45 }, action: 'complete' },
          { label: '축구', data: { activity: 'soccer', duration: 30 }, action: 'complete' }
        ]
      },
      {
        type: 'emotion',
        icon: '😊',
        label: '감정',
        color: 'text-purple-800',
        bgColor: 'bg-purple-50',
        description: '감정 표현, 기분 변화',
        quickActions: [
          { label: '기쁨', data: { emotion: 'happy', reason: '' }, action: 'complete' },
          { label: '슬픔', data: { emotion: 'sad', reason: '' }, action: 'complete' },
          { label: '화남', data: { emotion: 'angry', reason: '' }, action: 'complete' },
          { label: '두려움', data: { emotion: 'scared', reason: '' }, action: 'complete' }
        ]
      }
    ]
  },
  {
    name: '학령기',
    startAge: 73,
    endAge: 144,
    description: '6~12세: 학교생활과 학습',
    records: [
      {
        type: 'school',
        icon: '🏫',
        label: '학교생활',
        color: 'text-blue-800',
        bgColor: 'bg-blue-50',
        description: '수업, 숙제, 시험',
        quickActions: [
          { label: '숙제 완료', data: { subject: '', completed: true }, action: 'complete' },
          { label: '시험', data: { subject: '', score: 0 }, action: 'complete' },
          { label: '학교 행사', data: { event: '' }, action: 'complete' }
        ]
      },
      {
        type: 'hobby',
        icon: '🎯',
        label: '취미',
        color: 'text-purple-800',
        bgColor: 'bg-purple-50',
        description: '특기, 관심사, 활동',
        quickActions: [
          { label: '피아노 연습', data: { hobby: 'piano', duration: 30 }, action: 'complete' },
          { label: '태권도', data: { hobby: 'taekwondo', duration: 60 }, action: 'complete' },
          { label: '독서', data: { hobby: 'reading', book: '' }, action: 'complete' }
        ]
      },
      {
        type: 'friendship',
        icon: '👥',
        label: '친구관계',
        color: 'text-green-800',
        bgColor: 'bg-green-50',
        description: '친구와의 관계, 갈등 해결',
        quickActions: [
          { label: '새 친구', data: { type: 'new_friend', name: '' }, action: 'complete' },
          { label: '친구와 놀기', data: { type: 'play_together' }, action: 'complete' },
          { label: '갈등 해결', data: { type: 'conflict_resolution' }, action: 'complete' }
        ]
      }
    ]
  },
  {
    name: '청소년기',
    startAge: 145,
    endAge: 216,
    description: '12~18세: 사춘기와 진로 탐색',
    records: [
      {
        type: 'academic',
        icon: '📖',
        label: '학업',
        color: 'text-blue-800',
        bgColor: 'bg-blue-50',
        description: '내신, 진로, 입시',
        quickActions: [
          { label: '시험 점수', data: { subject: '', score: 0, grade: '' }, action: 'complete' },
          { label: '진로 상담', data: { career: '', counseling: true }, action: 'complete' },
          { label: '대학 탐방', data: { university: '' }, action: 'complete' }
        ]
      },
      {
        type: 'identity',
        icon: '🤔',
        label: '정체성',
        color: 'text-purple-800',
        bgColor: 'bg-purple-50',
        description: '자아 찾기, 가치관 형성',
        quickActions: [
          { label: '관심사 발견', data: { interest: '' }, action: 'complete' },
          { label: '가치관 토론', data: { topic: '' }, action: 'complete' },
          { label: '미래 계획', data: { plan: '' }, action: 'complete' }
        ]
      },
      {
        type: 'relationships',
        icon: '💕',
        label: '인간관계',
        color: 'text-pink-800',
        bgColor: 'bg-pink-50',
        description: '친구, 가족, 이성 관계',
        quickActions: [
          { label: '친구와 갈등', data: { type: 'conflict', resolved: false }, action: 'complete' },
          { label: '새로운 만남', data: { type: 'new_relationship' }, action: 'complete' },
          { label: '가족 대화', data: { topic: '' }, action: 'complete' }
        ]
      }
    ]
  }
]

// 연령에 따른 기록 유형 반환
export function getRecordsByAge(ageInMonths: number): RecordType[] {
  const ageGroup = AGE_GROUPS.find(group => 
    ageInMonths >= group.startAge && ageInMonths <= group.endAge
  )
  
  return ageGroup ? ageGroup.records : AGE_GROUPS[0].records
}

// 현재 연령대 정보 반환
export function getAgeGroupInfo(ageInMonths: number): AgeGroup | null {
  return AGE_GROUPS.find(group => 
    ageInMonths >= group.startAge && ageInMonths <= group.endAge
  ) || null
}

// 연령에 따른 AI 추천값
export function getAgeBasedRecommendations(ageInMonths: number, recordType: string) {
  if (ageInMonths <= 12) {
    // 영아기
    switch (recordType) {
      case 'feeding':
        return {
          amount: ageInMonths <= 1 ? 80 : ageInMonths <= 3 ? 120 : ageInMonths <= 6 ? 150 : 200,
          frequency: '2-3시간마다'
        }
      case 'sleep':
        return {
          duration: ageInMonths <= 3 ? 16 : ageInMonths <= 6 ? 14 : 13,
          naps: ageInMonths <= 6 ? '3-4회' : '2-3회'
        }
    }
  } else if (ageInMonths <= 36) {
    // 유아기
    switch (recordType) {
      case 'meal':
        return {
          meals: 3,
          snacks: 2,
          variety: '다양한 식재료'
        }
      case 'play':
        return {
          duration: '30-60분',
          type: '창의적 놀이 권장'
        }
    }
  } else if (ageInMonths <= 72) {
    // 유치원기
    switch (recordType) {
      case 'learning':
        return {
          duration: '15-30분',
          focus: '놀이를 통한 학습'
        }
      case 'physical':
        return {
          duration: '60분 이상',
          type: '다양한 신체활동'
        }
    }
  }
  
  return {}
}