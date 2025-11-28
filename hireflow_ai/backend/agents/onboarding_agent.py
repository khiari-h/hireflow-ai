"""
Onboarding Agent - AI Consultant Developer
Creates personalized onboarding plans and mentoring strategies for new hires
"""

from anthropic import Anthropic
import json
import re

class OnboardingAgent:
    def __init__(self):
        self.client = Anthropic()
        self.model = "claude-opus-4.1"
    
    def create_onboarding_plan(self, candidate: dict, evaluations: dict) -> dict:
        """
        Create personalized onboarding plan based on candidate profile and evaluation results
        
        Returns:
        {
            "onboarding_plan": {
                "day_1_3": [...],
                "week_1": [...],
                "week_2_4": [...]
            },
            "mentoring_strategy": {...},
            "skill_development": {...},
            "milestones": [...],
            "success_criteria": [...]
        }
        """
        
        candidate_name = candidate.get("name", "New Developer")
        role = candidate.get("role_applying", "Developer")
        cv = candidate.get("cv_text", "")
        
        # Get evaluation scores to personalize approach
        rh_eval = evaluations.get("rh", {})
        manager_eval = evaluations.get("manager", {})
        sales_eval = evaluations.get("sales", {})
        
        rh_score = rh_eval.get("score", 7)
        manager_red_flags = manager_eval.get("red_flags", [])
        sales_strengths = sales_eval.get("strengths", [])
        
        system_prompt = f"""You are an expert onboarding manager designing a personalized onboarding plan.
You're mentoring {candidate_name} who was hired for a {role} position.

Context:
- Technical Skills Score: {rh_score}/10
- Red Flags to Address: {manager_red_flags}
- Strengths to Leverage: {sales_strengths}
- Background: {cv[:200]}...

Your job is to create a tailored onboarding plan that:
1. Addresses any weaknesses identified
2. Leverages existing strengths
3. Builds team integration
4. Ensures rapid productivity
5. Includes mentoring and support

The plan should be practical, achievable, and focused on success."""
        
        onboarding_prompt = """Create a detailed, personalized onboarding plan for the new hire.

Include:
1. Days 1-3: Setup, team intro, environment setup
2. Week 1: First tasks, pair programming
3. Week 2-4: Progressive skill building
4. Mentoring strategy: How to address weaknesses
5. Success metrics: How to measure success
6. Support structure: Who mentors, when check-ins happen

Format as JSON:
{
    "candidate_name": "<name>",
    "day_1_3": {
        "monday": ["<task1>", "<task2>"],
        "tuesday": ["<task>"],
        "wednesday": ["<task>"]
    },
    "week_1": ["<task1>", "<task2>"],
    "week_2_4": ["<task1>", "<task2>"],
    "mentoring_strategy": {
        "focus_areas": ["<area1>"],
        "mentoring_pairs": "<who will mentor>",
        "check_in_frequency": "<frequency>",
        "support_resources": ["<resource1>"]
    },
    "skill_development": {
        "strengths_to_leverage": ["<strength1>"],
        "areas_to_improve": ["<area1>"],
        "learning_path": ["<step1>"]
    },
    "milestones": {
        "end_of_week_1": "<milestone>",
        "end_of_week_2": "<milestone>",
        "end_of_month": "<milestone>"
    },
    "success_criteria": ["<criterion1>"],
    "emergency_contacts": "<who to reach out to>",
    "expectations": "<clear expectations>"
}"""
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            system=system_prompt,
            messages=[
                {"role": "user", "content": onboarding_prompt}
            ]
        )
        
        text = response.content[0].text
        plan = self._parse_json(text)
        
        # Ensure required structure
        if not plan or not plan.get("day_1_3"):
            plan = self._get_default_plan(candidate_name, role)
        
        return plan
    
    def _parse_json(self, text: str) -> dict:
        """Extract JSON from response"""
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        return {}
    
    def _get_default_plan(self, name: str, role: str) -> dict:
        """Fallback default onboarding plan"""
        return {
            "candidate_name": name,
            "day_1_3": {
                "monday": [
                    "Welcome & office setup",
                    "Meet team members",
                    "Company overview"
                ],
                "tuesday": [
                    "Dev environment setup",
                    "Codebase introduction",
                    "Project structure walkthrough"
                ],
                "wednesday": [
                    "Architecture overview",
                    "Development workflow tutorial",
                    "First simple task assignment"
                ]
            },
            "week_1": [
                "Complete dev environment setup",
                "First code review",
                "Attend team standup",
                "Meet with direct manager",
                "Review coding standards"
            ],
            "week_2_4": [
                "Pair programming sessions (3-4 per week)",
                "Pick up first features/tasks",
                "Code reviews on submissions",
                "Documentation reading",
                "Team project participation"
            ],
            "mentoring_strategy": {
                "focus_areas": ["Team integration", "Codebase mastery", "Company culture"],
                "mentoring_pairs": "Senior dev + manager",
                "check_in_frequency": "Daily (first week), then 3x/week",
                "support_resources": ["Onboarding docs", "Code examples", "Team wiki"]
            },
            "skill_development": {
                "strengths_to_leverage": ["Problem-solving", "Learning ability"],
                "areas_to_improve": ["Codebase familiarity", "Team processes"],
                "learning_path": ["Setup", "Read code", "Small fixes", "Feature work"]
            },
            "milestones": {
                "end_of_week_1": "Dev environment working, first code committed",
                "end_of_week_2": "First code review completed, attended meetings",
                "end_of_month": "Contributing to features, team integration"
            },
            "success_criteria": [
                "Dev environment fully functional",
                "First code merged by end of week 1",
                "Positive team feedback",
                "Productive contributor by week 4"
            ],
            "emergency_contacts": "Manager & Team Lead",
            "expectations": "Focus on learning and team integration. You don't need to be fully productive immediately."
        }
