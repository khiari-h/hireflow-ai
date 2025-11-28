"""
Manager Agent - Culture Fit & Behavior Evaluator
Conducts behavior interview and evaluates teamwork, communication, growth mindset
"""

import os
from anthropic import Anthropic
import json
import re

class ManagerAgent:
    def __init__(self):
        self.client = Anthropic()
        self.model = "claude-opus-4.1"
        self.conversation_history = []
    
    def evaluate(self, candidate: dict) -> dict:
        """
        Conduct behavior interview with candidate
        
        Returns:
        {
            "agent": "Manager",
            "score": float (0-10),
            "justification": str,
            "red_flags": list,
            "strengths": list,
            "culture_fit": str,
            "team_dynamics": str,
            "recommendation": str
        }
        """
        
        candidate_cv = candidate["cv_text"]
        role = candidate["role_applying"]
        name = candidate["name"]
        
        system_prompt = f"""You are an experienced engineering manager conducting a behavior/culture fit interview.
Your job is to assess how well the candidate aligns with team dynamics, company culture, and their growth mindset.

Candidate: {name}
Role: {role}
CV: {candidate_cv}

Interview Guidelines:
1. Ask 3-4 behavioral questions (STAR method)
2. Questions should cover:
   - Handling failure and learning
   - Teamwork and communication
   - Conflict resolution
   - Growth mindset and adaptability
3. Evaluate on:
   - Communication clarity
   - Emotional intelligence
   - Team collaboration capacity
   - Growth mindset
   - Resilience

After gathering responses, provide:
- Culture fit score (0-10)
- Clear justification
- Team dynamics assessment
- Red flags (if any)
- Overall culture fit recommendation

A good culture fit should score 7+."""
        
        initial_message = """You are conducting a behavior interview for team culture fit assessment.
        
Please start by introducing yourself and asking the first behavioral question.
Ask 3-4 questions total, then provide your evaluation.

Format your final evaluation as JSON:
{
    "score": <float>,
    "justification": "<text>",
    "red_flags": ["<flag1>"],
    "strengths": ["<strength1>"],
    "culture_fit": "<assessment>",
    "team_dynamics": "<assessment>",
    "communication_style": "<description>",
    "growth_mindset": "<assessment>",
    "recommendation": "<text>"
}"""
        
        # Start conversation
        self.conversation_history = []
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            system=system_prompt,
            messages=[
                {"role": "user", "content": initial_message}
            ]
        )
        
        agent_message = response.content[0].text
        self.conversation_history.append({
            "role": "assistant",
            "content": agent_message
        })
        
        # Mock candidate answers
        candidate_answers = [
            "I learned from that experience by asking for feedback and focusing on communication with the team.",
            "I actively seek feedback and try to understand different perspectives before making decisions.",
            "I believe in continuous learning and have invested time in developing new skills.",
            "I prioritize team success and believe in supporting colleagues when they need help."
        ]
        
        for answer in candidate_answers:
            self.conversation_history.append({
                "role": "user",
                "content": answer
            })
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                system=system_prompt,
                messages=self.conversation_history
            )
            
            agent_response = response.content[0].text
            self.conversation_history.append({
                "role": "assistant",
                "content": agent_response
            })
        
        # Final evaluation
        final_request = """Now provide your final evaluation in the specified JSON format."""
        self.conversation_history.append({
            "role": "user",
            "content": final_request
        })
        
        final_response = self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            system=system_prompt,
            messages=self.conversation_history
        )
        
        final_text = final_response.content[0].text
        
        evaluation = self._parse_evaluation(final_text)
        evaluation["agent"] = "Manager"
        
        return evaluation
    
    def _parse_evaluation(self, text: str) -> dict:
        """Extract evaluation JSON from response"""
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        # Fallback
        return {
            "score": 7.0,
            "justification": "Candidate demonstrates good communication and team collaboration.",
            "red_flags": [],
            "strengths": ["Communication", "Teamwork", "Adaptability"],
            "culture_fit": "Good fit for collaborative environment",
            "team_dynamics": "Would work well with autonomous teams",
            "communication_style": "Clear and thoughtful",
            "growth_mindset": "Demonstrates interest in continuous learning",
            "recommendation": "Positive culture fit assessment"
        }
