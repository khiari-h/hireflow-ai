"""
HireFlow AI - Interview Controller
Manages the dual-chat interview flow:
- Left chat: Real interview with candidate
- Right chat: Agents discussing in real-time
"""

import os
from anthropic import Anthropic
from typing import Dict, List
from agents.rh_agent import RHAgent
from agents.manager_agent import ManagerAgent
from agents.sales_agent import SalesAgent

client = Anthropic()

class DualChatInterviewController:
    """
    Controls interview with split-screen dual chat:
    - LEFT: Interview conversation (candidate + agents)
    - RIGHT: Agent internal discussion (agents thinking out loud)
    """
    
    def __init__(self, candidate_id: str, candidate_info: Dict):
        self.candidate_id = candidate_id
        self.candidate_info = candidate_info
        
        self.rh_agent = RHAgent()
        self.manager_agent = ManagerAgent()
        self.sales_agent = SalesAgent()
        
        # Chat history
        self.interview_messages = []  # Left side
        self.agent_messages = []      # Right side
        
        self.turn_count = 0
        self.interview_complete = False
    
    def start_interview(self) -> Dict:
        """RH opens the interview"""
        
        prompt = f"""
        You are RH Agent conducting a professional interview.
        
        Candidate: {self.candidate_info.get('name')}
        Position: {self.candidate_info.get('role_applying')}
        
        Greet the candidate warmly and ask your FIRST question about their experience.
        Be conversational and professional.
        
        Return ONLY the greeting + question, nothing else.
        """
        
        response = client.messages.create(
            model="claude-opus-4.1",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )
        
        opening = response.content[0].text
        
        # Add to interview chat (left side)
        self.interview_messages.append({
            "speaker": "rh",
            "text": opening,
            "type": "question"
        })
        
        self.turn_count += 1
        
        return {
            "interview_chat": self.interview_messages,
            "agent_chat": self.agent_messages,
            "status": "waiting_candidate_response"
        }
    
    def candidate_speaks(self, response: str) -> Dict:
        """
        Candidate answers, then agents react
        """
        
        # 1. Add candidate answer to interview chat (LEFT)
        self.interview_messages.append({
            "speaker": "candidate",
            "text": response,
            "type": "answer"
        })
        
        # 2. Agents discuss INTERNALLY (RIGHT side)
        agent_discussion = self._agents_discuss(response)
        
        for agent_thought in agent_discussion:
            self.agent_messages.append(agent_thought)
        
        # 3. One agent asks a follow-up in the INTERVIEW (LEFT)
        follow_up = self._choose_agent_follow_up(response, agent_discussion)
        
        self.interview_messages.append({
            "speaker": follow_up["speaker"],
            "text": follow_up["text"],
            "type": "follow_up_question"
        })
        
        self.turn_count += 1
        
        return {
            "interview_chat": self.interview_messages,
            "agent_chat": self.agent_messages,
            "status": "waiting_candidate_response"
        }
    
    def _agents_discuss(self, candidate_response: str) -> List[Dict]:
        """
        Agents discuss what candidate said (RIGHT side)
        """
        
        context = f"Candidate just said: {candidate_response}\n\n"
        context += f"Previous interview:\n"
        for msg in self.interview_messages[-4:]:  # Last 4 messages for context
            context += f"{msg['speaker']}: {msg['text']}\n"
        
        agent_thoughts = []
        
        # RH's internal thought
        rh_prompt = f"""
        {context}
        
        You are RH Agent. Briefly share your internal thought (1-2 sentences) about what the candidate said.
        Think about technical competence and how to proceed.
        """
        
        rh_response = client.messages.create(
            model="claude-opus-4.1",
            max_tokens=150,
            messages=[{"role": "user", "content": rh_prompt}]
        )
        
        agent_thoughts.append({
            "speaker": "rh",
            "text": rh_response.content[0].text,
            "type": "internal_thought"
        })
        
        # Manager's internal thought
        manager_prompt = f"""
        {context}
        
        You are Manager Agent. Briefly share your internal thought (1-2 sentences) about the candidate's response.
        Focus on teamwork, communication, and fit.
        """
        
        manager_response = client.messages.create(
            model="claude-opus-4.1",
            max_tokens=150,
            messages=[{"role": "user", "content": manager_prompt}]
        )
        
        agent_thoughts.append({
            "speaker": "manager",
            "text": manager_response.content[0].text,
            "type": "internal_thought"
        })
        
        # Sales' internal thought
        sales_prompt = f"""
        {context}
        
        You are Sales Agent. Briefly share your internal thought (1-2 sentences).
        Focus on business understanding and client perspective.
        """
        
        sales_response = client.messages.create(
            model="claude-opus-4.1",
            max_tokens=150,
            messages=[{"role": "user", "content": sales_prompt}]
        )
        
        agent_thoughts.append({
            "speaker": "sales",
            "text": sales_response.content[0].text,
            "type": "internal_thought"
        })
        
        return agent_thoughts
    
    def _choose_agent_follow_up(self, candidate_response: str, agent_thoughts: List[Dict]) -> Dict:
        """
        Based on agent discussion, choose who asks follow-up
        """
        
        # Determine which agent should ask next
        if self.turn_count == 1:
            # After first answer, Manager asks follow-up
            speaker = "manager"
            focus = "teamwork and collaboration"
        elif self.turn_count == 2:
            # After second answer, Sales asks follow-up
            speaker = "sales"
            focus = "business acumen and user impact"
        else:
            # RH continues
            speaker = "rh"
            focus = "technical depth"
        
        context = f"Candidate response: {candidate_response}\n\n"
        for msg in self.interview_messages[-3:]:
            context += f"{msg['speaker']}: {msg['text']}\n"
        
        prompt = f"""
        {context}
        
        You are {speaker.upper()} Agent. 
        Ask ONE follow-up question about {focus}.
        Be conversational and build on what they just said.
        
        Return ONLY the question.
        """
        
        response = client.messages.create(
            model="claude-opus-4.1",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "speaker": speaker,
            "text": response.content[0].text,
            "type": "follow_up_question"
        }
    
    def move_to_next_topic(self) -> Dict:
        """
        RH transitions to next topic
        """
        
        if self.turn_count >= 6:  # 3 main topics x 2 turns each
            self.interview_complete = True
            return {
                "interview_chat": self.interview_messages,
                "agent_chat": self.agent_messages,
                "interview_complete": True,
                "status": "moving_to_decision"
            }
        
        # RH transitions
        context = "\n".join([f"{msg['speaker']}: {msg['text']}" for msg in self.interview_messages[-6:]])
        
        prompt = f"""
        {context}
        
        You are RH Agent. Transition to the NEXT topic smoothly.
        Say something like "Let's move on to..." then ask a new question.
        Make it conversational.
        
        Return ONLY the transition + new question.
        """
        
        response = client.messages.create(
            model="claude-opus-4.1",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}]
        )
        
        transition = response.content[0].text
        
        self.interview_messages.append({
            "speaker": "rh",
            "text": transition,
            "type": "transition_and_question"
        })
        
        self.turn_count += 1
        
        return {
            "interview_chat": self.interview_messages,
            "agent_chat": self.agent_messages,
            "status": "waiting_candidate_response"
        }
    
    def get_full_state(self) -> Dict:
        """Get current state of both chats"""
        return {
            "interview_chat": self.interview_messages,
            "agent_chat": self.agent_messages,
            "turn_count": self.turn_count,
            "interview_complete": self.interview_complete
        }
