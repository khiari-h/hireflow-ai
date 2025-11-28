"""
Database helper functions - Using Raindrop SmartSQL
"""

import os
from datetime import datetime

# In production, this would use Raindrop SmartSQL
# For MVP, we use in-memory storage with optional JSON file persistence

class Database:
    def __init__(self):
        self.candidates = {}
        self.evaluations = {}
        self.decisions = {}
        self.onboarding = {}
    
    def save_candidate(self, candidate: dict):
        """Save candidate record"""
        candidate_id = candidate["id"]
        self.candidates[candidate_id] = candidate
    
    def get_candidate(self, candidate_id: str):
        """Get candidate by ID"""
        return self.candidates.get(candidate_id)
    
    def save_evaluation(self, candidate_id: str, agent_name: str, evaluation: dict):
        """Save agent evaluation"""
        if candidate_id not in self.evaluations:
            self.evaluations[candidate_id] = {}
        
        self.evaluations[candidate_id][agent_name] = evaluation
    
    def get_evaluations(self, candidate_id: str):
        """Get all evaluations for candidate"""
        return self.evaluations.get(candidate_id, {})
    
    def save_decision(self, candidate_id: str, decision: dict):
        """Save final hiring decision"""
        decision["created_at"] = datetime.now().isoformat()
        self.decisions[candidate_id] = decision
    
    def get_decision(self, candidate_id: str):
        """Get hiring decision"""
        return self.decisions.get(candidate_id)
    
    def save_onboarding(self, candidate_id: str, plan: dict):
        """Save onboarding plan"""
        plan["created_at"] = datetime.now().isoformat()
        self.onboarding[candidate_id] = plan
    
    def get_onboarding(self, candidate_id: str):
        """Get onboarding plan"""
        return self.onboarding.get(candidate_id)

# Global database instance
_db = Database()

def init_db():
    """Initialize database"""
    global _db
    if _db is None:
        _db = Database()
    return _db

def save_candidate(candidate: dict):
    """Save candidate"""
    _db.save_candidate(candidate)

def get_candidate(candidate_id: str):
    """Get candidate"""
    return _db.get_candidate(candidate_id)

def save_evaluation(candidate_id: str, agent_name: str, evaluation: dict):
    """Save evaluation"""
    _db.save_evaluation(candidate_id, agent_name, evaluation)

def get_evaluations(candidate_id: str):
    """Get evaluations"""
    return _db.get_evaluations(candidate_id)

def save_decision(candidate_id: str, decision: dict):
    """Save decision"""
    _db.save_decision(candidate_id, decision)

def get_decision(candidate_id: str):
    """Get decision"""
    return _db.get_decision(candidate_id)

def save_onboarding(candidate_id: str, plan: dict):
    """Save onboarding plan"""
    _db.save_onboarding(candidate_id, plan)

def get_onboarding(candidate_id: str):
    """Get onboarding plan"""
    return _db.get_onboarding(candidate_id)


# SQL Schema (for Raindrop SmartSQL implementation)
"""
CREATE TABLE candidates (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cv_text TEXT,
    role_applying VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE agent_evaluations (
    id UUID PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id),
    agent_name VARCHAR(50),
    score FLOAT,
    justification TEXT,
    red_flags JSONB,
    strengths JSONB,
    evaluation_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hiring_decisions (
    id UUID PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id),
    final_decision VARCHAR(50),
    weighted_score FLOAT,
    reasoning TEXT,
    negotiation_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE onboarding_plans (
    id UUID PRIMARY KEY,
    candidate_id UUID REFERENCES candidates(id),
    plan_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_evaluations_candidate ON agent_evaluations(candidate_id);
CREATE INDEX idx_decisions_candidate ON hiring_decisions(candidate_id);
"""
