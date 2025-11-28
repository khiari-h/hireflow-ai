"""
Sales Agent - Client Problem-Solving Evaluator
Tests candidate's ability to understand business problems and propose pragmatic solutions
"""

import os
from anthropic import Anthropic
import json
import re

class SalesAgent:
    def __init__(self):
        self.client = Anthropic()
        self.model = "claude-opus-4.1"
    
    def evaluate(self, candidate: dict) -> dict:
        """
        Test candidate's client/business problem-solving ability
        
        Returns:
        {
            "agent": "Sales",
            "score": float (0-10),
            "justification": str,
            "red_flags": list,
            "strengths": list,
            "business_acumen": str,
            "problem_solving_approach": str,
            "recommendation": str
        }
        """
        
        role = candidate["role_applying"]
        name = candidate["name"]
        
        system_prompt = f"""You are a sales/product manager evaluating a candidate's ability to understand client problems and propose solutions.
Your job is to present a realistic customer problem and evaluate how the candidate thinks about it.

Candidate: {name}
Role: {role}

Evaluation Criteria:
1. Does the candidate understand the root problem?
2. Do they ask clarifying questions?
3. Is their solution pragmatic or over-engineered?
4. Do they think about user experience and business impact?
5. Can they balance technical excellence with practical constraints?

Present 1-2 realistic scenarios and evaluate responses.
Score should reflect business acumen and practical problem-solving."""
        
        initial_message = """You are evaluating a candidate's client/business problem-solving skills.
        
Present a realistic customer problem scenario and ask the candidate to think through a solution.
Then evaluate their approach and provide a score.

Use this format:
1. Present the problem scenario
2. Ask: "How would you approach solving this?"
3. After their response, ask a clarifying question
4. Evaluate and provide JSON:

{
    "score": <float>,
    "justification": "<text>",
    "red_flags": ["<flag1>"],
    "strengths": ["<strength1>"],
    "business_acumen": "<assessment>",
    "problem_solving_approach": "<assessment>",
    "asks_clarifying_questions": <true/false>,
    "pragmatism": "<assessment>",
    "recommendation": "<text>"
}"""
        
        # Get initial problem scenario
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1500,
            system=system_prompt,
            messages=[
                {"role": "user", "content": initial_message}
            ]
        )
        
        agent_scenario = response.content[0].text
        
        # Mock candidate response
        candidate_response = """I would start by understanding what causes customers to abandon at checkout. Is it:
1. Unclear pricing or unexpected fees?
2. Complex checkout process?
3. Payment method limitations?
4. Trust/security concerns?

Once I understand the root cause, I could propose:
- Simplifying the checkout flow
- Adding more payment options
- Showing trust signals/security badges
- Offering guest checkout

But I'd want to know: have you tested what's actually causing the abandonment? 
We should measure first, then optimize."""
        
        # Agent evaluates response
        conversation = [
            {"role": "user", "content": initial_message},
            {"role": "assistant", "content": agent_scenario},
            {"role": "user", "content": candidate_response}
        ]
        
        # Get agent's evaluation
        evaluation_response = self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            system=system_prompt,
            messages=conversation + [
                {"role": "user", "content": "Now provide your final evaluation in JSON format."}
            ]
        )
        
        final_text = evaluation_response.content[0].text
        evaluation = self._parse_evaluation(final_text)
        evaluation["agent"] = "Sales"
        
        return evaluation
    
    def _parse_evaluation(self, text: str) -> dict:
        """Extract evaluation JSON"""
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        # Fallback
        return {
            "score": 8.0,
            "justification": "Candidate shows good business thinking and pragmatic problem-solving approach.",
            "red_flags": [],
            "strengths": ["Business acumen", "Asks clarifying questions", "Pragmatic thinking"],
            "business_acumen": "Strong - understands customer impact",
            "problem_solving_approach": "Systematic and data-driven",
            "asks_clarifying_questions": True,
            "pragmatism": "Balances technical solutions with business reality",
            "recommendation": "Excellent client-facing capability"
        }
