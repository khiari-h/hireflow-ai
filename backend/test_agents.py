#!/usr/bin/env python3
"""
HireFlow AI - Agent Testing Script
Tests all agents with a sample candidate
"""

import os
import sys
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from agents.rh_agent import RHAgent
from agents.manager_agent import ManagerAgent
from agents.sales_agent import SalesAgent
from agents.decision_engine import DecisionEngine
from agents.onboarding_agent import OnboardingAgent

def print_section(title):
    """Print a formatted section title"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_agents():
    """Test all agents with sample candidate"""
    
    # Sample candidate
    candidate = {
        "id": "test-001",
        "name": "Alice Software Engineer",
        "email": "alice@example.com",
        "cv_text": """
        Senior Backend Engineer with 7 years experience
        - 5 years with Python/Django
        - 2 years with system design and architecture
        - Experience with microservices, databases, APIs
        - Led team of 3 engineers
        - Strong problem-solving and communication skills
        - Continuous learner, enjoys mentoring
        """,
        "role_applying": "Senior Backend Engineer"
    }
    
    print_section("HireFlow AI - Agent Testing")
    print(f"Candidate: {candidate['name']}")
    print(f"Role: {candidate['role_applying']}\n")
    
    # Test RH Agent
    print_section("1. RH Agent (Technical Interviewer)")
    print("Running technical interview evaluation...")
    rh = RHAgent()
    rh_eval = rh.evaluate(candidate)
    print(f"✓ Technical Score: {rh_eval.get('score', 'N/A')}/10")
    print(f"✓ Strengths: {rh_eval.get('strengths', [])}")
    print(f"✓ Red Flags: {rh_eval.get('red_flags', [])}")
    print(f"✓ Justification: {rh_eval.get('justification', 'N/A')[:100]}...")
    
    # Test Manager Agent
    print_section("2. Manager Agent (Culture & Behavior)")
    print("Running behavior interview evaluation...")
    manager = ManagerAgent()
    manager_eval = manager.evaluate(candidate)
    print(f"✓ Culture Fit Score: {manager_eval.get('score', 'N/A')}/10")
    print(f"✓ Strengths: {manager_eval.get('strengths', [])}")
    print(f"✓ Red Flags: {manager_eval.get('red_flags', [])}")
    print(f"✓ Culture Fit: {manager_eval.get('culture_fit', 'N/A')}")
    
    # Test Sales Agent
    print_section("3. Sales Agent (Client Understanding)")
    print("Running client problem-solving evaluation...")
    sales = SalesAgent()
    sales_eval = sales.evaluate(candidate)
    print(f"✓ Client Understanding Score: {sales_eval.get('score', 'N/A')}/10")
    print(f"✓ Strengths: {sales_eval.get('strengths', [])}")
    print(f"✓ Red Flags: {sales_eval.get('red_flags', [])}")
    print(f"✓ Business Acumen: {sales_eval.get('business_acumen', 'N/A')}")
    
    # Check for negotiation
    print_section("4. Decision Engine - Checking for Conflicts")
    rh_score = rh_eval.get('score', 0)
    manager_score = manager_eval.get('score', 0)
    sales_score = sales_eval.get('score', 0)
    
    score_gap = max(
        abs(rh_score - manager_score),
        abs(manager_score - sales_score),
        abs(rh_score - sales_score)
    )
    
    print(f"RH Score: {rh_score}/10")
    print(f"Manager Score: {manager_score}/10")
    print(f"Sales Score: {sales_score}/10")
    print(f"Score Gap: {score_gap:.1f}")
    
    negotiation = None
    if score_gap > 1.5:
        print(f"\n⚠️  Score gap > 1.5, triggering mini-negotiation...")
        decision_engine = DecisionEngine()
        negotiation = decision_engine.mini_negotiate(rh_eval, manager_eval, sales_eval)
        if negotiation:
            print("✓ Negotiation completed")
            print(f"  Key disagreement: {negotiation.get('key_disagreements', ['N/A'])[0]}")
    else:
        print(f"✓ Agents agree (gap: {score_gap:.1f}), no negotiation needed")
    
    # Make final decision
    print_section("5. Final Hiring Decision")
    decision_engine = DecisionEngine()
    decision = decision_engine.make_decision(rh_eval, manager_eval, sales_eval, negotiation)
    
    print(f"✓ Decision: {decision.get('final_decision', 'N/A')}")
    print(f"✓ Weighted Score: {decision.get('weighted_score', 'N/A'):.1f}/10")
    print(f"✓ Confidence: {decision.get('confidence', 'N/A')}")
    print(f"✓ Reasoning: {decision.get('reasoning', 'N/A')[:100]}...")
    
    # If hired, generate onboarding plan
    if decision.get('final_decision') == 'HIRE':
        print_section("6. Onboarding Plan (AI Consultant Dev)")
        print("Creating personalized onboarding plan...")
        
        consultant = OnboardingAgent()
        onboarding = consultant.create_onboarding_plan(
            candidate,
            {"rh": rh_eval, "manager": manager_eval, "sales": sales_eval}
        )
        
        print(f"✓ Onboarding Created for: {onboarding.get('candidate_name', 'N/A')}")
        if 'day_1_3' in onboarding:
            print(f"✓ Day 1-3 Plan: {len(onboarding.get('day_1_3', {}))} days")
        if 'week_1' in onboarding:
            print(f"✓ Week 1 Tasks: {len(onboarding.get('week_1', []))} tasks")
        if 'success_criteria' in onboarding:
            print(f"✓ Success Criteria: {len(onboarding.get('success_criteria', []))} criteria")
    
    # Summary
    print_section("✅ Test Complete!")
    print("All agents executed successfully!")
    print("\nSummary:")
    print(f"  - RH Score: {rh_score}/10")
    print(f"  - Manager Score: {manager_score}/10")
    print(f"  - Sales Score: {sales_score}/10")
    print(f"  - Weighted Score: {decision.get('weighted_score', 'N/A')}")
    print(f"  - Final Decision: {decision.get('final_decision', 'N/A')}")
    print(f"  - Mini-Negotiation: {'Yes' if negotiation else 'No'}")
    print("\n✨ Ready to build the frontend and deploy!")

if __name__ == "__main__":
    try:
        test_agents()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
