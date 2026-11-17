# 🚀 그로잉(Growing) - AI 기반 아이 성장 추적 앱

AI가 실시간으로 분석하고 조언하는 차세대 육아 앱

## 📋 프로젝트 개요

- **앱명**: 그로잉(Growing)
- **기술스택**: Next.js 15 + TypeScript, MongoDB + Mongoose, Zustand, Tailwind CSS
- **AI 통합**: OpenAI GPT-4.1-nano-2025-04-14 + Google Gemini
- **현재 상태**: MVP 완성, 모든 핵심 기능 구현 완료

## 🎯 주요 기능

### ✅ 완성된 기능들
1. **실시간 AI 분석** - 기록 저장 시 즉시 인사이트 제공
2. **스마트 기록 추천** - 패턴 기반 놓친 기록 감지
3. **이상 패턴 감지** - 14일 패턴 분석으로 조기 발견
4. **월령별 성장 가이드** - 개인 맞춤형 발달 가이드
5. **AI 입력 도우미** - 월령별 권장값 자동 제안
6. **AI 퀘스트 시스템** - 일일 맞춤 활동 추천
7. **AI 코치 채팅** - 24시간 육아 상담

## 📂 페이지별 수정 가이드

### 🏠 **대시보드** (`/dashboard`)
**파일**: `src/app/dashboard/page.tsx`

**수정 가능한 항목들**:
- 오늘의 기록 수 표시
- 건강 알림 위젯 (이상 패턴 감지)
- AI 스마트 추천 위젯
- 오늘의 퀘스트 카드

**연관 API**:
- `/api/logs` (기록 수 조회)
- `/api/health-alerts` (건강 알림)
- `/api/logs/suggestions` (스마트 추천)
- `/api/quests` (퀘스트 조회)

---

### 📝 **성장기록** (`/logs`)
**파일**: `src/app/logs/page.tsx`

**수정 가능한 항목들**:
- 기록 입력 폼 (수면, 식사, 활동, 마일스톤, 건강, 기저귀)
- AI 입력 도우미 (💡 제안 버튼)
- 기록 목록 표시 방식
- 실시간 AI 분석 모달
- 토스트 알림 시스템

**연관 컴포넌트**:
- `src/components/AIAnalysisModal.tsx` (AI 분석 결과 모달)
- `src/components/Toast.tsx` (알림 시스템)

**연관 API**:
- `/api/logs` (기록 CRUD + AI 분석)

---

### 🎯 **퀘스트** (`/quests`)
**파일**: `src/app/quests/page.tsx`

**수정 가능한 항목들**:
- 퀘스트 히스토리 표시
- 퀘스트 상태별 필터링
- 퀘스트 카드 디자인

**연관 API**:
- `/api/quests` (퀘스트 히스토리 조회)
- `/api/quests/[id]` (퀘스트 상태 업데이트)

---

### 📖 **월령별 성장 가이드** (`/growth-guide`)
**파일**: `src/app/growth-guide/page.tsx`

**수정 가능한 항목들**:
- 발달 마일스톤 표시
- 추천 활동 카드
- 영양/수면 가이드 섹션
- 다음 달 미리보기

**연관 API**:
- `/api/growth-guide` (AI 가이드 생성)

---

### 💬 **AI 코치** (`/ai-coach`)
**파일**: `src/app/ai-coach/page.tsx`

**수정 가능한 항목들**:
- 채팅 인터페이스
- 메시지 버블 디자인
- 입력창 및 전송 버튼

**연관 API**:
- `/api/ai/chat` (AI 채팅 응답)

---

### 👶 **아이 프로필** (`/children`)
**파일**: `src/app/children/page.tsx`

**수정 가능한 항목들**:
- 아이 추가/수정 폼
- 프로필 카드 디자인
- 아이 목록 표시

**연관 API**:
- `/api/children` (아이 CRUD)

---

### 📊 **성장 리포트** (`/reports`)
**파일**: `src/app/reports/page.tsx`

**수정 가능한 항목들**:
- 리포트 기간 선택
- 통계 차트
- AI 인사이트 표시

**연관 API**:
- `/api/reports` (리포트 생성)
- `/api/insights` (AI 인사이트)

## 🗄️ MongoDB 컬렉션 매핑

### 👤 **users** 컬렉션
**파일**: `src/models/User.ts`
```javascript
{
  _id: ObjectId,
  name: String,        // 사용자 이름
  email: String,       // 이메일 (로그인 ID)
  password: String,    // 해시된 비밀번호
  createdAt: Date,
  updatedAt: Date
}
```

### 👶 **children** 컬렉션
**파일**: `src/models/Child.ts`
```javascript
{
  _id: ObjectId,
  userId: ObjectId,    // users._id 참조
  name: String,        // 아이 이름
  birthDate: Date,     // 생년월일
  gender: String,      // 성별 ("male" | "female")
  createdAt: Date,
  updatedAt: Date
}
```
**관련 페이지**: `/children`, `/dashboard`

### 📝 **growthlogs** 컬렉션
**파일**: `src/models/GrowthLog.ts`
```javascript
{
  _id: ObjectId,
  childId: ObjectId,   // children._id 참조
  type: String,        // "sleep" | "meal" | "diaper" | "activity" | "milestone" | "health"
  timestamp: Date,     // 기록 시간
  data: Object,        // 타입별 세부 데이터
  notes: String,       // 메모
  media: [String],     // 미디어 파일 URL들
  createdAt: Date,
  updatedAt: Date
}
```
**관련 페이지**: `/logs`, `/dashboard`, `/reports`

**데이터 구조 예시**:
```javascript
// 수면 기록
data: {
  duration: 8.5,           // 수면 시간(시간)
  quality: "good"          // 수면 품질
}

// 식사 기록  
data: {
  mealType: "breast_milk", // 식사 종류
  amount: 120              // 양(ml/g)
}

// 활동 기록
data: {
  activityName: "놀이"     // 활동 내용
}
```

### 🎯 **quests** 컬렉션
**파일**: `src/models/Quest.ts`
```javascript
{
  _id: ObjectId,
  childId: ObjectId,      // children._id 참조
  title: String,          // 퀘스트 제목
  description: String,    // 퀘스트 설명
  category: String,       // "activity" | "milestone" | "health" | "bonding" | "learning"
  estimatedTime: String,  // 예상 소요시간
  tips: [String],         // 팁 목록
  status: String,         // "pending" | "in_progress" | "completed" | "skipped"
  aiProvider: String,     // "openai" | "gemini"
  generatedAt: Date,      // 생성 시간
  completedAt: Date,      // 완료 시간
  parentNotes: String,    // 부모 노트
  createdAt: Date,
  updatedAt: Date
}
```
**관련 페이지**: `/dashboard`, `/quests`

### 🧠 **aiinsights** 컬렉션
**파일**: `src/models/AIInsight.ts`
```javascript
{
  _id: ObjectId,
  childId: ObjectId,     // children._id 참조
  type: String,          // "daily" | "weekly" | "monthly" | "milestone" | "alert"
  category: String,      // "development" | "health" | "behavior" | "nutrition" | "sleep"
  title: String,         // 인사이트 제목
  content: String,       // 인사이트 내용
  recommendations: [String], // 추천사항 목록
  confidence: Number,    // 신뢰도 (0-1)
  dataPoints: [ObjectId], // 참조된 growthlogs._id들
  createdAt: Date,
  updatedAt: Date
}
```
**관련 페이지**: `/reports`, `/dashboard`

## 🔧 AI 서비스 매핑

### 📍 **AI 기능별 함수 위치**
**파일**: `src/lib/ai-service.ts`

| AI 기능 | 함수명 | 사용 페이지 | API 엔드포인트 |
|---------|--------|-------------|----------------|
| 실시간 기록 분석 | `analyzeGrowthLogRealtime()` | `/logs` | `/api/logs` (POST) |
| 스마트 추천 | `generateAIResponse()` | `/dashboard` | `/api/logs/suggestions` |
| 이상 패턴 감지 | `detectAbnormalPatterns()` | `/dashboard` | `/api/health-alerts` |
| 월령별 가이드 | `generateMonthlyGrowthGuide()` | `/growth-guide` | `/api/growth-guide` |
| 입력 도우미 | `getSmartInputSuggestions()` | `/logs` | (프론트엔드 함수) |
| 퀘스트 생성 | `generateAIResponse()` | `/dashboard` | `/api/quests` |
| AI 채팅 | `generateAIResponse()` | `/ai-coach` | `/api/ai/chat` |
| 데이터 분석 | `analyzeChildData()` | `/reports` | `/api/reports`, `/api/insights` |

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env.local)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
GOOGLE_AI_API_KEY=your-gemini-key

# 개발 서버 실행
npm run dev
# 서버: http://localhost:3000 (또는 포트 충돌 시 3002)
```

## 🧪 테스트 계정

- **이메일**: contact@example.com
- **비밀번호**: 1234qwer

## 📱 주요 URL

- **대시보드**: `/dashboard`
- **성장기록**: `/logs`
- **퀘스트**: `/quests` 
- **성장가이드**: `/growth-guide`
- **AI코치**: `/ai-coach`
- **아이프로필**: `/children`
- **성장리포트**: `/reports`

## 🎨 컴포넌트 가이드

### 재사용 가능한 컴포넌트들

| 컴포넌트 | 파일 위치 | 용도 | 사용 예시 |
|----------|-----------|------|-----------|
| `Layout` | `src/components/Layout.tsx` | 전체 레이아웃 + 네비게이션 | 모든 페이지 |
| `ClientOnly` | `src/components/ClientOnly.tsx` | Hydration 오류 방지 | Zustand 사용 부분 |
| `LoadingSpinner` | `src/components/LoadingSpinner.tsx` | 로딩 상태 표시 | AI 처리 중 |
| `Toast` | `src/components/Toast.tsx` | 알림 메시지 | 성공/오류 알림 |
| `AIAnalysisModal` | `src/components/AIAnalysisModal.tsx` | AI 분석 결과 모달 | 기록 저장 후 |

### 훅(Hooks)

| 훅 | 파일 위치 | 용도 |
|----|-----------|------|
| `useToast` | `src/hooks/useToast.ts` | 토스트 알림 관리 |
| `useAuthStore` | `src/store/useAuthStore.ts` | 인증 상태 관리 |

## 🔒 인증 시스템

- **JWT 토큰 기반 인증**
- **미들웨어**: `src/middleware.ts`
- **보호된 경로**: `/api/children`, `/api/logs`, `/api/quests`, `/api/growth-guide`, `/api/health-alerts` 등
- **토큰 검증**: `src/lib/auth-edge.ts` (Edge Runtime 호환)

## 📊 데이터베이스 관계도

```
users (사용자)
  └── children (아이들) [1:N]
      ├── growthlogs (성장기록) [1:N]
      ├── quests (퀘스트) [1:N]
      └── aiinsights (AI인사이트) [1:N]
```

## 🎯 차별화 포인트

1. **실시간 AI 분석**: 기록 → 즉시 분석 → 맞춤 조언
2. **예측적 추천**: 패턴 학습으로 다음 기록 제안
3. **조기 발견**: AI가 이상 패턴 자동 감지
4. **개인 맞춤**: 월령별 개별 아이 맞춤 가이드
5. **스마트 입력**: AI가 권장값 제안으로 입력 부담 감소

## 📋 API 엔드포인트 전체 목록

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인

### 아이 프로필
- `GET /api/children` - 아이 목록 조회
- `POST /api/children` - 아이 추가
- `GET /api/children/[id]` - 특정 아이 정보 조회
- `PUT /api/children/[id]` - 아이 정보 수정
- `DELETE /api/children/[id]` - 아이 삭제

### 성장 기록
- `GET /api/logs` - 성장 기록 조회 (필터링 지원)
- `POST /api/logs` - 성장 기록 추가 + 실시간 AI 분석
- `GET /api/logs/[id]` - 개별 성장 기록 조회
- `PUT /api/logs/[id]` - 개별 성장 기록 수정
- `DELETE /api/logs/[id]` - 개별 성장 기록 삭제
- `GET /api/logs/suggestions` - AI 스마트 추천

### 퀘스트 시스템
- `GET /api/quests` - 퀘스트 조회 (오늘/히스토리)
- `PUT /api/quests/[id]` - 퀘스트 상태 업데이트
- `DELETE /api/quests/[id]` - 퀘스트 삭제

### AI 기능
- `POST /api/ai/chat` - AI 육아 전문가 챗봇 대화
- `GET /api/growth-guide` - 월령별 맞춤 성장 가이드
- `GET /api/health-alerts` - 이상 패턴 감지 및 알림

### 성장 리포트 & 인사이트
- `GET /api/reports` - 성장 리포트 조회 및 AI 분석 (일간/주간/월간)
- `GET /api/insights` - AI 인사이트 조회
- `POST /api/insights` - AI 인사이트 생성

### 기타
- `POST /api/upload` - 이미지/동영상/음성 파일 업로드

---

**개발자**: Claude Code + 사용자  
**완성일**: 2025년 1월  
**버전**: MVP 1.0  
**상태**: 배포 준비 완료 ✅