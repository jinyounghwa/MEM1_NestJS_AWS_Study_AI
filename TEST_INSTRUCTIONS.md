# 🧪 전체 시스템 테스트 가이드

## 📋 준비사항

- PostgreSQL이 실행 중인지 확인: `pg_isready -h localhost`
- 세 개의 터미널 창 준비

---

## 🚀 실행 순서

### 터미널 1: 백엔드 시작

```bash
cd backend
npm run start:dev
```

**예상 출력:**
```
[Nest] 12:34:56 AM - 01/01/2025, 12:34:56 AM   [NestFactory] Starting Nest application...
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🚀 NestJS AWS Learning Tutor System (MEM1 Based)          ║
║                                                              ║
║    ☁️  Backend running on: http://localhost:3001            ║
║    🧠 LLM: Gemma 3 4B IT (MLX)                              ║
║    💾 Memory: MEM1 (Constant Memory Management)              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### 터미널 2: 프론트엔드 시작

```bash
cd frontend
npm run dev
```

**예상 출력:**
```
  ▲ Next.js 16.2.0
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.3s
```

### 터미널 3: 테스트 실행

아래의 테스트 명령어들을 실행하세요.

---

## ✅ 테스트 체크리스트

### 1️⃣ 백엔드 헬스 체크

```bash
curl http://localhost:3001/api/nestjs-aws-learn/health
```

**예상 응답:**
```json
{
  "status": "ok",
  "gemma": "connected",
  "model": "mlx-community/gemma-2-9b-it-4bit",
  "mlx": "enabled",
  "timestamp": "2025-01-01T12:34:56.000Z"
}
```

✅ **성공 조건**: `status: "ok"` 반환

---

### 2️⃣ 새 학습 세션 시작

```bash
curl -X POST http://localhost:3001/api/nestjs-aws-learn/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-student-001", "topics": ["NestJS 기초", "TypeORM 설정"]}'
```

**예상 응답:**
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "\"NestJS 기초 → TypeORM 설정\" 순서로 학습을 시작합니다!",
  "isMultiObjective": true,
  "totalTopics": 2,
  "userId": "test-student-001"
}
```

✅ **성공 조건**: `sessionId` 반환됨

**sessionId를 메모하세요!** (다음 테스트에서 사용)

---

### 3️⃣ 이전 세션 조회

```bash
curl http://localhost:3001/api/nestjs-aws-learn/sessions/test-student-001
```

**예상 응답:**
```json
{
  "success": true,
  "userId": "test-student-001",
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "topics": ["NestJS 기초", "TypeORM 설정"],
      "currentTopic": "NestJS 기초",
      "currentTopicIndex": 0,
      "totalTopics": 2,
      "stepCount": 0,
      "messageCount": 0,
      "createdAt": "2025-01-01T12:34:56.000Z",
      "updatedAt": "2025-01-01T12:34:56.000Z"
    }
  ]
}
```

✅ **성공 조건**: 방금 생성한 세션이 목록에 나타남

---

### 4️⃣ 프론트엔드 UI 테스트

1. **브라우저 열기**: http://localhost:3000

2. **랜딩 페이지 확인**:
   - 제목: "☁️ NestJS + AWS 학습"
   - 입력 필드: "사용자 ID", "학습 주제"
   - 버튼: "🚀 학습 시작"

3. **첫 번째 세션 생성**:
   - 사용자 ID: `test-user-001`
   - 학습 주제: `AWS VPC, Security Group, Subnet`
   - "🚀 학습 시작" 클릭

✅ **성공 조건**:
- 채팅 인터페이스로 이동
- 햅버거 메뉴 (☰) 표시
- AI 초기 메시지 표시

---

### 5️⃣ 채팅 상호작용 테스트

1. **사용자 입력 작성**:
   ```
   <IS>VPC는 AWS에서 논리적으로 격리된 네트워크 환경이다</IS>
   ```

2. **메시지 전송**: Ctrl+Enter 또는 "전송" 버튼

✅ **성공 조건**:
- AI 응답 표시됨
- 팁 메시지: "✅ 훌륭합니다!"
- 진행 상황 표시: "1/3"

---

### 6️⃣ 마크다운 내보내기 테스트

1. **"📥 마크다운 내보내기" 버튼 클릭**

2. **파일 확인**:
   - 다운로드된 파일명: `nestjs-aws-study-*.md`
   - 내용: 학습한 주제와 요약 포함

✅ **성공 조건**: 마크다운 파일 다운로드됨

---

### 7️⃣ 세션 목록 테스트

1. **햅버거 메뉴 (☰) 클릭**

2. **사이드바 확인**:
   - "📚 학습 세션" 헤더
   - "+ 새로운 세션" 버튼
   - 이전 세션 목록:
     - "AWS VPC"
     - "1/3" 진행 상황
     - "1 메시지" 등 메타데이터

✅ **성공 조건**: 생성한 세션이 목록에 표시됨

---

### 8️⃣ 세션 재개 테스트

1. **사이드바에서 이전 세션 선택**

2. **이전 대화 로드됨**:
   - 이전 메시지들 표시
   - 진행 상황 복원됨

✅ **성공 조건**: 이전 대화 내용 복원됨

---

### 9️⃣ 새 세션 생성 테스트

1. **사이드바 "+ 새로운 세션" 클릭**

2. **랜딩 페이지로 돌아감**

3. **새로운 주제로 학습 시작**:
   - 사용자 ID: `test-user-001`
   - 학습 주제: `NestJS Controllers`
   - "🚀 학습 시작" 클릭

✅ **성공 조건**: 새 세션이 생성되고 채팅 시작

---

## 🔄 데이터베이스 확인

터미널 4에서 PostgreSQL 직접 확인:

```bash
# PostgreSQL 접속
psql -U postgres -d nestjs_aws_learn

# 테이블 확인
\dt

# 세션 조회
SELECT id, topics, "currentTopicIndex", "stepCount", "createdAt"
FROM learning_sessions
ORDER BY "createdAt" DESC;

# 메시지 조회
SELECT role, content, timestamp
FROM conversation_messages
LIMIT 10;
```

---

## ⚠️ 문제 해결

### 백엔드가 시작되지 않음
```bash
# 포트 확인
lsof -i :3001

# 프로세스 종료
kill -9 <PID>

# 데이터베이스 재연결
bash setup-db.sh
```

### 프론트엔드 오류
```bash
# 캐시 초기화
rm -rf .next

# 재시작
npm run dev
```

### 데이터베이스 연결 오류
```bash
# PostgreSQL 재시작
brew services restart postgresql

# 데이터베이스 상태 확인
psql -U postgres -l
```

### Gemma 응답 없음
```bash
# MLX 설치 확인
python -c "import mlx_lm; print(mlx_lm.__version__)"

# 모델 다운로드
python -c "from mlx_lm import load; load('mlx-community/gemma-2-9b-it-4bit')"
```

---

## 📊 성공 기준

모든 테스트가 통과하면:

✅ 백엔드 API 정상 작동
✅ 프론트엔드 UI 정상 표시
✅ 세션 생성 및 저장
✅ 대화 메시지 저장
✅ 세션 재개 기능
✅ 마크다운 내보내기
✅ 사이드바 네비게이션

**전체 시스템이 준비된 상태입니다! 🎉**

---

## 📝 다음 단계

- [ ] AI 응답 (Gemma MLX) 통합 테스트
- [ ] 역할극 모드 테스트
- [ ] 복수 주제 학습 플로우 테스트
- [ ] 성능 및 스트레스 테스트
- [ ] 배포 준비
