import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-hero">
        <div className="hero-content">
          <h1>HireFlow AI</h1>
          <p className="tagline">Revolutionary Multi-Agent Hiring Platform</p>
          <p className="description">
            Experience the future of recruitment powered by advanced AI agents
            that evaluate candidates from multiple perspectives simultaneously.
          </p>
          
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🤖</div>
              <h3>Multi-Agent Evaluation</h3>
              <p>3 AI agents assess your skills, culture fit, and client understanding</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">🛡️</div>
              <h3>Anti-Fraud Detection</h3>
              <p>Advanced systems detect suspicious behavior and ensure fair evaluation</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <h3>Real-Time Feedback</h3>
              <p>Live feedback from agents as your interview progresses</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h3>Personalized Onboarding</h3>
              <p>AI mentor guides you through your first days at the company</p>
            </div>
          </div>

          <button 
            className="cta-button"
            onClick={() => navigate('/upload')}
          >
            Start Your Interview
          </button>
        </div>

        <div className="hero-image">
          <div className="agent-visualization">
            <div className="agent rh-agent">
              <span>RH Agent</span>
              <p>Technical</p>
            </div>
            <div className="agent manager-agent">
              <span>Manager Agent</span>
              <p>Culture</p>
            </div>
            <div className="agent sales-agent">
              <span>Sales Agent</span>
              <p>Client</p>
            </div>
          </div>
        </div>
      </div>

      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Upload CV</h3>
            <p>Share your CV and basic information</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Multi-Agent Interview</h3>
            <p>3 AI agents evaluate you in parallel with real-time feedback</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Decision</h3>
            <p>Get your result backed by multiple perspectives</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Onboarding</h3>
            <p>AI mentor welcomes you and guides your journey</p>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <p>Powered by Claude AI × Raindrop × Vultr</p>
      </footer>
    </div>
  );
}
