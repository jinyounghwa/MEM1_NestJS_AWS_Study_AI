# 🚀 NestJS AWS Learning Tutor - Quick Start Guide

## 📋 Prerequisites

- **Node.js**: v18+ (Verified: v25.2.1)
- **npm**: v10+ (Verified: v11.6.2)
- **PostgreSQL**: v12+ (Verified: v15)
- **Python**: v3.10+ (for MLX/Ollama)
- **MLX Framework**: For running Gemma 3 4B locally

### System Requirements

- **RAM**: At least 16GB (8GB minimum, 16GB+ recommended for smooth Gemma inference)
- **Storage**: 10GB+ for model downloads
- **GPU**: Apple Silicon Mac (M1/M2/M3+) or use CPU (slower)

---

## 🔧 Environment Setup

### 1. PostgreSQL Database Setup

Ensure PostgreSQL is running on your system:

```bash
# macOS (if installed via Homebrew)
brew services start postgresql

# Verify PostgreSQL is running
psql --version
```

Create the database:

```bash
cd backend
bash setup-db.sh
```

The script will:
- Check PostgreSQL connectivity
- Create the `nestjs_aws_learn` database
- Set up TypeORM for automatic table creation

### 2. Environment Variables

The `.env` file is already configured with defaults:

```bash
# backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_aws_learn
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

Modify if needed for your setup.

---

## 🎯 Running the System

### Terminal 1: Backend Server

```bash
cd backend
npm install --legacy-peer-deps
npm run start:dev
```

Expected output:
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

### Terminal 2: Frontend Application

```bash
cd frontend
npm install
npm run dev
```

Expected output:
```
  ▲ Next.js 16.2.0
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.3s
```

### Terminal 3: Gemma MLX Server (optional, but needed for AI features)

If you want to use the Gemma model:

```bash
# Install MLX (if not already installed)
pip install mlx

# The GemmaService in backend will call it automatically
# When you send a chat message, it will invoke mlx_lm.generate
```

---

## 🧪 Testing the System

### 1. Check Backend Health

```bash
curl http://localhost:3001/api/nestjs-aws-learn/health
```

Expected response:
```json
{
  "status": "ok",
  "gemma": "connected",
  "model": "mlx-community/gemma-2-9b-it-4bit",
  "mlx": "enabled",
  "timestamp": "2025-01-01T12:34:56.000Z"
}
```

### 2. Start Learning Session

```bash
curl -X POST http://localhost:3001/api/nestjs-aws-learn/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "student-001", "topics": ["NestJS Module Structure", "AWS VPC Basics"]}'
```

### 3. Open Frontend

Navigate to: **http://localhost:3000**

1. Enter User ID: `student-001`
2. Enter Topics: `NestJS Module Structure, AWS VPC Basics`
3. Click **🚀 학습 시작** (Start Learning)
4. Follow the AI tutor's instructions
5. Respond with `<IS>your summary</IS>` tags
6. Download your learning notes as markdown

---

## 📚 System Architecture

### Backend (NestJS)

```
backend/
├── src/
│   ├── database/          # TypeORM entities & config
│   ├── modules/
│   │   ├── context-manager/   # Session state management
│   │   ├── gemma/             # MLX LLM integration
│   │   └── nestjs-aws-learn/  # API endpoints & controller
│   └── app.module.ts
├── package.json
├── .env                   # Database credentials
└── setup-db.sh           # Database initialization
```

### Frontend (Next.js)

```
frontend/
├── app/
│   ├── page.tsx              # Landing page
│   └── layout.tsx
├── components/
│   └── ChatInterface.tsx      # Chat UI & state management
└── package.json
```

### Database (PostgreSQL)

```
Tables:
- students               # User profiles
- learning_sessions     # Learning session state
- conversation_messages # Chat history
```

---

## 🎓 Learning Features

### MEM1 Memory Management

- **IS (Information State)**: You must summarize using `<IS>...</IS>` tags
- **Constant Memory**: Previous context is discarded, only IS + current message kept
- **Multi-Objective**: Learn multiple topics in sequence

### Role-Play Mode

When you ask "How is this used in real-world?", the AI:
1. Creates a startup scenario
2. Introduces realistic characters (CTO, Developer, Investor)
3. Shows actual cost comparisons
4. Demonstrates code examples

### Auto-Export

Export your learning journey as markdown with all notes and summaries.

---

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/nestjs-aws-learn/start` | Initialize learning session |
| `POST` | `/api/nestjs-aws-learn/chat` | Send message & get AI response |
| `GET` | `/api/nestjs-aws-learn/health` | Check backend status |
| `GET` | `/api/nestjs-aws-learn/export/:userId` | Download markdown notes |

---

## 🚨 Troubleshooting

### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432 -U postgres

# If not running (macOS):
brew services start postgresql

# Reset password if forgotten
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

### Backend won't start

1. Check Node.js version: `node --version` (need v18+)
2. Clear node_modules: `rm -rf node_modules && npm install --legacy-peer-deps`
3. Rebuild: `npm run build`

### Frontend won't connect to backend

- Ensure backend is running on port 3001
- Check CORS settings in `backend/src/main.ts`
- Browser console (F12) should show API calls

### Gemma/MLX not responding

1. Check if MLX is installed: `python -c "import mlx_lm; print(mlx_lm.__version__)"`
2. Download model: `python -c "from mlx_lm import load; load('mlx-community/gemma-2-9b-it-4bit')"`
3. Check health endpoint: `curl http://localhost:3001/api/nestjs-aws-learn/health`

---

## 📖 Development Commands

### Backend

```bash
npm run start:dev      # Hot reload development
npm run build          # Compile TypeScript
npm run lint           # ESLint check
npm run format         # Prettier formatting
```

### Frontend

```bash
npm run dev           # Development with hot reload
npm run build         # Production build
npm run start         # Start production server
```

---

## 🎉 Next Steps

1. **Customize Topics**: Edit the learning paths in `backend/src/modules/nestjs-aws-learn/prompts/system-prompt.ts`
2. **Add Database Features**: Implement services for persistent learning records
3. **Deploy to AWS**: Set up CloudFormation or Terraform for infrastructure

---

## 📝 Notes

- All conversation data is stored locally in PostgreSQL
- Markdown exports can be shared or published
- The system works completely offline (once Gemma is downloaded)
- Cost: $0 (using local models instead of API calls)

---

**Happy Learning! 🚀☁️**
