"""
HireFlow AI - Conversation Manager
Handles dual-chat system: Interview chat + Agent discussion chat
"""

from typing import List, Dict
from datetime import datetime
from enum import Enum

class MessageType(Enum):
    QUESTION = "question"
    ANSWER = "answer"
    AGENT_THOUGHT = "agent_thought"
    SYSTEM = "system"

class ChatMessage:
    def __init__(self, speaker: str, text: str, message_type: MessageType, chat_side: str = "interview"):
        """
        speaker: "rh", "manager", "sales", "candidate"
        text: the message content
        message_type: QUESTION, ANSWER, AGENT_THOUGHT, SYSTEM
        chat_side: "interview" (candidate sees) or "agent" (agents discuss)
        """
        self.speaker = speaker
        self.text = text
        self.message_type = message_type
        self.chat_side = chat_side
        self.timestamp = datetime.now()
    
    def to_dict(self):
        return {
            "speaker": self.speaker,
            "text": self.text,
            "type": self.message_type.value,
            "side": self.chat_side,
            "timestamp": self.timestamp.isoformat()
        }

class DualChatConversation:
    """Manages both chat streams: Interview + Agent Discussion"""
    
    def __init__(self, candidate_id: str):
        self.candidate_id = candidate_id
        self.interview_chat: List[ChatMessage] = []  # Left side - visible to candidate
        self.agent_chat: List[ChatMessage] = []      # Right side - agents discussing
        self.current_topic = None
        self.turn_count = 0
    
    def add_interview_message(self, speaker: str, text: str, message_type: MessageType = MessageType.QUESTION):
        """Add message to interview chat (left side - candidate sees)"""
        msg = ChatMessage(speaker, text, message_type, "interview")
        self.interview_chat.append(msg)
        return msg
    
    def add_agent_message(self, speaker: str, text: str, message_type: MessageType = MessageType.AGENT_THOUGHT):
        """Add message to agent discussion (right side - agents thinking)"""
        msg = ChatMessage(speaker, text, message_type, "agent")
        self.agent_chat.append(msg)
        return msg
    
    def get_interview_chat(self) -> List[Dict]:
        """Get all messages for interview chat (left side)"""
        return [msg.to_dict() for msg in self.interview_chat]
    
    def get_agent_chat(self) -> List[Dict]:
        """Get all messages for agent discussion (right side)"""
        return [msg.to_dict() for msg in self.agent_chat]
    
    def get_full_conversation(self) -> Dict:
        """Get both chats"""
        return {
            "interview_chat": self.get_interview_chat(),
            "agent_chat": self.get_agent_chat()
        }
    
    def get_conversation_context(self) -> str:
        """Get full context for agents to understand the interview"""
        context = "=== INTERVIEW CONVERSATION ===\n"
        for msg in self.interview_chat:
            context += f"{msg.speaker}: {msg.text}\n"
        
        context += "\n=== AGENT DISCUSSION ===\n"
        for msg in self.agent_chat:
            context += f"{msg.speaker}: {msg.text}\n"
        
        return context
