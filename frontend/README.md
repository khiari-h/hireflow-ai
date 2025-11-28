# HireFlow AI - React Frontend

Production-ready React frontend for the multi-agent hiring platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup

```bash
# Navigate to frontend directory
cd hireflow_ai/frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and set VITE_API_URL if needed (default: http://localhost:5000)

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 📦 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx      # Home page
│   │   ├── UploadPage.jsx       # CV upload
│   │   ├── InterviewPage.jsx    # Interview with live feedback
│   │   ├── DecisionPage.jsx     # Hiring decision
│   │   └── OnboardingPage.jsx   # Onboarding with AI manager
│   ├── styles/
│   │   ├── App.css
│   │   ├── LandingPage.css
│   │   ├── UploadPage.css
│   │   ├── InterviewPage.css
│   │   ├── DecisionPage.css
│   │   └── OnboardingPage.css
│   ├── App.jsx                  # Main app component with routing
│   └── main.jsx                 # Entry point
├── index.html                   # HTML template
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
└── .env.example                # Environment variables
```

## 🎯 Features Implemented

### 1. Landing Page
- Hero section with features overview
- Call-to-action button
- How it works explanation
- Footer

### 2. Upload Page
- Candidate information form
- CV file upload
- Form validation
- Anti-fraud disclaimer

### 3. Interview Page
- Live question progression
- Real-time agent feedback panel
- Anti-fraud detection with visual meter
- Progress tracker
- Answer submission flow

### 4. Decision Page
- Final hiring decision display
- Score breakdown
- Individual agent evaluations
- Key factors and red flags
- Reasoning explanation

### 5. Onboarding Page
- AI Manager greeting
- Personalized onboarding schedule
- Day-by-day tasks
- Week-by-week progression
- Mentoring strategy
- Success milestones
- Chat with AI Manager

## 🔧 Building for Production

```bash
# Build optimized version
npm run build

# Preview production build
npm run preview
```

Output will be in the `dist/` directory.

## 📡 API Integration

Frontend connects to backend API at `http://localhost:5000` (configurable via `.env`).

### Key Endpoints Used:
- `POST /api/candidates/upload` - Upload candidate CV
- `POST /api/candidates/<id>/evaluate` - Start evaluation
- `GET /api/candidates/<id>/decision` - Get hiring decision
- `GET /api/candidates/<id>/onboarding` - Get onboarding plan

## 🎨 Customization

All colors and styles can be modified in:
- `/src/styles/App.css` - Global variables (colors, shadows, etc.)
- Individual page CSS files for component-specific styling

### Color Palette
```css
--primary: #4ECDC4 (Teal)
--secondary: #45B7D1 (Blue)
--accent: #FF6B6B (Red)
--warning: #FFA500 (Orange)
--dark: #2C3E50 (Dark gray)
--light: #ECF0F1 (Light gray)
```

## 📱 Responsive Design

- Desktop optimized (1200px+)
- Tablet friendly (768px - 1024px)
- Mobile responsive (< 768px)

## 🚀 Deployment

### To Netlify

```bash
# Build
npm run build

# Deploy with Netlify CLI
netlify deploy --prod --dir=dist
```

Or connect GitHub repo to Netlify for automatic deployments.

### Environment Variables for Production

Create `.env` with:
```
VITE_API_URL=https://your-backend-domain.com
```

## 🛠️ Development Tips

1. **Hot Reload**: Changes save automatically during `npm run dev`
2. **Console Logs**: Check browser console for API errors
3. **Network Tab**: Monitor API calls in browser DevTools
4. **React DevTools**: Install React DevTools browser extension

## 📝 Notes

- All page routes are configured in `App.jsx`
- API calls use axios (see imports in page components)
- WebSocket support included but not yet fully implemented
- Anti-fraud detection is client-side only (basic implementation)

## 🔗 Related Documentation

- Backend: `/hireflow_ai/backend/README.md`
- Full Project: `/hireflow_ai/README.md`
- Architecture: `/PROJECT_SUMMARY.md`

---

**Ready to customize and deploy!** 🚀
