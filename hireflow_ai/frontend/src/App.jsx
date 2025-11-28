import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Pages
import UploadPage from './pages/UploadPage';
import InterviewPage from './pages/InterviewPage';
import DecisionPage from './pages/DecisionPage';
import OnboardingPage from './pages/OnboardingPage';
import LandingPage from './pages/LandingPage';

function App() {
  const [candidateId, setCandidateId] = useState(null);
  const [candidateData, setCandidateData] = useState(null);
  const [decision, setDecision] = useState(null);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/upload" 
            element={
              <UploadPage 
                onSuccess={(id, data) => {
                  setCandidateId(id);
                  setCandidateData(data);
                }} 
              />
            } 
          />
          <Route 
            path="/interview/:candidateId" 
            element={<InterviewPage candidateId={candidateId} />} 
          />
          <Route 
            path="/decision/:candidateId" 
            element={<DecisionPage candidateId={candidateId} onDecision={setDecision} />} 
          />
          <Route 
            path="/onboarding/:candidateId" 
            element={<OnboardingPage candidateId={candidateId} decision={decision} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
