# HireFlow AI - Dual-Chat Interview System

## 🎯 What's New

This is the **NEW DUAL-CHAT VERSION** with split-screen interview and real-time agent discussion.

See: `ARCHITECTURE_COMPARISON.txt` (in /outputs) for detailed comparison.

## 🚀 Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env
python app.py
```

### Frontend  
```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000

## 📋 Implementation

See: `DUAL_CHAT_IMPLEMENTATION.txt` (in /outputs) for step-by-step guide.

## 📁 New Files Added

- `backend/agents/conversation_manager.py` - Dual chat stream management
- `backend/agents/dual_chat_controller.py` - Interview flow controller
- `frontend/src/pages/DualChatInterview.jsx` - Split-screen UI
- `frontend/src/styles/DualChatInterview.css` - Interview styling

## ✨ Key Features

✅ Split-screen interview (left = interview, right = agent discussion)
✅ Real-time agent thinking visible  
✅ Dynamic questions based on responses
✅ Natural conversation flow
✅ Anti-fraud detection
✅ Personalized onboarding

Ready to implement? Start with DUAL_CHAT_IMPLEMENTATION.txt! 🚀
