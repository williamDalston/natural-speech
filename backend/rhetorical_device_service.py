"""
Rhetorical Device Practice Service

This module provides rhetorical device practice functionality using OpenAI GPT API
to generate writing practice prompts that incorporate specific rhetorical devices.
"""

import os
from typing import Optional, List, Dict
from openai import OpenAI
from loguru import logger
from exceptions import ServiceNotAvailableException, ValidationException

# Comprehensive list of rhetorical devices with descriptions
RHETORICAL_DEVICES = {
    "Alliteration": "Repeated sound of first consonant",
    "Polyptoton": "Words of same root follow each other (watch the watchman)",
    "Antithesis": "Two opposites introduced near to contrast",
    "Merism": "Represent a whole by naming parts",
    "Blazon": "An extended merism as a big list",
    "Synaesthesia": "One sense described in terms of another",
    "Aposiopesis": "Becoming silent…",
    "Hyperbaton": "Put words in an odd order",
    "Anadiplosis": "Use last word as first of the next idea",
    "Periodic Sentence": "Big sentence, not complete till the end",
    "Hypotaxis & Parataxis": "contrast simple ideas no conjunctions; hierarchy of ideas (Having come, take!)",
    "Diacope": "Word or phrase repeated after brief intro",
    "Rhetorical Question": "Ask a question",
    "Hendiadys": "\"adjective\"-\"noun\" turned into \"noun\"-\"and\"-\"noun\" (furious sound -> sound and fury)",
    "Parataxis": "When the conjunction is elided: This coffee is nice and hot -> This is nice hot coffee",
    "Epistrophe": "Repetition at the end of phrases, or of clauses, and of paragraphs (for…by…of…is…is…is)",
    "Tricolon": "Three in a pattern, where the structure equals, ascends, or descends",
    "Epizeuxis": "Repeat a word immediately in the exact same sense",
    "Syllepsis": "Words used in multi-sense while in the same reference \"He took his hat and his leave.\"",
    "Isocolon": "Two sentences grammatically parallel",
    "Enallage": "Deliberate grammatical mistake.",
    "Meter": "Versify",
    "Zeugma": "A word that carries over to other parts of the sentence \"He works his work, I mine\"",
    "Paradox": "Astonishing thoughts, seemingly contradictory but true",
    "Chiasmus": "Sentence mirrored halfway through the middle \"Fair is foul, and foul is fair\"",
    "Assonance": "Repetition of vowel sounds",
    "Fourteenth Rule": "Throw in a random number",
    "Catachresis": "Using a word in a way that's it's not normal: --legs for chair sustainers, winter for wallet",
    "Litotes": "Affirming something by denying its opposite",
    "Metonymy & Synecdoche": "Call a thing by an associate of that thing's concept, part stands for whole",
    "Transferred Epithets": "Adjective applied to wrong noun (just move it)",
    "Pleonasm": "The unnecessary words to emphasize the same idea",
    "Epanalepsis": "implies circulatory and continuation",
    "Personification": "Give human qualities to inanimate nouns",
    "Hyperbole": "Exaggeration",
    "Adynaton": "An impossible image",
    "Prolepsis": "Use a pronoun before we say what we are referring to, or strawman",
    "Congeries": "list, heap of spice",
    "Scesis Onomaton": "No main verb. (successive different words with same meaning)",
    "Anaphora": "Starting each sentence with the same word",
}


class RhetoricalDeviceService:
    """Service for generating rhetorical device practice prompts."""
    
    def __init__(self):
        """Initialize the rhetorical device service with OpenAI client."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set. Rhetorical device practice will be limited.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)
        
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    def get_available_devices(self) -> Dict[str, str]:
        """Get all available rhetorical devices with descriptions."""
        return RHETORICAL_DEVICES.copy()
    
    def validate_devices(self, devices: List[str]) -> List[str]:
        """
        Validate and normalize device names.
        
        Args:
            devices: List of device names (case-insensitive)
            
        Returns:
            List of validated device names
            
        Raises:
            ValidationException: If any device is invalid
        """
        if not devices:
            raise ValidationException("At least one rhetorical device must be selected")
        
        validated = []
        invalid = []
        
        # Normalize device names (case-insensitive matching)
        device_lower_map = {k.lower(): k for k in RHETORICAL_DEVICES.keys()}
        
        for device in devices:
            device_lower = device.strip().lower()
            if device_lower in device_lower_map:
                validated.append(device_lower_map[device_lower])
            else:
                invalid.append(device)
        
        if invalid:
            raise ValidationException(
                f"Invalid rhetorical devices: {', '.join(invalid)}. "
                f"Available devices: {', '.join(sorted(RHETORICAL_DEVICES.keys()))}"
            )
        
        return validated
    
    def generate_prompts(
        self, 
        topic: str, 
        devices: List[str], 
        count: int = 3
    ) -> List[Dict[str, any]]:
        """
        Generate writing practice prompts that incorporate specific rhetorical devices.
        
        Args:
            topic: The topic the user wants to practice writing about
            devices: List of rhetorical devices to incorporate
            count: Number of prompts to generate (default: 3)
            
        Returns:
            List of prompt dictionaries with 'prompt', 'devices', and optional 'examples' fields
            
        Raises:
            ServiceNotAvailableException: If OpenAI API is not configured
            ValidationException: If topic or devices are invalid
        """
        if not topic or not topic.strip():
            raise ValidationException("Topic cannot be empty")
        
        # Validate devices
        validated_devices = self.validate_devices(devices)
        
        if not self.client:
            raise ServiceNotAvailableException(
                "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        try:
            # Build device descriptions for the prompt
            device_descriptions = []
            for device in validated_devices:
                desc = RHETORICAL_DEVICES.get(device, "")
                device_descriptions.append(f"- {device}: {desc}")
            
            device_list_text = "\n".join(device_descriptions)
            
            # Create system prompt
            system_prompt = """You are an expert writing instructor specializing in rhetorical devices and literary techniques. Your role is to create inspiring, educational writing prompts that help writers master specific rhetorical devices.

Prompt Design Principles:
1. **Clarity & Inspiration**: Make prompts clear enough to understand but inspiring enough to spark creativity
2. **Topic Integration**: Seamlessly weave the topic with the rhetorical devices—don't force them together
3. **Device Education**: Provide context that helps writers understand not just what the devices are, but how to use them effectively
4. **Appropriate Challenge**: Match difficulty to the devices—some are naturally more complex than others
5. **Creative Freedom**: Give enough structure to guide, but leave room for personal expression and experimentation
6. **Practical Application**: Show how these devices enhance writing, not just demonstrate knowledge of them

Your prompts should feel like invitations to explore and create, not assignments to complete."""
            
            user_prompt = f"""Generate {count} writing practice prompts for the topic: "{topic}"

Required Rhetorical Devices:
{device_list_text}

For each prompt:
1. **Clear Instruction**: Create a specific, actionable writing task that naturally incorporates the devices
2. **Device Integration**: Specify which devices should be used and suggest how they might work together
3. **Contextual Guidance**: Provide brief context or hints about how these devices can enhance writing about this topic
4. **Progressive Challenge**: If generating multiple prompts, gradually increase complexity—start with simpler device combinations, build to more sophisticated uses
5. **Creative Invitation**: Frame prompts as opportunities to explore and experiment, not rigid requirements

Format: Each prompt should be a clear, inspiring instruction that guides the user to write about "{topic}" while naturally incorporating the specified rhetorical devices. Make it feel like an exciting creative challenge, not a technical exercise."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.9,  # High creativity for varied, inspiring prompts
                max_tokens=1800,  # More space for detailed, educational prompts
            )
            
            # Parse the response
            content = response.choices[0].message.content
            
            # Extract and validate response
            if not response.choices or not response.choices[0].message:
                logger.warning("Empty response from OpenAI API, using fallback prompts")
                return self._generate_fallback_prompts(topic, validated_devices, count)
            
            content = response.choices[0].message.content
            if not content or not content.strip():
                logger.warning("Empty content from OpenAI API, using fallback prompts")
                return self._generate_fallback_prompts(topic, validated_devices, count)
            
            # Extract prompts with improved parsing
            prompts = self._parse_prompts(content, validated_devices, count)
            
            # If we didn't get enough prompts, supplement with fallback ones
            if len(prompts) < count:
                logger.info(f"Only got {len(prompts)} prompts, supplementing with fallback prompts")
                fallback_prompts = self._generate_fallback_prompts(
                    topic, validated_devices, count - len(prompts)
                )
                prompts.extend(fallback_prompts)
            
            # Return the requested number
            return prompts[:count]
            
        except ValidationException:
            raise
        except Exception as e:
            logger.error(f"Error generating rhetorical device prompts: {e}", exc_info=True)
            # Return fallback prompts if API fails
            return self._generate_fallback_prompts(topic, validated_devices, count)
    
    def _parse_prompts(
        self, 
        content: str, 
        devices: List[str], 
        expected_count: int
    ) -> List[Dict[str, any]]:
        """Parse prompts from GPT response."""
        prompts = []
        lines = content.strip().split('\n')
        current_prompt = None
        current_devices = []
        current_examples = []
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_prompt:
                    prompts.append({
                        "prompt": current_prompt,
                        "devices": current_devices if current_devices else devices,
                        "examples": "\n".join(current_examples) if current_examples else None
                    })
                    current_prompt = None
                    current_devices = []
                    current_examples = []
                continue
            
            # Check if this is a numbered/bulleted prompt
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('*')):
                # Save previous prompt if exists
                if current_prompt:
                    prompts.append({
                        "prompt": current_prompt,
                        "devices": current_devices if current_devices else devices,
                        "examples": "\n".join(current_examples) if current_examples else None
                    })
                
                # Start new prompt
                line = line.lstrip('0123456789.-* ').strip()
                current_prompt = line
                current_devices = []
                current_examples = []
            elif current_prompt:
                # Check if this line mentions devices or examples
                line_lower = line.lower()
                if any(device.lower() in line_lower for device in devices):
                    current_devices.append(line)
                elif 'example' in line_lower or 'hint' in line_lower:
                    current_examples.append(line)
                else:
                    # Append to current prompt
                    current_prompt += " " + line
        
        # Add last prompt
        if current_prompt:
            prompts.append({
                "prompt": current_prompt,
                "devices": current_devices if current_devices else devices,
                "examples": "\n".join(current_examples) if current_examples else None
            })
        
        # If parsing failed, try simpler approach
        if not prompts:
            # Split by double newlines or numbered items
            sections = content.split('\n\n')
            for section in sections:
                section = section.strip()
                if section and len(section) > 20:
                    # Remove numbering
                    section = section.lstrip('0123456789.-* ').strip()
                    if section:
                        prompts.append({
                            "prompt": section,
                            "devices": devices,
                            "examples": None
                        })
        
        return prompts
    
    def _generate_fallback_prompts(
        self, 
        topic: str, 
        devices: List[str], 
        count: int
    ) -> List[Dict[str, any]]:
        """Generate fallback prompts when API is unavailable."""
        device_names = ", ".join(devices)
        base_prompts = [
            f"Write a short piece about {topic} using {device_names}. Focus on incorporating these devices naturally into your writing.",
            f"Create a narrative or argument about {topic} that demonstrates {device_names}. Make sure each device enhances your message.",
            f"Compose a piece on {topic} where you intentionally use {device_names} to add depth and style to your writing.",
            f"Write about {topic} and experiment with {device_names}. Try to use each device at least once in your composition.",
            f"Craft a response to the topic '{topic}' that showcases {device_names}. Pay attention to how these devices affect the tone and impact of your writing.",
        ]
        
        prompts = []
        for i in range(min(count, len(base_prompts))):
            prompts.append({
                "prompt": base_prompts[i % len(base_prompts)],
                "devices": devices,
                "examples": None
            })
        
        return prompts
    
    def is_available(self) -> bool:
        """Check if the rhetorical device service is available."""
        return self.client is not None


# Create singleton instance
rhetorical_device_service = RhetoricalDeviceService()

