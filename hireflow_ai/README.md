# HireFlow AI - Multi-Agent Hiring + Onboarding System

A revolutionary AI-powered hiring platform that uses multiple intelligent agents to evaluate candidates and create personalized onboarding plans.

## 🎯 Overview

HireFlow AI demonstrates a complete virtual organization that:
1. **Recruits** developers through multi-agent evaluation (RH, Manager, Sales agents)
2. **Negotiates** between agents when perspectives differ
3. **Onboards** successfully hired candidates with personalized AI mentoring

### Key Features

✅ **Multi-Agent Architecture** - 5 specialized AI agents working together
✅ **Intelligent Negotiation** - Agents resolve disagreements through dialogue
✅ **End-to-End Workflow** - From hiring decision to first-day onboarding
✅ **Real-Time Dashboard** - Live evaluation progress and decision rendering
✅ **Personalized Plans** - Onboarding tailored to candidate strengths/weaknesses

---

## 🏗️ Architecture

### Agents

1. **AI RH Agent** - Technical Skills Evaluator
   - Conducts technical interviews
   - Evaluates coding, system design, architecture knowledge
   - Produces technical score (0-10)

2. **AI Manager Agent** - Culture & Behavior Evaluator
   - Assesses team fit and communication
   - Evaluates growth mindset and resilience
   - Produces culture fit score

3. **AI Sales Agent** - Client Problem-Solving Evaluator
   - Tests business/client understanding
   - Evaluates pragmatic problem-solving
   - Produces client understanding score

4. **Decision Engine** - Synthesis & Mini-Negotiation
   - Aggregates scores from all agents
   - Triggers mini-negotiation if scores differ > 1.5 points
   - Makes final HIRE / PASS / MAYBE decision

5. **AI Consultant Dev** - Onboarding Agent
   - Creates personalized onboarding plan
   - Suggests mentoring strategy
   - Identifies skill development needs

### Technology Stack

**Backend**
- Python with Flask
- Claude API for all LLM calls
- Raindrop Platform (SmartSQL, SmartInference, SmartMemory)
- Vultr Cloud Services

**Frontend**
- React
- Real-time WebSocket updates
- Live dashboard for evaluation tracking

**Database**
- PostgreSQL (via Raindrop SmartSQL)
- In-memory storage for MVP

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+ (for frontend)
- Claude API Key
- Git

### Backend Setup

```bash
# Clone repository
git clone <repo_url>
cd hireflow_ai/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# Run server
python app.py
```

Server will start on `http://localhost:5000`

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will start on `http://localhost:3000`

---

## 📊 API Endpoints

### Candidate Management

**POST** `/api/candidates/upload`
- Upload candidate CV and info
- Returns: `candidate_id`

**POST** `/api/candidates/<id>/evaluate`
- Start multi-agent evaluation
- Returns: evaluations, negotiation results, final decision

**GET** `/api/candidates/<id>/status`
- Get current evaluation progress
- Returns: status, agents_done, current_step

**GET** `/api/candidates/<id>/decision`
- Get final hiring decision
- Returns: decision, scores, onboarding plan (if hired)

### Onboarding

**GET** `/api/candidates/<id>/onboarding`
- Get personalized onboarding plan
- Returns: day-by-day plan, milestones, success criteria

---

## 🎬 Usage Example

```bash
# 1. Upload candidate
curl -X POST http://localhost:5000/api/candidates/upload \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Developer",
    "email": "john@example.com",
    "cv_text": "...",
    "role_applying": "Senior Backend Engineer"
  }'

# Returns: {"candidate_id": "abc-123"}

# 2. Start evaluation
curl -X POST http://localhost:5000/api/candidates/abc-123/evaluate

# Returns: evaluations from all agents + decision

# 3. Get onboarding plan (if hired)
curl http://localhost:5000/api/candidates/abc-123/onboarding
```

---

## 🔄 Agent Communication Flow

```
Upload Candidate
    ↓
Run 3 Agents in Parallel
├─ AI RH (Technical)
├─ AI Manager (Culture)
└─ AI Sales (Client)
    ↓
Aggregate Scores
    ↓
Score Gap > 1.5? 
├─ YES → Mini-Negotiation (1 round)
└─ NO → Skip to Decision
    ↓
Decision Engine Makes Final Call
    ↓
HIRE? → AI Consultant Dev creates Onboarding Plan
PASS? → End process
MAYBE? → Flag for second review
```

---

## 🧪 Testing

### Manual Testing

1. **Upload a test candidate**
   ```bash
   curl -X POST http://localhost:5000/api/candidates/upload \
     -H "Content-Type: application/json" \
     -d @test_candidate.json
   ```

2. **Start evaluation**
   ```bash
   curl -X POST http://localhost:5000/api/candidates/<ID>/evaluate
   ```

3. **Check decision**
   ```bash
   curl http://localhost:5000/api/candidates/<ID>/decision
   ```

### Agent Testing

Each agent can be tested independently:

```python
from agents.rh_agent import RHAgent
from agents.manager_agent import ManagerAgent
from agents.sales_agent import SalesAgent

rh = RHAgent()
rh_eval = rh.evaluate(candidate)
print(rh_eval)
```

---

## 📈 Expected Evaluation Format

Each agent returns:

```json
{
  "agent": "RH|Manager|Sales",
  "score": 8.5,
  "justification": "Strong technical background with good communication",
  "red_flags": ["May take time to ramp up on unfamiliar tech"],
  "strengths": ["System design", "Code clarity"],
  "recommendation": "Good fit for senior role"
}
```

Decision Engine returns:

```json
{
  "final_decision": "HIRE",
  "weighted_score": 7.8,
  "reasoning": "Technical skills and client understanding compensate for culture fit gap",
  "critical_factors": ["Strong backend experience", "Good communication"],
  "next_steps": "Extend offer, prepare onboarding",
  "confidence": "high"
}
```

---

## 🌐 Deployment

### Deploy to Raindrop Platform

1. **Connect Raindrop Account**
   ```bash
   raindrop login
   raindrop init
   ```

2. **Configure SmartSQL**
   - Create database instance
   - Run migrations
   - Update `DATABASE_URL` in `.env`

3. **Deploy Backend**
   ```bash
   raindrop deploy
   ```

### Deploy Frontend to Netlify

```bash
cd frontend
npm run build
netlify deploy --prod --dir=build
```

---

## 🔧 Configuration

### Adjust Agent Weights

Edit `decision_engine.py`:

```python
# Weights for final scoring (must sum to 100%)
WEIGHTS = {
    "technical": 0.40,      # RH score weight
    "culture": 0.30,        # Manager score weight
    "client_understanding": 0.30  # Sales score weight
}
```

### Adjust Mini-Negotiation Trigger

Edit `app.py`:

```python
# Trigger negotiation if score gap > X points
NEGOTIATION_THRESHOLD = 1.5
```

### Adjust Decision Thresholds

Edit `decision_engine.py`:

```python
HIRE_THRESHOLD = 7.5          # Score >= this = HIRE
PASS_THRESHOLD = 6.0          # Score < this = PASS
# In between = MAYBE
```

---

## 🐛 Troubleshooting

### Agent Timeouts
- Increase Claude API timeout in `app.py`
- Reduce interview complexity if needed

### JSON Parsing Errors
- Check Claude response format
- Fallback values are provided in `_parse_json()` methods

### Database Connection Issues
- Verify `DATABASE_URL` in `.env`
- Check Raindrop credentials
- Test connection manually

---

## 📚 Documentation

- **Architecture**: See `/docs/ARCHITECTURE.md`
- **Agent Specifications**: See `/docs/AGENTS.md`
- **API Reference**: See `/docs/API.md`
- **Deployment Guide**: See `/docs/DEPLOYMENT.md`

---

## 🎯 Hackathon Goals

✅ Demonstrate multi-agent orchestration
✅ Show agent communication/negotiation
✅ Deploy on Raindrop + Vultr
✅ Real-time evaluation dashboard
✅ End-to-end hiring + onboarding workflow

---

## 📝 License

MIT

---

## 🤝 Contributing

Feel free to submit issues and improvement suggestions!

---

## 👥 Team

Built by [Your Team Name] for LiquidMetal AI Championship 2025

**Deadline**: 7 December 2025
**Prize Pool**: $36.5K+ in prizes

---

## 🚀 Next Steps

1. [ ] Setup backend + test agents locally
2. [ ] Build React frontend dashboard
3. [ ] Integrate WebSocket for live updates
4. [ ] Deploy to Raindrop + Vultr
5. [ ] Create demo video (3 min max)
6. [ ] Submit to DevPost

Good luck! 🚀
