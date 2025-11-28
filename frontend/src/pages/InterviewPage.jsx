import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/InterviewPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function InterviewPage() {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const [interviewState, setInterviewState] = useState('loading');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(false);
  const [fraudScore, setFraudScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  const questions = [
    {
      id: 1,
      agent: 'RH',
      question: "Tell us about your experience with system design. Describe a complex system you've built.",
      category: 'Technical'
    },
    {
      id: 2,
      agent: 'Manager',
      question: "Describe a time when you had to collaborate with a team member you didn't initially get along with. How did you handle it?",
      category: 'Behavior'
    },
    {
      id: 3,
      agent: 'Sales',
      question: "Imagine a client loses 30% of users at checkout. Walk us through how you'd approach this problem.",
      category: 'Client Understanding'
    },
    {
      id: 4,
      agent: 'RH',
      question: "What's your approach to learning new technologies?",
      category: 'Technical'
    }
  ];

  useEffect(() => {
    startInterview();
  }, [candidateId]);

  const startInterview = async () => {
    try {
      setInterviewState('question');
    } catch (err) {
      console.error('Error starting interview:', err);
    }
  };

  const detectFraud = (text) => {
    let score = 0;

    // Check for suspicious patterns
    if (text.length > 500 && text.split('\n').length < 3) score += 20; // Too long but single block
    if (text.includes('copy') || text.includes('paste')) score += 15;
    if (text.match(/[A-Z]{5,}/g)) score += 10; // Too many caps
    if (text.split(' ').length < 5) score -= 30; // Too short is OK for some

    return Math.max(0, Math.min(100, score));
  };

  const handleAnswerChange = (e) => {
    const text = e.target.value;
    setAnswer(text);
    const fraud = detectFraud(text);
    setFraudScore(fraud);
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      alert('Please provide an answer');
      return;
    }

    setLoading(true);

    if (currentQuestion < questions.length - 1) {
      // Move to next question
      setCurrentQuestion(currentQuestion + 1);
      setAnswer('');
      setFraudScore(0);
      setLoading(false);
    } else {
      // Interview complete, move to decision
      try {
        await startEvaluation();
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
      }
    }
  };

  const startEvaluation = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/candidates/${candidateId}/evaluate`);
      navigate(`/decision/${candidateId}`);
    } catch (err) {
      console.error('Evaluation error:', err);
      setLoading(false);
    }
  };

  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <div className="interview-container">
      <div className="interview-header">
        <div className="progress-section">
          <h2>HireFlow Interview</h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <p className="progress-text">Question {currentQuestion + 1} of {questions.length}</p>
        </div>
      </div>

      <div className="interview-main">
        <div className="interview-content">
          <div className="question-section">
            <div className="agent-badge" style={{
              backgroundColor: question.agent === 'RH' ? '#FF6B6B' : 
                             question.agent === 'Manager' ? '#4ECDC4' : '#45B7D1'
            }}>
              {question.agent} Agent
            </div>
            <h2 className="question">{question.question}</h2>
            <p className="category">Category: {question.category}</p>
          </div>

          <div className="answer-section">
            <textarea
              value={answer}
              onChange={handleAnswerChange}
              placeholder="Type your answer here..."
              rows="8"
              className="answer-input"
            />

            {fraudScore > 30 && (
              <div className="fraud-warning">
                <span className="warning-icon">⚠️</span>
                <p>Suspicious pattern detected: {fraudScore}% fraud score</p>
              </div>
            )}

            <div className="char-count">
              Characters: {answer.length}
            </div>
          </div>

          <button
            onClick={handleSubmitAnswer}
            disabled={loading || !answer.trim()}
            className="submit-answer-button"
          >
            {currentQuestion === questions.length - 1 ? 'Complete Interview' : 'Next Question'}
          </button>
        </div>

        <div className="agents-panel">
          <h3>Live Agent Feedback</h3>
          
          <div className="agent-card rh">
            <div className="agent-name">RH Agent</div>
            <div className="agent-status">🔴 Evaluating Technical Skills</div>
            <div className="agent-feedback">
              <p>Analyzing your technical depth and problem-solving approach...</p>
            </div>
            <div className="agent-score">Score: Pending</div>
          </div>

          <div className="agent-card manager">
            <div className="agent-name">Manager Agent</div>
            <div className="agent-status">🟡 Assessing Culture Fit</div>
            <div className="agent-feedback">
              <p>Evaluating your communication and team collaboration skills...</p>
            </div>
            <div className="agent-score">Score: Pending</div>
          </div>

          <div className="agent-card sales">
            <div className="agent-name">Sales Agent</div>
            <div className="agent-status">🟠 Testing Client Understanding</div>
            <div className="agent-feedback">
              <p>Assessing your business acumen and pragmatic thinking...</p>
            </div>
            <div className="agent-score">Score: Pending</div>
          </div>
        </div>
      </div>

      <div className="anti-fraud-bar">
        <div className="fraud-meter">
          <span>Anti-Fraud:</span>
          <div className="meter-bar">
            <div 
              className="meter-fill" 
              style={{
                width: `${fraudScore}%`,
                backgroundColor: fraudScore > 50 ? '#FF6B6B' : fraudScore > 30 ? '#FFA500' : '#4ECDC4'
              }}
            ></div>
          </div>
          <span>{fraudScore}%</span>
        </div>
      </div>
    </div>
  );
}
