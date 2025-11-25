"""
Conversation Practice Service

This module provides conversation practice functionality using OpenAI GPT API
to generate conversation prompts based on user topics.
"""

import os
from typing import Optional, List, Dict
from openai import OpenAI
from loguru import logger
from exceptions import ServiceNotAvailableException, ValidationException

class ConversationService:
    """Service for generating conversation practice prompts."""
    
    def __init__(self):
        """Initialize the conversation service with OpenAI client."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set. Conversation practice will be limited.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)
        
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    def generate_prompts(self, topic: str, count: int = 5) -> List[Dict[str, str]]:
        """
        Generate conversation practice prompts for a given topic.
        
        Args:
            topic: The topic the user wants to practice speaking about
            count: Number of prompts to generate (default: 5)
            
        Returns:
            List of prompt dictionaries with 'question' and 'context' fields
            
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
            # Create a system prompt for generating conversation practice questions
            system_prompt = """You are a helpful conversation practice assistant. 
Generate engaging conversation prompts that help users practice speaking about various topics.
Each prompt should:
1. Be a natural, conversational question or statement
2. Encourage the user to speak for 1-3 minutes
3. Be relevant to the given topic
4. Be appropriate for conversation practice
5. Include context that helps the user understand what to discuss

Return prompts as a list of questions that progressively get more challenging."""
            
            user_prompt = f"""Generate {count} conversation practice prompts for the topic: "{topic}"

Make the prompts:
- Natural and conversational
- Progressive in difficulty (start easier, get more challenging)
- Encouraging and supportive
- Specific enough to guide the user but open enough for creative responses

Format each prompt as a clear question or statement that invites the user to speak."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.8,
                max_tokens=1000,
            )
            
            # Parse the response
            content = response.choices[0].message.content
            
            # Extract prompts (they might be numbered or bulleted)
            prompts = []
            lines = content.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Remove numbering/bullets (1., 2., -, *, etc.)
                line = line.lstrip('0123456789.-* ').strip()
                
                if line and len(line) > 10:  # Valid prompt
                    prompts.append({
                        "question": line,
                        "context": f"Practice speaking about: {topic}"
                    })
            
            # If we didn't get enough prompts, create some fallback ones
            if len(prompts) < count:
                fallback_prompts = self._generate_fallback_prompts(topic, count - len(prompts))
                prompts.extend(fallback_prompts)
            
            # Return the requested number
            return prompts[:count]
            
        except Exception as e:
            logger.error(f"Error generating conversation prompts: {e}")
            # Return fallback prompts if API fails
            return self._generate_fallback_prompts(topic, count)
    
    def _generate_fallback_prompts(self, topic: str, count: int) -> List[Dict[str, str]]:
        """Generate fallback prompts when API is unavailable."""
        base_prompts = [
            f"Tell me about {topic}. What interests you most about it?",
            f"Describe your experience with {topic}. What have you learned?",
            f"What are the most important aspects of {topic} that people should know?",
            f"How would you explain {topic} to someone who has never heard of it?",
            f"What challenges or opportunities do you see related to {topic}?",
            f"Share your thoughts on the future of {topic}.",
            f"What personal connection do you have with {topic}?",
            f"If you could change one thing about {topic}, what would it be and why?",
        ]
        
        prompts = []
        for i in range(min(count, len(base_prompts))):
            prompts.append({
                "question": base_prompts[i % len(base_prompts)],
                "context": f"Practice speaking about: {topic}"
            })
        
        return prompts
    
    def is_available(self) -> bool:
        """Check if the conversation service is available."""
        return self.client is not None


# Create singleton instance
conversation_service = ConversationService()

