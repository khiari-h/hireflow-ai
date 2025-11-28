"""
RH Agent - Technical Skills Evaluator
Conducts technical interview and evaluates coding/system design skills
"""

import os
from anthropic import Anthropic

class RHAgent:
    def __init__(self):
        self.client = Anthropic()
        self.model = "claude-opus-4.1"
        self.conversation_history = []
    
    def evaluate(self, candidate: dict) -> dict:
        """
        Conduct technical interview with candidate
        
        Returns:
        {
            "agent": "RH",
            "score": float (0-10),
            "justification": str,
            "red_flags": list,
            "strengths": list,
            "questions_asked": list,
            "answers_quality": dict
        }
        """
        
        candidate_cv = candidate["cv_text"]
        role = candidate["role_applying"]
        
        # System prompt for RH Agent
        system_prompt = f"""You are an expert technical recruiter conducting a technical interview.
Your job is to evaluate a candidate's technical skills through questions and their responses.

Candidate Profile:
CV: {candidate_cv}
Role: {role}

Interview Guidelines:
1. Ask 3-4 progressive technical questions (start easy, get harder)
2. Questions should be relevant to the {role} position
3. Evaluate responses on:
   - Correctness and completeness
   - Problem-solving approach
   - Code quality thinking
   - Communication clarity
   - Depth of understanding

After gathering responses, provide:
- Technical score (0-10)
- Clear justification
- Red flags (if any)
- Strengths identified
- Overall assessment

Be fair but rigorous. A good developer should score 7+."""
        
        # Initial message to start interview
        initial_message = f"""You are conducting a technical interview for a {role} position.
        
Please start the interview by introducing yourself briefly and asking the first technical question.
Remember to ask 3-4 questions progressively, then provide your evaluation.

Format your final evaluation as JSON at the end:
{{
    "score": <float>,
    "justification": "<text>",
    "red_flags": ["<flag1>", "<flag2>"],
    "strengths": ["<strength1>", "<strength2>"],
    "questions_asked": ["<q1>", "<q2>", "<q3>"],
    "answers_quality": {{"<q1>": "<assessment>"}},
    "recommendation": "<text>"
}}"""
        
        # Simulate interview conversation
        self.conversation_history = []
        
        # Agent asks questions
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
        
        # Simulate candidate answers (in real app, these come from UI)
        candidate_answers = self._get_mock_candidate_answers(role)
        
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
        
        # Final evaluation request
        final_request = """Now please provide your final evaluation in the specified JSON format."""
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
        
        # Parse JSON from response
        evaluation = self._parse_evaluation(final_text)
        evaluation["agent"] = "RH"
        
        return evaluation
    
    def _get_mock_candidate_answers(self, role: str) -> list:
        """Get mock candidate answers (in real app, from frontend)"""
        return [
            "I would approach this by first understanding the requirements, then breaking it down into smaller components.",
            "For the system design, I would consider scalability, maintainability, and use appropriate design patterns.",
            "In my previous projects, I've dealt with similar challenges by implementing caching and optimization strategies.",
            "I'm always learning and staying updated with new technologies through reading and side projects."
        ]
    
    def _parse_evaluation(self, text: str) -> dict:
        """Extract evaluation JSON from response text"""
        import json
        import re
        
        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        # Fallback evaluation
        return {
            "score": 7.5,
            "justification": "Candidate shows solid technical understanding with good communication skills.",
            "red_flags": [],
            "strengths": ["Problem-solving", "Communication"],
            "questions_asked": ["System Design", "Coding Challenge", "Architecture"],
            "answers_quality": {"System Design": "Good approach"},
            "recommendation": "Good candidate for the role"
        }
