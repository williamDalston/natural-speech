"""
Speech Generation Service

This module provides speech generation functionality using OpenAI GPT API
to generate sophisticated, human-like speeches based on topics using a 5-prompt system.
"""

import os
from typing import Optional
from openai import OpenAI
from loguru import logger
from exceptions import ServiceNotAvailableException, ValidationException

class SpeechService:
    """Service for generating practice speeches."""
    
    def __init__(self):
        """Initialize the speech service with OpenAI client."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set. Speech generation will be unavailable.")
            self.client = None
        else:
            self.client = OpenAI(api_key=api_key)
        
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    def generate_speech(self, topic: str) -> str:
        """
        Generate a sophisticated speech for a given topic using a 5-prompt system.
        
        Args:
            topic: The topic to generate a speech about
            
        Returns:
            The generated speech content
            
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
            logger.info(f"Generating speech for topic: {topic}")
            
            # Prompt 1: Initial generation
            prompt_1 = f"""PROMPT 1: CREATE FOUNDATIONAL SPEECH

Objective: Generate an eloquent, intellectually sophisticated, and deeply engaging script on '{topic}' that feels authentically human-written, not AI-generated.

Core Requirements:
1. **Authentic Voice**: Avoid LLM patterns—vary sentence structure, use unexpected vocabulary choices, create natural rhythm
2. **Intellectual Depth**: Include substantive insights, studies, breakthrough observations, and how practitioners actually think in this field
3. **Emotional Resonance**: Balance academic rigor with storytelling and cinematic techniques to create connection
4. **Intimate Tone**: Write as if a well-informed expert is having an intimate conversation, not delivering a formal speech
5. **No Fluff**: Every word should serve a purpose—rhetoric with substance, not empty eloquence
6. **Unique Variation**: Use different vocabulary, noun/verb choices, and structures than typical AI-generated content

Target: A 10-minute journey (approximately 1,500-1,800 words) that informs, captivates, inspires, and challenges—leaving lasting intellectual and emotional impact.

Format: Continuous prose, no headers or section breaks. Ready to read aloud immediately.

Instructions:

Introduction: Ignite Curiosity

Compelling Hook: Begin with one of the following techniques to immediately draw viewers in:

Provocative Quote: Present a powerful, relevant quote tied to a modern issue or perspective, making it feel both timeless and current.

Existential Question: Pose a deeply thought-provoking question that challenges viewers' core beliefs and provokes introspection.

Counterintuitive Statistic: Share a surprising, lesser-known fact or statistic that subverts expectations and piques curiosity.

Personal Narrative: Offer a brief but compelling story that relates the topic to the viewer's own life or experiences.

Viewer Connection:

Address the audience directly, acknowledging their curiosity and existing knowledge.

Use inclusive language like "Let's delve into..." to create a sense of camaraderie.

Hint at deeper insights to come, promising a transformative experience.

Roadmap with Intrigue:

Provide a brief, exciting overview of what the video will cover without revealing all the details.

Foreshadow major revelations to build anticipation.

Example: "By the end of this video, you'll perceive {topic} through an entirely new perspective."

Challenging Popular Perceptions: Deepen the Inquiry

Deconstructing Common Narratives:

Introduce common beliefs or assumptions about {topic}, acknowledging their historical or cultural roots.

Respectfully and rigorously dismantle misconceptions, presenting clear, evidence-based clarifications.

Emphasize that revising one's understanding is a sign of intellectual growth.

Rhetorical Engagement:

Pose open-ended questions that encourage viewers to reflect critically.

Use strategic pauses to give viewers time to ponder before unveiling deeper insights.

Example: "Why do we hold onto the belief that [common misconception]? Let's examine the evidence."

Deep Exploration: Balance Rigor and Accessibility

Thematic Coherence:

Establish a central thesis or guiding question that anchors the exploration.

Revisit this theme throughout to maintain focus and build intellectual momentum.

Sophisticated Yet Clear Communication:

Break down complex concepts using relatable metaphors and analogies.

Introduce technical terms with clear explanations and context.

Use vivid language to help viewers visualize abstract ideas.

Interdisciplinary Synthesis:

Highlight connections between '{topic}' and other fields or areas of life.

Show unexpected links between seemingly disparate disciplines.

Example: "This concept in '{topic}' mirrors patterns we see in economics and even music."

Cutting-Edge & Open Questions:

Present the latest research and developments with enthusiasm.

Frame unanswered questions as opportunities for further exploration.

Encourage viewers to think critically about ongoing debates.

Astounding Insights: Inspire Awe

Revelations with Impact:

Speak about about the historical origins and move forward with the intellectual or professional insights. Gradually build up to key insights, creating a sense of discovery.

Reveal impactful information strategically for maximum effect.

Humanizing Complex Ideas:

Share stories about the people behind major breakthroughs.

Connect historical journeys to the viewer's own learning process.

Vivid Conceptualization:

Use descriptive, sensory language to bring abstract concepts to life.

Employ thought experiments to help viewers "experience" complex ideas.

Develop metaphors that evolve and deepen as the video progresses.

Sustained Engagement: Craft a Captivating Journey

Narrative Arc:

Structure the content like a story, with each revelation leading to new questions.

Create intellectual tension and release to keep viewers hooked.

Use cliffhangers to maintain interest.

Active Participation:

Pose challenges or thought experiments directly to the viewer.

Encourage them to apply new knowledge to real-world situations.

Include moments for self-reflection.

Example: "How might this new understanding change your approach to [everyday activity]?"

Emotional & Intellectual Resonance:

Tap into the awe-inspiring nature of the topic.

Acknowledge the emotional impact of paradigm shifts.

Create moments of intellectual satisfaction as complex ideas come together.

Conclusion: Leave a Lasting Impression

Synthesis of Ideas:

Briefly recap the main points and tie them together thoughtfully.

Revisit the opening theme, highlighting the intellectual journey undertaken.

The Road Ahead:

Pose a final question that encourages further thought.

Suggest potential future developments or areas for exploration.

Community Engagement:

Invite viewers to discuss the topic in the comments.

Suggest a specific question or topic for them to consider.

Inspirational Close:

Connect the intellectual journey to personal growth and societal progress.

End with a call to action, encouraging continued curiosity and learning.

Additional Techniques for Maximum Impact

Cinematic Language:

Use visual descriptors to create vivid mental scenes.

Craft metaphors and analogies that evolve as the narrative progresses.

Example: "Imagine zooming into the very fabric of reality..."

Varied Cognitive Pacing:

Alternate between fast-paced information and slower, reflective moments.

Use linguistic devices like alliteration or repetition for emphasis.

Vary sentence length to maintain a dynamic rhythm.

Intellectual Plot Twists:

Introduce unexpected perspectives or contradictions.

Create cognitive dissonance, then resolve it for intellectual satisfaction.

Futuristic Speculation:

Encourage viewers to imagine potential future scenarios related to {topic}.

Frame these speculations as part of an ongoing, exciting intellectual journey.

Meta-Commentary on Learning:

Reflect on the learning process itself.

Validate the challenge of grappling with complex ideas, fostering a growth mindset.

Guidelines for Length and Timing

Target Duration:

Aim for a script that fits within a 10-minute video format (approximately 1,500 to 1,800 words).

Adjust the depth and detail to suit this timeframe without sacrificing clarity or engagement.

Concise Thoroughness:

Ensure each section is thorough yet concise.

Maintain a logical progression without unnecessary digressions.

Final Notes:

Tone and Style:

Maintain an authoritative yet inviting tone.

Balance intellectual rigor with emotional resonance.

Avoid jargon unless it's clearly explained and adds value.

Audience Engagement:

Connect with the audience throughout.

Encourage active thinking and personal connection to the material.

Foster a sense of shared exploration and discovery. Remember to sound intimate throughout and not like someone removed, giving a speech. If you think your output is good, try to make it even more dense with the fields insights, and advances in concepts, and connect the dots fluidly, and only then give it to me."""

            response_1 = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt_1}
                ],
                temperature=0.9,
                max_tokens=4000,
            )
            
            # Validate response
            if not response_1.choices or not response_1.choices[0].message:
                raise ServiceNotAvailableException("Empty response from OpenAI API in Prompt 1")
            
            speech_content = response_1.choices[0].message.content
            if not speech_content or not speech_content.strip():
                raise ServiceNotAvailableException("Empty speech content from OpenAI API in Prompt 1")
            
            speech_content = speech_content.strip()
            logger.debug(f"Completed Prompt 1 (length: {len(speech_content)} chars)")
            
            # Prompt 2: Enhancement
            prompt_2 = f"""PROMPT 2: ENHANCE INTELLECTUAL DEPTH & STYLE

Preserve ALL existing content while enhancing using these strategies:

Enhancement Priorities:
1. **Intellectual Stimulation**: Add hyper-expert insights, historical context showing how knowledge has accumulated, and deeper theoretical frameworks
2. **Explicit Expression**: If something is implied, make it explicit—don't leave important ideas unstated
3. **Historical Depth**: Weave in how insights have evolved, key moments of discovery, and the intellectual traditions that shaped the field

As you write, if appropriate, shift at some point out of and in an artful way the perspectives on the topic.

Vary sentence length: Use a mix of short, medium, and long sentences to create a natural rhythm and maintain the reader's interest. Short sentences can provide emphasis, while longer sentences can convey complex ideas or descriptions.

Use strong, specific verbs: Choose precise and evocative verbs to convey action and emotion. Strong verbs can bring your writing to life and reduce the need for adverbs.

Parallel structure: Employ parallelism to create a sense of balance and harmony in your sentences. This involves using similar grammatical structures for related ideas or items in a list.

Active voice: Write in the active voice whenever possible, as it makes your sentences more direct and engaging. The active voice clearly identifies the subject and the action they are performing.

Sensory details: Include sensory details to create vivid, immersive descriptions that engage the reader's senses. This can help make your sentences more evocative and memorable.

Avoid clichés and overused phrases: Strive for originality in your phrasing and avoid relying on clichés or overused expressions. This can make your writing feel fresh and distinctive.

Concision: Eliminate unnecessary words and phrases, focusing on clarity and precision. Aim to convey your meaning in as few words as possible without sacrificing clarity or style.

Varied sentence structure: Experiment with different sentence structures, such as compound, complex, or compound-complex sentences. This can create variety and keep your paragraphs from feeling monotonous.

Balance and contrast: Create balance and contrast within sentences and paragraphs by juxtaposing opposing ideas or contrasting descriptions. This can add depth and interest to your writing.

Transition words and phrases: Use transition words and phrases to connect ideas and guide the reader through your paragraphs. This helps maintain a logical flow and coherence in your writing.

Read your work aloud: Read your sentences and paragraphs aloud to assess their rhythm, flow, and overall sound. This can help you identify areas that need improvement and fine-tune your writing style.

Show, don't tell: Use specific actions, events, and imagery to convey emotions, thoughts, and character development rather than simply stating them.

Use concrete images: Focus on writing sentences that are associated with a concrete image to keep the reader's attention.

Balance rhetorical techniques so it moves forward in an enchanting way, but not so sporadically, but in tasteful moments.

Focus on script development: the writing should have a unique personality, backstory, goals, and characteristics that the reader can relate to and engage with.

Incorporate undertones: When appropriate to create an emotional connection and add depth to the narrative.

Answer open questions: Ensure that all questions raised in the story are somewhat answered, guided, or resolved by the end, to provide the reader with a sense of closure and satisfaction.

Maintain the detailed structure to help guide the writing process and maintain consistency throughout the script.

Use conflict and tension: Introduce conflicts and tension, both internal and external, to keep the reader engaged and invested in the story.

Incorporate subplots: Weave in subplots to add dimension to the story and further develop the characters.

Revise and refine: Continuously revise and refine the writing, taking into account feedback and suggestions for improvement to create a polished final product.

Also, keep in mind these rhetorical devices:

Alliteration: Repeated sound of first consonant

Polyptoton: Words of same root follow each other (watch the watchman)

Antithesis: Two opposites introduced near to contrast

Merism: Represent a whole by naming parts

Blazon: An extended merism as a big list

Synaesthesia: One sense described in terms of another

Aposiopesis: Becoming silent…

Hyperbaton: Put words in an odd order

Anadiplosis: Use last word as first of the next idea

Periodic Sentence: Big sentence, not complete till the end

Hypotaxis & Parataxis: contrast simple ideas no conjunctions; hierarchy of ideas (Having come, take!")

Diacope: Word or phrase repeated after brief intro

Rhetorical Question: Ask a question

Hendiadys: "adjective"-"noun" turned into "noun"-"and"-"noun" (furious sound -> sound and fury)

Parataxis: When the conjunction is elided: This coffee is nice and hot -> This is nice hot coffee

Epistrophe: Repetition at the end of phrases, or of clauses, and of paragraphs (for…by…of…is…is…is)

Tricolon: Three in a pattern, where the structure equals, ascends, or descends

Epizeuxis: Repeat a word immediately in the exact same sense

Syllepsis: Words used in multi-sense while in the same reference "He took his hat and his leave."

Isocolon: Two sentences grammatically parallel

Enallage: Deliberate grammatical mistake.

Meter: Versify

Zeugma: A word that carries over to other parts of the sentence "He works his work, I mine"

Paradox: Astonishing thoughts, seemingly contradictory but true

Chiasmus: Sentence mirrored halfway through the middle "Fair is foul, and foul is fair"

Assonance: Repetition of vowel sounds

Fourteenth Rule: Throw in a random number

Catachresis: Using a word in a way that's it's not normal: --legs for chair sustainers, winter for wallet

Litotes: Affirming something by denying its opposite

Metonymy & Synecdoche: Call a thing by an associate of that thing's concept, part stands for whole

Transferred Epithets: Adjective applied to wrong noun (just move it)

Pleonasm: The unnecessary words to emphasize the same idea

Epanalepsis: implies circulatory and continuation

Personification: Give human qualities to inanimate nouns

Hyperbole: Exaggeration

Adynaton: An impossible image

Prolepsis: Use a pronoun before we say what we are referring to, or strawman

Congeries: list, heap of spice

Scesis Onomaton: No main verb. (successive different words with same meaning)

Anaphora: Starting each sentence with the same word

The writing and ideas should be extremely deep, profound, and beautiful. It should likewise take the hearer on a transformation through himself, potentially helping gain enlightenment. Revise your outline at least 20 times to improve it, so that it becomes the best script ever written. For all this, pleaes make sure there is a deep review of principles, insights, advances, etc. (hopefully in the origional)

Here is the current speech content:

{speech_content}"""

            response_2 = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt_2}
                ],
                temperature=0.8,
                max_tokens=4000,
            )
            
            # Validate response
            if not response_2.choices or not response_2.choices[0].message:
                raise ServiceNotAvailableException("Empty response from OpenAI API in Prompt 2")
            
            speech_content = response_2.choices[0].message.content
            if not speech_content or not speech_content.strip():
                raise ServiceNotAvailableException("Empty speech content from OpenAI API in Prompt 2")
            
            speech_content = speech_content.strip()
            logger.debug(f"Completed Prompt 2 (length: {len(speech_content)} chars)")
            
            # Prompt 3: Add theoretical frameworks and discoveries
            prompt_3 = f"""PROMPT 3: INTEGRATE THEORETICAL FRAMEWORKS & DISCOVERIES

Preserve ALL existing content while expanding the script with:

1. **Theoretical Frameworks**: Weave in important theoretical frameworks that ground the field of {topic}
2. **Experimental Breakthroughs**: Include key discoveries, experimental results, and studies that pushed boundaries—reference specific findings and their implications
3. **Practical Processes**: Be detailed in describing how processes actually play out in practice, not just in theory
4. **Intellectual Traditions**: Dive into the academic traditions, schools of thought, and intellectual lineages that shaped the field
5. **Academic Debates**: Highlight ongoing debates, controversies, and competing perspectives that define the field's evolution
6. **Recent Advances**: Include cutting-edge developments and recent breakthroughs if applicable
7. **Open Questions**: Frame unanswered questions as opportunities for future exploration

Integration Goal: Seamlessly weave these elements throughout the narrative to add width, depth, and breadth. Show the dynamic interplay between theory and experimentation, historical context and current understanding, established knowledge and open frontiers.

Maintain the intimate, conversational tone while enriching with this intellectual depth.

Here is the current speech content:

{speech_content}"""

            response_3 = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt_3}
                ],
                temperature=0.8,
                max_tokens=4000,
            )
            
            # Validate response
            if not response_3.choices or not response_3.choices[0].message:
                raise ServiceNotAvailableException("Empty response from OpenAI API in Prompt 3")
            
            speech_content = response_3.choices[0].message.content
            if not speech_content or not speech_content.strip():
                raise ServiceNotAvailableException("Empty speech content from OpenAI API in Prompt 3")
            
            speech_content = speech_content.strip()
            logger.debug(f"Completed Prompt 3 (length: {len(speech_content)} chars)")
            
            # Prompt 4: Humanize the text
            prompt_4 = f"""PROMPT 4: HUMANIZE & POLISH THE TEXT

Apply these strategies to refine the text and make it feel authentically human-written:

Sentence Structure and Length:

LLM Tendency: Sentences are often uniform in structure and length, aiming for a balanced and predictable flow.

Humanization Strategy: Break this rhythm by varying sentence length intentionally. Use short, punchy sentences to add emphasis, and longer, more flowing sentences to develop complex ideas. Mix in sentence fragments or clauses that reflect the natural rhythm of thought or conversation. This adds an unpredictable and dynamic texture, making the writing more engaging.

Action: Review each paragraph. Break apart or combine sentences to create unexpected patterns, adding pauses that mimic speech.

Subtle Shifts in Thought:

LLM Tendency: Logical and seamless transitions between points.

Humanization Strategy: Introduce digressions or non-linear thinking. Use abrupt tone shifts, personal reflections, or subtle humor to disrupt the narrative. These moments create a human feel, reflecting how thoughts can wander or return to an earlier idea.

Action: Identify places where the text feels overly linear and add small, spontaneous shifts in direction or tone. This could be a sudden metaphor or a rhetorical question that veers away and loops back.

Embrace Imperfection & Complexity in Grammar:

LLM Tendency: Perfect grammar and sentence construction.

Humanization Strategy: Let a few imperfections in. Include sentence fragments, casual colloquialisms, and moments of less-than-perfect grammar. These imperfections are not errors but stylistic choices that capture human spontaneity.

Action: Introduce occasional sentence fragments, ellipses, or conversational asides. For example, replace long-winded clarifications with short, incomplete thoughts to mimic natural dialogue or internal reflection.

Implicitness and Subtext:

LLM Tendency: Over-explains ideas to ensure clarity.

Humanization Strategy: Humans often leave things unsaid or implied. Allow the reader to infer meaning, using imagery and metaphor. Let connections emerge organically without stating them outright. Subtlety adds depth, creating a richer experience.

Action: Where the text feels over-explained, pull back. Use symbolism, metaphors, or context clues to convey meaning without spelling it out. Trust the reader to fill in the gaps.

Unpredictable Emotional Fluctuations:

LLM Tendency: Maintains a neutral or consistently controlled emotional tone.

Humanization Strategy: Inject sudden and unexpected emotional depth, whether through sarcasm, frustration, enthusiasm, or vulnerability. Humans often oscillate between different emotional states, sometimes within the same sentence.

Action: Find moments where an unexpected emotional twist would make sense—an offhand joke, a burst of passion, or a poignant aside. Introduce a brief emotional outburst or a contemplative pause.

Fewer Transitions:

LLM Tendency: Heavily reliant on logical, explicit transitions.

Humanization Strategy: Reduce obvious transition phrases. Allow ideas to flow more organically without the need for markers like "however" or "furthermore." Let the reader make the connections between ideas naturally.

Action: Go through the text and remove transition words that feel artificial. Instead, link ideas by juxtaposing them in ways that feel intuitive rather than forced.

Original Phrasing:

LLM Tendency: Falls back on stock phrases or common expressions.

Humanization Strategy: Craft unique expressions or reframe ideas in unexpected ways. Avoid clichés or overly polished language in favor of raw, creative diction. Insert personal voice, regional idioms, or unconventional metaphors to breathe life into the text.

Action: Identify where the phrasing feels too polished or repetitive. Experiment with more vivid, evocative alternatives. Instead of using a predictable phrase, push for something more striking or idiosyncratic.

Personal & Historical References:

LLM Tendency: Presents information in a broad, generalized manner.

Humanization Strategy: Bring in personal anecdotes or obscure historical references that reveal a deeper connection to the subject. This makes the writing feel more intimate and personal, adding layers of complexity.

Action: Add a brief personal story or historical example that's unexpected or obscure. Tie it back to the subject matter to add richness and depth.

Unpredictable Argumentation:

LLM Tendency: Follows standard patterns in presenting an argument—thesis, evidence, conclusion.

Humanization Strategy: Break the mold by introducing unconventional ideas or leaving certain conclusions open-ended. Challenge traditional logic, presenting surprising perspectives that invite the reader to rethink assumptions.

Action: Introduce a twist in the argument—something that turns the initial logic upside down or offers a thought-provoking contradiction. Allow for ambiguity instead of a neat conclusion.

Tone Shifts & Contradictions:

LLM Tendency: Consistent, predictable tone from start to finish.

Humanization Strategy: Humans often shift tone subtly or dramatically, even within the same thought. Embrace moments where the tone changes—whether it be from analytical to poetic, formal to casual, or confident to skeptical.

Action: Revisit sections where the tone feels uniform. Add moments where the tone sharpens, softens, or contradicts itself to reflect the complexity of thought.

Creative Word Choice:

LLM Tendency: Uses safe, default vocabulary and phrasing.

Humanization Strategy: Introduce words that evoke more distinct imagery or emotional responses. Use regional or historical terms that aren't commonly found in automated writing. Let the diction reflect a unique, creative voice.

Action: Identify areas of redundant or bland vocabulary and replace them with more vivid, unexpected word choices. Play with poetic, sensory-driven, or technical language to keep the text engaging.

Additional Techniques to Implement:

Challenge the Reader with Thoughtful Questions: Pose difficult, philosophical, or open-ended questions that provoke deeper reflection. Human writing often leaves space for the reader to engage in self-exploration.

Introduce Subtle Humor or Irony: Human writing often contains moments of wit or irony that LLMs rarely replicate well. A well-placed, subtle joke or ironic comment can make a piece feel more authentic.

Reread Out Loud: Human speech has an inherent rhythm, and reading aloud helps catch unnatural or overly formal phrasing. Adjust the flow to mirror how a human would naturally speak or write.

Implementation: Integrate these strategies throughout the text to create human qualities—unpredictability, emotional nuance, and depth of insight. The goal is a final text that feels spontaneous, rich, and authentically human.

Final Requirements:
- Subtly add personal touches and conversational elements
- Preserve ALL depth and complexity: scientific discoveries, historical elements, theoretical debates
- Maintain intellectual engagement and emotional resonance
- Keep formal depth even while adding humor and human touches
- DO NOT remove any content—only enhance and refine

Here is the current speech content:

{speech_content}"""

            response_4 = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt_4}
                ],
                temperature=0.8,
                max_tokens=4000,
            )
            
            # Validate response
            if not response_4.choices or not response_4.choices[0].message:
                raise ServiceNotAvailableException("Empty response from OpenAI API in Prompt 4")
            
            speech_content = response_4.choices[0].message.content
            if not speech_content or not speech_content.strip():
                raise ServiceNotAvailableException("Empty speech content from OpenAI API in Prompt 4")
            
            speech_content = speech_content.strip()
            logger.debug(f"Completed Prompt 4 (length: {len(speech_content)} chars)")
            
            # Prompt 5: Final polish
            prompt_5 = f"""PROMPT 5: FINAL LINE-BY-LINE POLISH

Review the entire text line by line and make subtle refinements:

1. **Word Choice**: Ensure every word is perfectly and carefully chosen for maximum effect
2. **Sentence Structure**: Adjust sentence structures for optimal rhythm, clarity, and impact
3. **Scientific Content**: Strengthen the presence of scientific theories, discoveries, and debates
4. **Casual Rigor**: Maintain the balance of casual accessibility with intellectual rigor
5. **Human Tone**: Preserve the authentic human voice while maintaining all content

Critical: DO NOT remove any content. Restore and emphasize all key theories, breakthroughs, and discoveries. The final version should have both the human touch AND the full intellectual depth.

Here is the current speech content:

{speech_content}"""

            response_5 = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt_5}
                ],
                temperature=0.7,
                max_tokens=4000,
            )
            
            # Validate final response
            if not response_5.choices or not response_5.choices[0].message:
                raise ServiceNotAvailableException("Empty response from OpenAI API in Prompt 5")
            
            final_speech = response_5.choices[0].message.content
            if not final_speech or not final_speech.strip():
                raise ServiceNotAvailableException("Empty final speech content from OpenAI API")
            
            final_speech = final_speech.strip()
            logger.info(f"Successfully generated speech for topic: {topic} (length: {len(final_speech)} chars)")
            
            return final_speech
            
        except ServiceNotAvailableException:
            raise
        except ValidationException:
            raise
        except Exception as e:
            logger.error(f"Error generating speech: {e}", exc_info=True)
            raise ServiceNotAvailableException(f"Failed to generate speech: {str(e)}")
    
    def is_available(self) -> bool:
        """Check if the speech service is available."""
        return self.client is not None


# Create singleton instance
speech_service = SpeechService()

