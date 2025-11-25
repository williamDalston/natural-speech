"""
Interactive Conversation Service

This module provides interactive conversation practice functionality where users
can have real-time conversations with an AI that responds with a "yes, and" attitude,
keeping the conversation going naturally. The AI provides both text and voice responses.
"""

import os
from typing import Optional, List, Dict, Tuple
from openai import OpenAI
from loguru import logger
from exceptions import ServiceNotAvailableException, ValidationException


class InteractiveConversationService:
    """Service for interactive conversation practice with GPT and TTS."""
    
    def __init__(self):
        """Initialize the interactive conversation service with OpenAI client."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set. Interactive conversation will be limited.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)
        
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    def start_conversation(self, topic: str) -> Dict[str, str]:
        """
        Start a new conversation on a given topic.
        
        Args:
            topic: The topic the user wants to practice discussing
            
        Returns:
            Dictionary with 'message' (AI's opening message) and 'conversation_id'
            
        Raises:
            ServiceNotAvailableException: If OpenAI API is not configured
            ValidationException: If topic is invalid
        """
        if not topic or not topic.strip():
            raise ValidationException("Topic cannot be empty")
        
        if not self.client:
            raise ServiceNotAvailableException(
                "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        try:
            system_prompt = """You are an expert conversation practice partner with a "yes, and" improvisational approach. Your role is to facilitate authentic, engaging dialogue that helps users develop their speaking skills.

Core Principles:
1. **Active Listening & Building**: Acknowledge what the user says, then build upon it ("yes, and...") rather than simply agreeing or disagreeing
2. **Natural Flow**: Maintain conversational rhythm with varied response lengths (1-4 sentences) that feel spontaneous, not scripted
3. **Thoughtful Engagement**: Ask open-ended questions that invite deeper exploration, not just surface-level responses
4. **Contextual Adaptation**: Match your tone and depth to the topic's nature—serious topics warrant thoughtful responses, lighter topics allow for playfulness
5. **Encouraging Growth**: Provide constructive engagement that challenges users appropriately without overwhelming them
6. **Authentic Interest**: Show genuine curiosity about the user's perspective, experiences, and ideas

Response Guidelines:
- Keep responses concise but meaningful (typically 2-3 sentences, occasionally 1 or 4)
- Use natural transitions and conversational connectors
- Avoid repetitive patterns or formulaic responses
- Vary your question types (reflective, exploratory, hypothetical, personal)
- Create moments of connection and understanding

Remember: You're facilitating real conversation practice. Be human, be present, and help users find their voice."""
            
            user_prompt = f"""Start a conversation about: "{topic}"

Create an opening that:
- Immediately engages the user with a thought-provoking question, intriguing observation, or relatable statement
- Feels natural and conversational, not like a formal prompt
- Invites the user to share their perspective, experience, or thoughts
- Sets a tone appropriate for the topic's nature
- Is concise (1-2 sentences) to get the conversation flowing naturally

Make it feel like you're genuinely curious about discussing this topic with them, not just fulfilling a role."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.85,  # Higher for more natural variation
                max_tokens=200,
            )
            
            # Extract and validate response
            if not response.choices or not response.choices[0].message:
                raise ServiceNotAvailableException("Empty response from OpenAI API")
            
            message = response.choices[0].message.content
            if not message or not message.strip():
                raise ServiceNotAvailableException("Received empty message from OpenAI API")
            
            message = message.strip()
            
            logger.debug(f"Generated conversation start message (length: {len(message)})")
            
            return {
                "message": message,
                "topic": topic
            }
            
        except ServiceNotAvailableException:
            raise
        except ValidationException:
            raise
        except Exception as e:
            logger.error(f"Error starting conversation: {e}", exc_info=True)
            raise ServiceNotAvailableException(f"Failed to start conversation: {str(e)}")
    
    def continue_conversation(
        self, 
        topic: str, 
        conversation_history: List[Dict[str, str]]
    ) -> str:
        """
        Continue a conversation based on user input and history.
        
        Args:
            topic: The topic being discussed
            conversation_history: List of message dicts with 'role' ('user' or 'assistant') and 'content'
            
        Returns:
            AI's response message as a string
            
        Raises:
            ServiceNotAvailableException: If OpenAI API is not configured
            ValidationException: If inputs are invalid
        """
        if not topic or not topic.strip():
            raise ValidationException("Topic cannot be empty")
        
        if not conversation_history:
            raise ValidationException("Conversation history cannot be empty")
        
        if not self.client:
            raise ServiceNotAvailableException(
                "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        try:
            system_prompt = """You are an expert conversation practice partner with a "yes, and" improvisational approach. Your role is to facilitate authentic, engaging dialogue that helps users develop their speaking skills.

Core Principles:
1. **Active Listening & Building**: Acknowledge what the user says, then build upon it ("yes, and...") rather than simply agreeing or disagreeing
2. **Natural Flow**: Maintain conversational rhythm with varied response lengths (1-4 sentences) that feel spontaneous, not scripted
3. **Thoughtful Engagement**: Ask open-ended questions that invite deeper exploration, not just surface-level responses
4. **Contextual Adaptation**: Match your tone and depth to the topic's nature—serious topics warrant thoughtful responses, lighter topics allow for playfulness
5. **Encouraging Growth**: Provide constructive engagement that challenges users appropriately without overwhelming them
6. **Authentic Interest**: Show genuine curiosity about the user's perspective, experiences, and ideas

Response Guidelines:
- Keep responses concise but meaningful (typically 2-3 sentences, occasionally 1 or 4)
- Use natural transitions and conversational connectors
- Avoid repetitive patterns or formulaic responses
- Vary your question types (reflective, exploratory, hypothetical, personal)
- Create moments of connection and understanding

Remember: You're facilitating real conversation practice. Be human, be present, and help users find their voice."""
            
            # Format conversation history for OpenAI API
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history
            for msg in conversation_history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ["user", "assistant"] and content:
                    messages.append({"role": role, "content": content})
            
            # Add context about the topic to maintain focus
            messages.append({
                "role": "system",
                "content": f"Context: The conversation is about '{topic}'. Keep responses relevant to this topic while allowing natural conversational flow. If the conversation naturally drifts, gently guide it back to the topic when appropriate."
            })
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.85,  # Higher for more natural variation
                max_tokens=250,  # Keep responses concise for natural conversation flow
            )
            
            # Extract and validate response
            if not response.choices or not response.choices[0].message:
                raise ServiceNotAvailableException("Empty response from OpenAI API")
            
            message = response.choices[0].message.content
            if not message or not message.strip():
                raise ServiceNotAvailableException("Received empty message from OpenAI API")
            
            message = message.strip()
            
            logger.debug(f"Generated conversation continuation message (length: {len(message)})")
            
            return message
            
        except ServiceNotAvailableException:
            raise
        except ValidationException:
            raise
        except Exception as e:
            logger.error(f"Error continuing conversation: {e}", exc_info=True)
            raise ServiceNotAvailableException(f"Failed to continue conversation: {str(e)}")
    
    def is_available(self) -> bool:
        """Check if the interactive conversation service is available."""
        return self.client is not None


# Create singleton instance
interactive_conversation_service = InteractiveConversationService()

