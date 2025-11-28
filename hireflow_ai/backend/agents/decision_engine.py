"""
Decision Engine - Synthesizes agent evaluations and performs mini-negotiation if needed
"""

from anthropic import Anthropic
import json
import re

class DecisionEngine:
    def __init__(self):
        self.client = Anthropic()
        self.model = "claude-opus-4.1"
    
    def mini_negotiate(self, rh_eval: dict, manager_eval: dict, sales_eval: dict) -> dict:
        """
        If agents disagree (score gap > 1.5), conduct 1 round of negotiation
        
        Returns negotiation summary
        """
        
        rh_score = rh_eval.get("score", 0)
        manager_score = manager_eval.get("score", 0)
        sales_score = sales_eval.get("score", 0)
        
        score_gap = max(
            abs(rh_score - manager_score),
            abs(manager_score - sales_score),
            abs(rh_score - sales_score)
        )
        
        if score_gap <= 1.5:
            return None  # No negotiation needed
        
        # Setup negotiation prompt
        system_prompt = """You are facilitating a discussion between three evaluators who disagree slightly.
Your job is to help them understand each other's perspectives in ONE round of discussion.

Three evaluators:
1. RH (Technical Skills): Focuses on technical capability
2. Manager (Culture Fit): Focuses on team dynamics and growth
3. Sales (Client Understanding): Focuses on business acumen

The goal is NOT to reach consensus, but to understand the gaps and provide insight."""
        
        negotiation_prompt = f"""RH Evaluation (Score: {rh_score}):
{json.dumps(rh_eval, indent=2)}

Manager Evaluation (Score: {manager_score}):
{json.dumps(manager_eval, indent=2)}

Sales Evaluation (Score: {sales_score}):
{json.dumps(sales_eval, indent=2)}

There's a score gap of {score_gap:.1f} points. 

Please facilitate ONE round of discussion:
1. RH: Why do you rate this candidate higher/lower than Manager and Sales?
2. Manager: What's your perspective?
3. Sales: What do you think?

Then provide a brief summary of the key disagreement points and insights.

Format as JSON:
{{
    "rh_perspective": "<response>",
    "manager_perspective": "<response>",
    "sales_perspective": "<response>",
    "key_disagreements": ["<disagreement1>"],
    "insights": "<brief analysis>",
    "score_explanation": "<why the gap exists>"
}}"""
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1500,
            system=system_prompt,
            messages=[
                {"role": "user", "content": negotiation_prompt}
            ]
        )
        
        text = response.content[0].text
        negotiation = self._parse_json(text)
        
        return negotiation
    
    def make_decision(self, rh_eval: dict, manager_eval: dict, sales_eval: dict, 
                     negotiation: dict = None) -> dict:
        """
        Make final hiring decision based on all evaluations
        
        Weights:
        - Technical: 40%
        - Culture: 30%
        - Client Understanding: 30%
        """
        
        system_prompt = """You are the final decision maker in a hiring process.
You have received evaluations from three different perspectives.
Your job is to synthesize them and make a clear HIRE / PASS / MAYBE decision.

Decision Rules:
- HIRE: Weighted score >= 7.5 AND no critical red flags
- PASS: Weighted score < 6.0 OR multiple critical red flags
- MAYBE: Weighted score 6.0-7.5, warrants second interview"""
        
        decision_prompt = f"""
Technical Evaluation (Weight: 40%):
Score: {rh_eval.get('score', 0)}/10
Red Flags: {rh_eval.get('red_flags', [])}
Strengths: {rh_eval.get('strengths', [])}

Culture Fit Evaluation (Weight: 30%):
Score: {manager_eval.get('score', 0)}/10
Red Flags: {manager_eval.get('red_flags', [])}
Strengths: {manager_eval.get('strengths', [])}

Client Understanding Evaluation (Weight: 30%):
Score: {sales_eval.get('score', 0)}/10
Red Flags: {sales_eval.get('red_flags', [])}
Strengths: {sales_eval.get('strengths', [])}

Negotiation Notes: {json.dumps(negotiation) if negotiation else "None"}

Based on this information, make a final hiring decision.

Respond with JSON:
{{
    "final_decision": "HIRE|PASS|MAYBE",
    "weighted_score": <float>,
    "calculation": "<explain weights>",
    "reasoning": "<clear reasoning>",
    "critical_factors": ["<factor1>", "<factor2>"],
    "red_flags_summary": ["<flag>"],
    "next_steps": "<what to do next>",
    "confidence": "<high|medium|low>"
}}"""
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            system=system_prompt,
            messages=[
                {"role": "user", "content": decision_prompt}
            ]
        )
        
        text = response.content[0].text
        decision = self._parse_json(text)
        
        # Ensure required fields
        if "final_decision" not in decision:
            decision["final_decision"] = "MAYBE"
        if "weighted_score" not in decision:
            scores = [
                rh_eval.get("score", 0) * 0.4,
                manager_eval.get("score", 0) * 0.3,
                sales_eval.get("score", 0) * 0.3
            ]
            decision["weighted_score"] = sum(scores)
        
        return decision
    
    def _parse_json(self, text: str) -> dict:
        """Extract JSON from response text"""
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        return {}
