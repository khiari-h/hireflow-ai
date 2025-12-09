import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/DualChatInterview.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DualChatInterview() {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewChat, setInterviewChat] = useState([]);
  const [agentChat, setAgentChat] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fraudScore, setFraudScore] = useState(0);
  const [phase, setPhase] = useState('waiting_response'); // waiting_response, agents_thinking, agents_discussing
  
  const interviewEndRef = useRef(null);
  const agentEndRef = useRef(null);

  useEffect(() => {
    startInterview();
  }, [candidateId]);

  useEffect(() => {
    interviewEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    agentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interviewChat, agentChat]);

  const startInterview = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/candidates/${candidateId}/dual-chat/start`
      );
      
      setInterviewChat(response.data.interview_chat || []);
      setAgentChat(response.data.agent_chat || []);
      setInterviewStarted(true);
    } catch (err) {
      console.error('Start error:', err);
      alert('Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const detectFraud = (text) => {
    let score = 0;
    if (text.length > 500 && text.split('\n').length < 3) score += 20;
    if (text.includes('copy') || text.includes('paste')) score += 15;
    if (text.match(/[A-Z]{5,}/g)) score += 10;
    return Math.max(0, Math.min(100, score));
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setUserInput(text);
    setFraudScore(detectFraud(text));
  };

  const submitResponse = async () => {
    if (!userInput.trim()) return;

    setLoading(true);
    setPhase('agents_thinking');

    try {
      // 1. Add user message to interview chat
      const newInterviewChat = [...interviewChat, {
        speaker: 'candidate',
        text: userInput,
        type: 'answer'
      }];
      setInterviewChat(newInterviewChat);
      
      // 2. Send to backend
      const response = await axios.post(
        `${API_URL}/api/candidates/${candidateId}/dual-chat/respond`,
        { response: userInput }
      );

      // 3. Update chats with agent discussion
      setInterviewChat(response.data.interview_chat);
      setAgentChat(response.data.agent_chat);
      setPhase('waiting_response');
      
      setUserInput('');
      setFraudScore(0);
    } catch (err) {
      console.error('Response error:', err);
      setPhase('waiting_response');
    } finally {
      setLoading(false);
    }
  };

  const continueInterview = async () => {
    setLoading(true);
    setPhase('waiting_response');

    try {
      const response = await axios.post(
        `${API_URL}/api/candidates/${candidateId}/dual-chat/next-topic`
      );

      if (response.data.interview_complete) {
        navigate(`/decision/${candidateId}`);
      } else {
        setInterviewChat(response.data.interview_chat);
        setAgentChat(response.data.agent_chat);
      }
    } catch (err) {
      console.error('Continue error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!interviewStarted) {
    return (
      <div className="dual-chat-container loading">
        <div className="spinner"></div>
        <p>Starting interview...</p>
      </div>
    );
  }

  return (
    <div className="dual-chat-container">
      <div className="dual-chat-header">
        <h1>HireFlow Interview</h1>
        <p>Dual-Chat Evaluation System</p>
      </div>

      <div className="dual-chat-main">
        {/* LEFT SIDE - INTERVIEW CHAT */}
        <div className="chat-panel interview-panel">
          <div className="chat-title">
            <span className="title-text">Interview Chat</span>
            <span className="title-info">You & Agents</span>
          </div>

          <div className="chat-messages">
            {interviewChat.map((msg, idx) => (
              <div key={idx} className={`message message-${msg.speaker} message-${msg.type}`}>
                <div className="message-speaker">
                  {msg.speaker === 'rh' && '👨‍💼'}
                  {msg.speaker === 'manager' && '👤'}
                  {msg.speaker === 'sales' && '📊'}
                  {msg.speaker === 'candidate' && '👤'}
                  <span className="speaker-name">
                    {msg.speaker === 'rh' && 'RH Agent'}
                    {msg.speaker === 'manager' && 'Manager'}
                    {msg.speaker === 'sales' && 'Sales'}
                    {msg.speaker === 'candidate' && 'You'}
                  </span>
                </div>
                <div className="message-content">{msg.text}</div>
              </div>
            ))}
            {phase === 'agents_thinking' && (
              <div className="message message-system">
                <div className="thinking-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <p>Agents are discussing...</p>
              </div>
            )}
            <div ref={interviewEndRef} />
          </div>

          {/* INPUT AREA */}
          {phase === 'waiting_response' && (
            <div className="chat-input-area">
              <textarea
                value={userInput}
                onChange={handleInputChange}
                placeholder="Type your response..."
                rows="3"
                disabled={loading}
                className="chat-input"
              />
              
              {fraudScore > 30 && (
                <div className="fraud-warning">
                  ⚠️ Fraud score: {fraudScore}%
                </div>
              )}

              <div className="input-actions">
                <span className="char-count">{userInput.length}</span>
                <button
                  onClick={submitResponse}
                  disabled={loading || !userInput.trim()}
                  className="submit-btn"
                >
                  {loading ? 'Processing...' : 'Send'}
                </button>
              </div>
            </div>
          )}

          {/* NEXT TOPIC BUTTON */}
          {interviewChat.length > 0 && 
           interviewChat[interviewChat.length - 1].type === 'follow_up_question' &&
           phase === 'waiting_response' && (
            <div className="next-topic-area">
              <button
                onClick={continueInterview}
                disabled={loading}
                className="next-topic-btn"
              >
                Continue to Next Topic
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - AGENT DISCUSSION */}
        <div className="chat-panel agent-panel">
          <div className="chat-title">
            <span className="title-text">Agent Discussion</span>
            <span className="title-info">Internal Thoughts</span>
          </div>

          <div className="chat-messages agent-messages">
            {agentChat.map((msg, idx) => (
              <div key={idx} className={`message message-agent message-from-${msg.speaker}`}>
                <div className="message-speaker">
                  {msg.speaker === 'rh' && '👨‍💼'}
                  {msg.speaker === 'manager' && '👤'}
                  {msg.speaker === 'sales' && '📊'}
                  <span className="speaker-name">
                    {msg.speaker === 'rh' && 'RH'}
                    {msg.speaker === 'manager' && 'Manager'}
                    {msg.speaker === 'sales' && 'Sales'}
                  </span>
                </div>
                <div className="message-content">{msg.text}</div>
              </div>
            ))}
            {phase === 'agents_thinking' && (
              <div className="message message-system">
                <div className="thinking-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={agentEndRef} />
          </div>
        </div>
      </div>

      {/* ANTI-FRAUD BAR */}
      <div className="anti-fraud-bar">
        <span>Anti-Fraud:</span>
        <div className="fraud-bar">
          <div 
            className="fraud-fill" 
            style={{
              width: `${fraudScore}%`,
              backgroundColor: fraudScore > 50 ? '#FF6B6B' : fraudScore > 30 ? '#FFA500' : '#4ECDC4'
            }}
          />
        </div>
        <span>{fraudScore}%</span>
      </div>
    </div>
  );
}
