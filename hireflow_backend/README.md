# HireFlow AI - Raindrop Backend

Multi-agent hiring platform backend built for LiquidMetal AI's Raindrop platform.

## 🏗️ Architecture

```
RAINDROP BACKEND (This project)
├─ Express.js API
├─ SmartSQL Database (Raindrop)
├─ SmartMemory (Raindrop)
├─ Vultr Valkey (Redis) Cache
└─ Gemini AI Agents (Google)

FRONTEND (Separate: React/Vite)
└─ Connects via REST API
```

## 🚀 Tech Stack

- **Backend Framework:** Node.js + Express
- **Database:** SmartSQL (Raindrop) / SQLite (local dev)
- **Memory:** SmartMemory (Raindrop)
- **Cache:** Vultr Valkey (Redis)
- **AI:** Google Gemini API (free tier)
- **Deployment:** Raindrop Platform

## 📋 Prerequisites

- Node.js 16+ with npm
- Google Gemini API key (free from https://aistudio.google.com/app/apikey)
- Raindrop account (for deployment)
- Vultr account (for Redis/Valkey - optional for local dev)

## 🔧 Installation

### 1. Clone/Download Backend
```bash
cd hireflow_raindrop_backend
npm install
```

### 2. Setup Environment Variables

Copy `.env` file and add your API keys:

```bash
# CRITICAL: Add your Gemini API key
GEMINI_API_KEY=your_key_here

# Optional: Add Vultr Redis URL
REDIS_URL=redis://localhost:6379

# Server config
PORT=3000
NODE_ENV=development
```

**Get Gemini API Key:**
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy and paste in `.env`

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Backend
```bash
npm start
# or for development with auto-reload
npm run dev
```

Server starts at: `http://localhost:3000`

## 📚 API Endpoints

### Health Check
```bash
GET /health
```

### Upload Candidate
```bash
POST /api/candidates/upload
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "cv_text": "...",
  "role_applying": "Senior Backend Developer"
}

Response: { "candidate_id": "uuid", ... }
```

### Start Evaluation
```bash
POST /api/candidates/:candidateId/evaluate

Response: {
  "evaluations": {
    "hr": { "score": 8, "recommendation": "STRONG_YES", ... },
    "manager": { "score": 7, "recommendation": "YES", ... },
    "sales": { "score": 8, "recommendation": "STRONG_YES", ... }
  }
}
```

### Make Decision
```bash
POST /api/candidates/:candidateId/decide

Response: {
  "decision": {
    "final_decision": "HIRE",
    "confidence_score": 0.87,
    "reasoning": "..."
  }
}
```

### Get Status
```bash
GET /api/candidates/:candidateId/status

Response: {
  "status": "completed",
  "evaluations_count": 3,
  "has_decision": true
}
```

### Get Full Result
```bash
GET /api/candidates/:candidateId/result

Response: {
  "candidate": { ... },
  "session": { ... }
}
```

## 🤖 AI Agents

### 1. HR Agent
- Evaluates cultural fit and soft skills
- Assesses team compatibility
- Rates career stability

### 2. Manager Agent
- Evaluates technical capabilities
- Assesses problem-solving ability
- Rates relevant experience

### 3. Sales Agent
- Evaluates business impact potential
- Assesses deal-making ability
- Rates value generation capability

All agents use Google Gemini API and provide scores (1-10) + recommendations (STRONG_YES/YES/MAYBE/NO).

## 💾 Database Schema

### Candidates Table
```sql
CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cv_text TEXT NOT NULL,
  role_applying TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Evaluations Table
```sql
CREATE TABLE evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  score REAL,
  recommendation TEXT,
  analysis TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
)
```

### Decisions Table
```sql
CREATE TABLE decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id TEXT NOT NULL,
  final_decision TEXT NOT NULL,
  reasoning TEXT,
  confidence_score REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
)
```

## 🚢 Deployment to Raindrop

### Step 1: Install Raindrop CLI
```bash
npm install -g @liquidmetal-ai/raindrop
```

### Step 2: Authenticate
```bash
raindrop auth login
```

### Step 3: Configure MCP
```bash
raindrop mcp install-gemini
```

### Step 4: Deploy
In Gemini CLI:
```
/new-raindrop-app

Name: HireFlow AI Backend
Description: Multi-agent hiring platform
Main file: server.js
```

Raindrop will:
- ✅ Create SmartSQL database automatically
- ✅ Set up SmartMemory automatically  
- ✅ Deploy to Raindrop servers
- ✅ Provide database credentials

### Step 5: Integrate Vultr
1. Create Vultr managed Valkey instance
2. Add REDIS_URL to environment
3. Raindrop will inject credentials

## 📊 Metrics & Monitoring

### Response Times
- `/upload`: ~100ms
- `/evaluate`: ~5-10s (3 agents in parallel via Gemini)
- `/decide`: ~2-3s
- Cache hits: ~10ms

### Typical Flow
1. Upload CV: 100ms
2. Run evaluation: 8-12s (Gemini API time)
3. Make decision: 3-5s
4. **Total:** ~12-17 seconds

## 🔐 Security

- CORS configured for frontend only
- No sensitive data in logs
- API keys in environment variables
- Database queries parameterized (SQL injection safe)

## ❌ Troubleshooting

### "GEMINI_API_KEY not set"
- Solution: Add `GEMINI_API_KEY=your_key` to `.env`

### "Redis not available"
- OK: Backend falls back to in-memory cache
- Optional: Configure `REDIS_URL` for production

### "Database connection failed"
- Local: Uses SQLite automatically
- Raindrop: SmartSQL credentials provided by platform

### Slow evaluations
- Expected: Gemini API calls take 5-10s per agent
- Normal: 3 agents = 15-30s total (parallelized)

## 📝 Development Notes

### Adding New Agents
1. Create new agent class in `agents.js`
2. Define agent prompt (template)
3. Add to `evaluateCandidate()` function
4. Update database schema if needed

### Adding New Database Tables
1. Add table creation in `database.js`
2. Add corresponding query function
3. Update server.js routes to use new table

### Testing Locally
```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Test upload
curl -X POST http://localhost:3000/api/candidates/upload \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "cv_text": "...",
    "role_applying": "Engineer"
  }'

# Get candidate_id, then test evaluate
curl -X POST http://localhost:3000/api/candidates/{id}/evaluate
```

## 📞 Support

- Raindrop Docs: https://docs.liquidmetal.ai
- Gemini API: https://aistudio.google.com
- Vultr Docs: https://vultr.com/docs
- Hackathon Support: https://discord.gg/liquidmetal

## 📄 License

MIT License - See LICENSE file

## 🎯 Next Steps

1. ✅ Backend ready for Raindrop deployment
2. ⏳ Connect frontend (React/Vite)
3. ⏳ Deploy on Raindrop platform
4. ⏳ Integrate Vultr Valkey cache
5. ⏳ Submit to LiquidMetal AI Championship

---

Built with ❤️ for LiquidMetal AI Championship 2025
