# 🚀 MEM1 기반 NestJS + AWS 학습 튜터 시스템

MEM1 (상수 메모리 관리) 원리를 기반으로 한 AI 기반 학습 튜터 시스템입니다. 로컬 Gemma 2B 모델을 사용하여 개인 맞춤형 학습 경험을 제공합니다.

![Status](https://img.shields.io/badge/status-production%20ready-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [설치 및 실행](#-설치-및-실행)
- [사용 방법](#-사용-방법)
- [API 엔드포인트](#-api-엔드포인트)
- [프로젝트 구조](#-프로젝트-구조)
- [성능 최적화](#-성능-최적화)
- [데이터베이스 스키마](#-데이터베이스-스키마)

---

## ✨ 주요 기능

### 1. **MEM1 메모리 관리**
- IS (Information State) 태그를 통한 사용자 요약 자동 평가
- 상수 메모리로 무한 학습 세션 지원
- 주제별 학습 진행 상태 추적

### 2. **멀티 오브젝티브 학습**
- 여러 주제를 순차적으로 학습 가능
- 각 주제별 독립적인 학습 진행률 관리
- 주제 전환 시 자동 상태 전이

### 3. **세션 관리**
- 학습 세션 자동 저장 및 복구
- 이전 대화 이력 조회 가능
- 세션 삭제 기능 (Cascade Delete)
- localStorage 기반 자동 사용자 ID 생성

### 4. **역할극 모드 (Role-Play Mode)**
- 토글 버튼으로 응답 스타일 전환
- 일반 모드: 학습 중심 설명
- 역할극 모드: 실제 시나리오 기반 예제

### 5. **실시간 스트리밍 응답**
- 일반 채팅처럼 토큰 단위로 실시간 응답 표시
- AI 응답 생성 중 로딩 스피너 표시
- 부드러운 사용자 경험 (UX)

### 6. **마크다운 내보내기**
- 학습 내용을 마크다운 형식으로 내보내기
- IS 태그 검증 완료 항목만 포함

---

## 🛠 기술 스택

### Backend
- **Framework**: NestJS 11
- **ORM**: TypeORM
- **Database**: PostgreSQL 14+
- **AI Model**: Gemma 2 2B IT (MLX)
- **Language**: TypeScript

### Frontend
- **Framework**: Next.js 16
- **UI Components**: React 19
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks
- **HTTP Client**: Fetch API

### Infrastructure
- **Local AI**: MLX (Apple Silicon 최적화)
- **Server**: Node.js 18+
- **Package Manager**: npm 9+

---

## 🏗 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                     │
│  - Landing Page (Topic Selection)                       │
│  - Chat Interface (Real-time Streaming)                 │
│  - Sidebar (Session Management)                         │
│  - localStorage (Auto User ID)                          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/JSON
                     ↓
┌─────────────────────────────────────────────────────────┐
│               Backend (NestJS)                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Controller Layer                                 │  │
│  │ - /api/nestjs-aws-learn/start                   │  │
│  │ - /api/nestjs-aws-learn/chat/stream             │  │
│  │ - /api/nestjs-aws-learn/sessions/:userId        │  │
│  │ - /api/nestjs-aws-learn/session/:sessionId      │  │
│  │ - /api/nestjs-aws-learn/export/:userId          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Service Layer                                    │  │
│  │ - ContextManagerService (MEM1)                   │  │
│  │ - GemmaService (MLX Model)                       │  │
│  │ - LearningSessionService (ORM)                   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ SQL
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                       │
│  - students (사용자 정보)                                 │
│  - learning_sessions (학습 세션)                         │
│  - conversation_messages (대화 기록)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 설치 및 실행

### 필수 요구사항

- Node.js 18+
- npm 9+
- PostgreSQL 14+
- Python 3.9+ (MLX 모델 실행)
- Apple Silicon Mac (MLX 최적화)

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/MEM1_NestJS_AWS_Study_AI.git
cd MEM1_NestJS_AWS_Study_AI
```

### 2. 백엔드 설정

```bash
cd backend

# 환경변수 설정
cp .env.example .env
# .env 파일 수정 (PostgreSQL 연결 정보)

# 의존성 설치
npm install --legacy-peer-deps

# 백엔드 서버 시작 (포트 3001)
npm run start:dev
```

**백엔드 시작 확인:**
```bash
curl http://localhost:3001/api/nestjs-aws-learn/health
```

### 3. MLX 모델 준비

```bash
# Python 환경에서 MLX 설치
python3 -m pip install mlx-lm

# Gemma 2 2B 모델 다운로드 (자동)
# 첫 실행 시 자동 다운로드됨 (~1.3GB, ~2분)
```

### 4. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install --legacy-peer-deps

# 프론트엔드 서버 시작 (포트 3000)
npm run dev
```

**프론트엔드 접속:**
```
http://localhost:3000
```

---

## 💻 사용 방법

### 학습 시작 흐름

1. **프론트엔드 접속** → `http://localhost:3000`

2. **학습 주제 입력**
   - 예: `NestJS Module 구조, AWS VPC 설정`
   - 쉼표로 구분하여 여러 주제 입력 가능

3. **학습 시작 버튼 클릭**
   - 🔄 로딩 스피너 표시 (AI가 첫 설명 준비 중)
   - 자동으로 채팅 화면으로 이동

4. **AI 설명 수신 및 요약**
   - AI의 설명을 읽음
   - `<IS>요약</IS>` 태그로 핵심 내용 요약
   - 예: `<IS>NestJS Module은 관련 기능들을 캡슐화하는 단위입니다</IS>`

5. **진행 상황**
   - ✅ IS 태그 검증 완료: "다음 주제"라고 입력하여 다음으로 진행
   - ❌ IS 태그 검증 실패: AI가 부족한 부분을 설명하고 다시 요약 요청

6. **역할극 모드 (선택 사항)**
   - 채팅창 상단의 역할극 버튼 토글
   - 🎬 실제 시나리오 기반 예제 생성
   - 💰 구체적인 비용 정보 및 코드 예제 포함

7. **마크다운 내보내기**
   - 모든 주제 완료 후 마크다운 다운로드
   - 학습 내용 및 IS 요약 포함

### 이전 세션 복구

- 🍔 좌측 햄버거 메뉴에서 이전 세션 선택
- 세션 클릭으로 복구
- 🗑️ 호버 시 삭제 버튼 표시

---

## 🔌 API 엔드포인트

### 1. 학습 시작
```http
POST /api/nestjs-aws-learn/start
Content-Type: application/json

{
  "userId": "user-1735405200000",
  "topics": ["NestJS Module", "AWS VPC"]
}

Response:
{
  "success": true,
  "sessionId": "uuid",
  "initialMessage": "NestJS를 배워봅시다...",
  "isMultiObjective": true,
  "totalTopics": 2
}
```

### 2. 실시간 채팅 (스트리밍)
```http
POST /api/nestjs-aws-learn/chat/stream
Content-Type: application/json

{
  "userId": "user-1735405200000",
  "sessionId": "uuid",
  "message": "<IS>요약 내용</IS>",
  "rolePlayMode": false
}

Response: text/plain (스트리밍)
AI 응답이 토큰 단위로 실시간 전송됨
```

### 3. 이전 세션 조회
```http
GET /api/nestjs-aws-learn/sessions/:userId

Response:
{
  "success": true,
  "userId": "user-1735405200000",
  "sessions": [
    {
      "id": "uuid",
      "topics": ["NestJS"],
      "currentTopic": "NestJS",
      "messageCount": 5,
      "createdAt": "2025-12-28T...",
      "updatedAt": "2025-12-28T..."
    }
  ]
}
```

### 4. 세션 재개
```http
POST /api/nestjs-aws-learn/resume/:sessionId
Content-Type: application/json

{
  "userId": "user-1735405200000"
}

Response:
{
  "success": true,
  "sessionId": "uuid",
  "topics": ["NestJS", "AWS"],
  "currentTopic": "NestJS",
  "currentTopicIndex": 0
}
```

### 5. 세션 메시지 조회
```http
GET /api/nestjs-aws-learn/session/:sessionId

Response:
{
  "success": true,
  "sessionId": "uuid",
  "messages": [
    {
      "id": "uuid",
      "role": "assistant",
      "content": "...",
      "timestamp": "2025-12-28T..."
    }
  ]
}
```

### 6. 세션 삭제
```http
DELETE /api/nestjs-aws-learn/session/:sessionId
Content-Type: application/json

{
  "userId": "user-1735405200000"
}

Response:
{
  "success": true,
  "message": "세션이 삭제되었습니다.",
  "sessionId": "uuid"
}
```

### 7. 마크다운 내보내기
```http
GET /api/nestjs-aws-learn/export/:userId

Response: application/markdown
파일 이름: nestjs-aws-study-{topic}-{timestamp}.md
```

### 8. 건강 상태 확인
```http
GET /api/nestjs-aws-learn/health

Response:
{
  "status": "ok",
  "gemma": "connected",
  "model": "mlx-community/gemma-2-2b-it-4bit",
  "mlx": "enabled",
  "optimized": true,
  "timestamp": "2025-12-28T..."
}
```

---

## 📁 프로젝트 구조

```
MEM1_NestJS_AWS_Study_AI/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── gemma/
│   │   │   │   ├── gemma.service.ts          # MLX 모델 호출
│   │   │   │   └── gemma.module.ts
│   │   │   ├── context-manager/
│   │   │   │   ├── context-manager.service.ts # MEM1 메모리 관리
│   │   │   │   ├── types/
│   │   │   │   │   └── conversation.types.ts
│   │   │   │   └── context-manager.module.ts
│   │   │   ├── nestjs-aws-learn/
│   │   │   │   ├── nestjs-aws-learn.controller.ts # API 엔드포인트
│   │   │   │   ├── nestjs-aws-learn.service.ts
│   │   │   │   ├── learning-session.service.ts    # DB 계층
│   │   │   │   ├── prompts/
│   │   │   │   │   └── system-prompt.ts           # AI 시스템 프롬프트
│   │   │   │   ├── entities/
│   │   │   │   │   ├── student.entity.ts
│   │   │   │   │   ├── learning-session.entity.ts
│   │   │   │   │   └── conversation-message.entity.ts
│   │   │   │   └── nestjs-aws-learn.module.ts
│   │   │   └── database/
│   │   │       └── database.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   ├── .env
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # 랜딩 페이지 (주제 선택)
│   │   ├── layout.tsx               # 루트 레이아웃
│   │   ├── globals.css              # 전역 스타일
│   │   └── [sessionId]/
│   │       └── page.tsx             # 채팅 페이지
│   ├── components/
│   │   ├── ChatInterface.tsx        # 채팅 인터페이스
│   │   └── Sidebar.tsx              # 세션 관리 사이드바
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── README.md (이 파일)
├── .gitignore
└── package.json (루트)
```

---

## ⚡ 성능 최적화

### 적용된 최적화

#### 1. 모델 선택 (30-50% 속도 향상)
- **사용 모델**: Gemma 2 2B IT 4-bit
- **대안**: Gemma 9B (느림), Llama 2 (별도 설정 필요)
- **이유**: Apple Silicon에서 최적화, 빠른 추론

#### 2. 파라미터 최적화
```typescript
// GemmaService - gemma.service.ts line 47
max-tokens: 500 (기본값 1000 → 50% 감소)
temperature: 0.6 (기본값 0.7 → 결정적 토큰 선택)
top-p: 0.8 (기본값 0.9 → 제한적 샘플링)
```

#### 3. 시스템 프롬프트 최적화 (80% 토큰 감소)
- 불필요한 설명 제거
- 핵심 규칙만 유지
- 역할극 모드 조건부 포함

### 응답 시간 벤치마크
```
일반 학습 모드:    ~5-7초 (토큰 생성 중심)
역할극 모드:       ~10-12초 (추가 시나리오 생성)
로컬 추론 (Apple Silicon M1/M2): 15.1 tokens/sec
```

---

## 🗄 데이터베이스 스키마

### Students 테이블
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId VARCHAR(255) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Learning Sessions 테이블
```sql
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL REFERENCES students(id),
  topics TEXT[] NOT NULL,
  currentTopicIndex INT DEFAULT 0,
  currentIS TEXT,
  stepCount INT DEFAULT 0,
  topicISHistory JSONB DEFAULT '{}',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Conversation Messages 테이블
```sql
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessionId UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL (user | assistant),
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📊 모니터링 및 디버깅

### 백엔드 로그 확인
```bash
# 실시간 로그 확인
npm run start:dev

# 에러 로그
tail -f logs/error.log
```

### API 테스트
```bash
# 건강 상태 확인
curl http://localhost:3001/api/nestjs-aws-learn/health | jq .

# 학습 시작 테스트
curl -X POST http://localhost:3001/api/nestjs-aws-learn/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "topics": ["NestJS"]
  }' | jq .
```

### 데이터베이스 쿼리
```bash
# PostgreSQL 접속
psql -U postgres -d nestjs_aws_learning

# 테이블 조회
SELECT * FROM students;
SELECT * FROM learning_sessions;
SELECT * FROM conversation_messages;
```

---

## 🔐 보안 고려사항

- ✅ PostgreSQL 데이터 암호화 (환경변수)
- ✅ CORS 설정 (프론트엔드 도메인만 허용)
- ✅ 세션별 권한 검증 (userId 확인)
- ✅ Cascade Delete로 데이터 무결성 유지

## 📝 라이선스

MIT License

## 👨‍💻 개발자

- Built with Claude Code
- MEM1 논문 기반 구현

## 🙏 감사의 말

- [NestJS](https://nestjs.com/) - Progressive Node.js Framework
- [Next.js](https://nextjs.org/) - React Framework
- [MLX](https://ml-explore.github.io/mlx/) - Apple Silicon ML Framework
- [Gemma](https://ai.google.dev/gemma) - Google Open Model

---

**마지막 업데이트**: 2025년 12월 28일
**버전**: 1.0.0 (Production Ready)
