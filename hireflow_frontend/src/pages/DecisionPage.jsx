import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/DecisionPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DecisionPage({ onDecision }) {
  const navigate = useNavigate();
  const { candidateId } = useParams();
  const [decision, setDecision] = useState(null);
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDecision();
  }, [candidateId]);

  const fetchDecision = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/candidates/${candidateId}/decision`);
      const { decision: decisionData, evaluations: evals } = response.data;
      
      setDecision(decisionData);
      setEvaluations(evals || {});
      onDecision?.(decisionData);

      // Auto-navigate to onboarding if hired after 5 seconds
      if (decisionData?.final_decision === 'HIRE') {
        setTimeout(() => {
          navigate(`/onboarding/${candidateId}`);
        }, 5000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch decision');
      console.error('Decision error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="decision-container loading">
        <div className="spinner"></div>
        <p>Synthesizing agent evaluations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="decision-container error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  const finalDecision = decision?.final_decision || 'PENDING';
  const weightedScore = decision?.weighted_score || 0;

  const getDecisionColor = (decision) => {
    if (decision === 'HIRE') return '#4ECDC4';
    if (decision === 'PASS') return '#FF6B6B';
    return '#FFA500';
  };

  const getDecisionMessage = (decision) => {
    if (decision === 'HIRE') return '🎉 Congratulations! You\'re hired!';
    if (decision === 'PASS') return 'Thank you for your interest';
    return 'We\'d like to learn more about you';
  };

  return (
    <div className="decision-container">
      <div className="decision-card">
        <div className="decision-header" style={{ 
          backgroundColor: getDecisionColor(finalDecision) 
        }}>
          <h1 style={{ color: '#fff' }}>
            {getDecisionMessage(finalDecision)}
          </h1>
          <div className="decision-badge">
            {finalDecision === 'HIRE' && '✅ HIRED'}
            {finalDecision === 'PASS' && '❌ NOT SELECTED'}
            {finalDecision === 'MAYBE' && '⏳ PENDING REVIEW'}
          </div>
        </div>

        <div className="decision-content">
          <div className="score-section">
            <h2>Overall Score</h2>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-value">{weightedScore.toFixed(1)}</span>
                <span className="score-max">/10</span>
              </div>
              <div className="score-details">
                <p>Weighted evaluation across all dimensions</p>
                <div className="score-breakdown">
                  {evaluations?.rh && (
                    <div className="score-item">
                      <span>Technical</span>
                      <strong>{evaluations.rh.score || 'N/A'}/10</strong>
                    </div>
                  )}
                  {evaluations?.manager && (
                    <div className="score-item">
                      <span>Culture Fit</span>
                      <strong>{evaluations.manager.score || 'N/A'}/10</strong>
                    </div>
                  )}
                  {evaluations?.sales && (
                    <div className="score-item">
                      <span>Client Understanding</span>
                      <strong>{evaluations.sales.score || 'N/A'}/10</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="reasoning-section">
            <h2>Decision Reasoning</h2>
            <p className="reasoning-text">
              {decision?.reasoning || 'Evaluating multiple perspectives from our AI agents...'}
            </p>
          </div>

          {decision?.critical_factors && decision.critical_factors.length > 0 && (
            <div className="factors-section">
              <h3>Key Factors</h3>
              <ul className="factors-list">
                {decision.critical_factors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {decision?.red_flags_summary && decision.red_flags_summary.length > 0 && (
            <div className="red-flags-section">
              <h3>⚠️ Areas for Development</h3>
              <ul className="red-flags-list">
                {decision.red_flags_summary.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="agent-evaluations">
            <h2>Individual Agent Evaluations</h2>
            
            {evaluations?.rh && (
              <div className="agent-eval rh">
                <h3>RH Agent - Technical Evaluation</h3>
                <p className="score">Score: {evaluations.rh.score}/10</p>
                <p className="justification">{evaluations.rh.justification}</p>
                {evaluations.rh.strengths && (
                  <div>
                    <strong>Strengths:</strong> {evaluations.rh.strengths.join(', ')}
                  </div>
                )}
              </div>
            )}

            {evaluations?.manager && (
              <div className="agent-eval manager">
                <h3>Manager Agent - Culture Fit Evaluation</h3>
                <p className="score">Score: {evaluations.manager.score}/10</p>
                <p className="justification">{evaluations.manager.justification}</p>
                {evaluations.manager.strengths && (
                  <div>
                    <strong>Strengths:</strong> {evaluations.manager.strengths.join(', ')}
                  </div>
                )}
              </div>
            )}

            {evaluations?.sales && (
              <div className="agent-eval sales">
                <h3>Sales Agent - Client Understanding Evaluation</h3>
                <p className="score">Score: {evaluations.sales.score}/10</p>
                <p className="justification">{evaluations.sales.justification}</p>
                {evaluations.sales.strengths && (
                  <div>
                    <strong>Strengths:</strong> {evaluations.sales.strengths.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {finalDecision === 'HIRE' && (
            <div className="next-steps">
              <h2>Next Steps</h2>
              <p>Your AI Manager will connect with you shortly to begin your personalized onboarding.</p>
              <p>Redirecting you in a few seconds...</p>
            </div>
          )}

          {finalDecision !== 'HIRE' && (
            <div className="contact-section">
              <p>If you have questions about your evaluation, please contact our HR team.</p>
              <a href="/" className="back-button">Return Home</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
