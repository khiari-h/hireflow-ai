import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/OnboardingPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function OnboardingPage({ decision }) {
  const { candidateId } = useParams();
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    fetchOnboarding();
    // Initial AI Manager greeting
    const greeting = {
      sender: 'ai-manager',
      text: "Welcome! I'm your AI Manager. I'll be guiding you through your first weeks here. Let me show you your personalized onboarding plan. If you have any questions, just ask!",
      timestamp: new Date()
    };
    setMessages([greeting]);
  }, [candidateId]);

  const fetchOnboarding = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/candidates/${candidateId}/onboarding`);
      setOnboarding(response.data.onboarding_plan);
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage = {
      sender: 'user',
      text: userInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // AI Manager response (simulated)
    setTimeout(() => {
      const responses = [
        "That's a great question! I'm here to help you succeed.",
        "Let me add that to your onboarding plan.",
        "I'll make sure to follow up on that for you.",
        "Absolutely, I'll get you connected with the right team.",
        "Don't worry, we'll work through this together."
      ];
      
      const aiResponse = {
        sender: 'ai-manager',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setUserInput('');
  };

  if (loading) {
    return (
      <div className="onboarding-container loading">
        <div className="spinner"></div>
        <p>Preparing your personalized onboarding...</p>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        <h1>Welcome to the Team! 🎉</h1>
        <p>Your personalized onboarding journey starts here</p>
      </div>

      <div className="onboarding-main">
        <div className="onboarding-content">
          <div className="manager-intro">
            <div className="manager-avatar">👨‍💼</div>
            <div className="manager-info">
              <h2>Your AI Manager</h2>
              <p>I'm here to support you every step of the way. Let's go through your onboarding plan together.</p>
            </div>
          </div>

          {onboarding && (
            <>
              <div className="onboarding-schedule">
                <h2>Your Onboarding Schedule</h2>
                
                {onboarding.day_1_3 && (
                  <div className="week-section">
                    <h3 className="week-title">📅 Days 1-3: Getting Started</h3>
                    <div className="tasks-list">
                      {Object.entries(onboarding.day_1_3).map(([day, tasks]) => (
                        <div key={day} className="day-tasks">
                          <h4>{day.charAt(0).toUpperCase() + day.slice(1)}</h4>
                          <ul>
                            {Array.isArray(tasks) ? tasks.map((task, idx) => (
                              <li key={idx}>{task}</li>
                            )) : <li>{tasks}</li>}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {onboarding.week_1 && (
                  <div className="week-section">
                    <h3 className="week-title">⚡ Week 1: First Tasks</h3>
                    <ul className="tasks-list">
                      {Array.isArray(onboarding.week_1) ? 
                        onboarding.week_1.map((task, idx) => (
                          <li key={idx}>{task}</li>
                        ))
                        : <li>{onboarding.week_1}</li>
                      }
                    </ul>
                  </div>
                )}

                {onboarding.week_2_4 && (
                  <div className="week-section">
                    <h3 className="week-title">🚀 Weeks 2-4: Building Momentum</h3>
                    <ul className="tasks-list">
                      {Array.isArray(onboarding.week_2_4) ? 
                        onboarding.week_2_4.map((task, idx) => (
                          <li key={idx}>{task}</li>
                        ))
                        : <li>{onboarding.week_2_4}</li>
                      }
                    </ul>
                  </div>
                )}
              </div>

              {onboarding.mentoring_strategy && (
                <div className="mentoring-section">
                  <h2>Mentoring Strategy</h2>
                  <div className="mentoring-details">
                    {onboarding.mentoring_strategy.focus_areas && (
                      <div>
                        <h4>Focus Areas</h4>
                        <ul>
                          {Array.isArray(onboarding.mentoring_strategy.focus_areas) ?
                            onboarding.mentoring_strategy.focus_areas.map((area, idx) => (
                              <li key={idx}>{area}</li>
                            ))
                            : <li>{onboarding.mentoring_strategy.focus_areas}</li>
                          }
                        </ul>
                      </div>
                    )}
                    {onboarding.mentoring_strategy.check_in_frequency && (
                      <div>
                        <h4>Check-in Frequency</h4>
                        <p>{onboarding.mentoring_strategy.check_in_frequency}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {onboarding.success_criteria && (
                <div className="success-section">
                  <h2>Success Milestones</h2>
                  <ul className="milestones-list">
                    {Array.isArray(onboarding.success_criteria) ?
                      onboarding.success_criteria.map((criterion, idx) => (
                        <li key={idx} className="milestone">
                          <span className="milestone-icon">✓</span>
                          {criterion}
                        </li>
                      ))
                      : <li className="milestone"><span className="milestone-icon">✓</span>{onboarding.success_criteria}</li>
                    }
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className={`chat-panel ${chatOpen ? 'open' : 'closed'}`}>
          <div className="chat-header">
            <h3>💬 AI Manager</h3>
            <button 
              className="chat-toggle"
              onClick={() => setChatOpen(!chatOpen)}
            >
              {chatOpen ? '−' : '+'}
            </button>
          </div>

          {chatOpen && (
            <>
              <div className="messages-container">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.sender}`}>
                    {msg.sender === 'ai-manager' && <span className="avatar">👨‍💼</span>}
                    <div className="message-content">{msg.text}</div>
                  </div>
                ))}
              </div>

              <div className="chat-input-section">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="chat-input"
                />
                <button 
                  onClick={handleSendMessage}
                  className="send-button"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="onboarding-footer">
        <div className="contact-info">
          <h3>Need Help?</h3>
          <p>Your AI Manager is available 24/7. You can also reach our HR team at support@hireflow.ai</p>
        </div>
      </div>
    </div>
  );
}
