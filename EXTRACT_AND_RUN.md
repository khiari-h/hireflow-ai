# HireFlow AI - Extraction & Setup Guide

## 📦 Fichiers téléchargés

Tu as reçu:
- `hireflow_ai_complete.zip` (pour Windows/Mac)
- `hireflow_ai_complete.tar.gz` (pour Linux)

## 🚀 Extraction Rapide

### Windows/Mac
```
1. Double-click sur hireflow_ai_complete.zip
2. Extract All → hireflow_ai/
```

### Linux
```bash
tar -xzf hireflow_ai_complete.tar.gz
```

## 📂 Structure après extraction

```
hireflow_ai/
├── backend/
│   ├── app.py
│   ├── agents/
│   ├── database.py
│   ├── test_agents.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── README.md
```

## 🏃 Lancer le projet (2 terminaux)

### Terminal 1: Backend

```bash
cd hireflow_ai/backend

# Setup Python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run backend
python app.py
```

**Backend sera sur:** http://localhost:5000

### Terminal 2: Frontend

```bash
cd hireflow_ai/frontend

# Install dependencies
npm install

# Setup environment (optional)
cp .env.example .env

# Run frontend
npm run dev
```

**Frontend sera sur:** http://localhost:3000

## ✅ Tester le workflow

1. Ouvre http://localhost:3000 dans ton navigateur
2. Click "Start Your Interview"
3. Upload un CV (ou copie/colle du texte)
4. Réponds aux 4 questions
5. Vois la décision et onboarding

## 🔧 Configuration

### Backend (.env)
```
ANTHROPIC_API_KEY=your_key_here
PORT=5000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## 📱 Build pour Production

### Backend (Raindrop)
```bash
cd hireflow_ai/backend
# Push sur Raindrop avec leurs instructions
```

### Frontend (Netlify)
```bash
cd hireflow_ai/frontend

# Build
npm run build

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 🎯 Fichiers Importants

**Backend:**
- `app.py` - Main Flask app
- `agents/` - 5 AI agents
- `test_agents.py` - Test script

**Frontend:**
- `src/pages/` - 5 React pages
- `src/styles/` - CSS styling
- `package.json` - Dependencies

## 🚨 Troubleshooting

### Backend won't start
```
Error: ModuleNotFoundError
→ Make sure venv is activated
→ Run: pip install -r requirements.txt
```

### Frontend won't start
```
Error: command not found: npm
→ Install Node.js from nodejs.org
→ Restart terminal after install
```

### API calls failing
```
Error: Connection refused
→ Make sure backend is running on :5000
→ Check VITE_API_URL in frontend .env
```

## 📝 Next Steps

1. ✅ Extract files
2. ✅ Start backend
3. ✅ Start frontend
4. ✅ Test workflow
5. Deploy to Raindrop + Netlify
6. Create demo video
7. Submit to DevPost

## 🔗 Documentation

See included README files:
- `/hireflow_ai/backend/README.md`
- `/hireflow_ai/frontend/README.md`

---

**Everything is ready to go!** 🚀
