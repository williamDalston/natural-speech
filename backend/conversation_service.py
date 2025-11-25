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
            system_prompt = """You are an expert conversation practice coach specializing in creating engaging, effective speaking prompts.

Your prompts should:
1. **Feel Natural**: Use conversational language that feels authentic, not like test questions
2. **Encourage Extended Speech**: Design prompts that naturally invite 1-3 minutes of thoughtful response
3. **Be Topic-Relevant**: Directly connect to the given topic while allowing personal interpretation
4. **Progressive Difficulty**: Start with accessible prompts and gradually increase complexity
5. **Provide Context**: Include enough context to guide the speaker without being prescriptive
6. **Varied Approaches**: Mix question types (reflective, analytical, personal, hypothetical, comparative)
7. **Engaging & Thoughtful**: Spark genuine interest and encourage deep thinking

Format: Return clear, standalone prompts that can be used independently for practice sessions."""
            
            user_prompt = f"""Generate {count} conversation practice prompts for the topic: "{topic}"

Requirements:
- Create prompts that feel natural and conversational, not scripted or formulaic
- Design a progression: start with accessible prompts that build confidence, then gradually introduce more complex or nuanced challenges
- Make each prompt encouraging and supportive, inviting exploration rather than testing
- Balance specificity (enough guidance) with openness (room for personal expression and creativity)
- Vary the approach: mix personal reflection, analysis, comparison, hypothetical scenarios, and real-world application
- Ensure each prompt can stand alone and generate 1-3 minutes of meaningful speech

Format: Provide each prompt as a clear, engaging question or statement that immediately invites the user to share their thoughts."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.85,  # Higher creativity for varied, engaging prompts
                max_tokens=1200,  # Allow for more detailed, context-rich prompts
            )
            
            # Extract and validate response
            if not response.choices or not response.choices[0].message:
                logger.warning("Empty response from OpenAI API, using fallback prompts")
                return self._generate_fallback_prompts(topic, count)
            
            content = response.choices[0].message.content
            if not content or not content.strip():
                logger.warning("Empty content from OpenAI API, using fallback prompts")
                return self._generate_fallback_prompts(topic, count)
            
            # Parse the response with improved extraction
            prompts = self._parse_prompts_from_content(content, topic)
            
            # If we didn't get enough prompts, supplement with fallback ones
            if len(prompts) < count:
                logger.info(f"Only got {len(prompts)} prompts, supplementing with fallback prompts")
                fallback_prompts = self._generate_fallback_prompts(topic, count - len(prompts))
                prompts.extend(fallback_prompts)
            
            # Return the requested number
            return prompts[:count]
            
        except Exception as e:
            logger.error(f"Error generating conversation prompts: {e}", exc_info=True)
            # Return fallback prompts if API fails
            return self._generate_fallback_prompts(topic, count)
    
    def _parse_prompts_from_content(self, content: str, topic: str) -> List[Dict[str, str]]:
        """Parse prompts from GPT response with improved extraction logic."""
        prompts = []
        lines = content.strip().split('\n')
        current_prompt = None
        
        for line in lines:
            line = line.strip()
            if not line:
                # Empty line might indicate end of a prompt
                if current_prompt and len(current_prompt) > 10:
                    prompts.append({
                        "question": current_prompt,
                        "context": f"Practice speaking about: {topic}"
                    })
                    current_prompt = None
                continue
            
            # Remove numbering/bullets (1., 2., -, *, etc.) and common prefixes
            cleaned = line.lstrip('0123456789.-*• ').strip()
            
            # Check if this looks like a new prompt (starts with capital, has question mark, or is a statement)
            if cleaned and len(cleaned) > 10:
                # If we have a current prompt, save it
                if current_prompt and len(current_prompt) > 10:
                    prompts.append({
                        "question": current_prompt,
                        "context": f"Practice speaking about: {topic}"
                    })
                
                # Start new prompt
                current_prompt = cleaned
            elif current_prompt:
                # Continue building current prompt
                current_prompt += " " + cleaned
        
        # Add final prompt if exists
        if current_prompt and len(current_prompt) > 10:
            prompts.append({
                "question": current_prompt,
                "context": f"Practice speaking about: {topic}"
            })
        
        return prompts
    
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

