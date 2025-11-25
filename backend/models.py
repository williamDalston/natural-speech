"""
Pydantic models for request/response validation.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
import re


class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: bool = True
    error_code: str
    message: str
    detail: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "error": True,
                "error_code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "detail": "Text cannot be empty"
            }
        }


class TTSRequest(BaseModel):
    """Request model for text-to-speech generation."""
    text: str = Field(..., min_length=1, description="Text to convert to speech (supports text of any length)")
    voice: str = Field(default="af_bella", description="Voice identifier to use")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed multiplier (0.5-2.0)")

    @validator('text')
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError("Text cannot be empty or only whitespace")
        return v.strip()

    @validator('speed')
    def validate_speed(cls, v):
        if not isinstance(v, (int, float)):
            raise ValueError("Speed must be a number")
        if v < 0.5 or v > 2.0:
            raise ValueError("Speed must be between 0.5 and 2.0")
        return float(v)

    class Config:
        schema_extra = {
            "example": {
                "text": "Hello, this is a test of the text-to-speech system.",
                "voice": "af_bella",
                "speed": 1.0
            }
        }


class WritingCreate(BaseModel):
    """Request model for creating a new writing."""
    title: Optional[str] = Field(None, max_length=200, description="Optional title for the writing")
    content: str = Field(..., min_length=1, max_length=50000, description="The text content")
    author: Optional[str] = Field(None, max_length=200, description="Optional author name")

    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError("Content cannot be empty or only whitespace")
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "title": "A Beautiful Poem",
                "content": "The sun sets in the west, painting the sky with hues of orange and pink...",
                "author": "Anonymous"
            }
        }


class WritingUpdate(BaseModel):
    """Request model for updating a writing."""
    title: Optional[str] = Field(None, max_length=200, description="Optional title for the writing")
    content: Optional[str] = Field(None, min_length=1, max_length=50000, description="The text content")
    author: Optional[str] = Field(None, max_length=200, description="Optional author name")

    @validator('content')
    def validate_content(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError("Content cannot be empty or only whitespace")
        return v.strip() if v else v


class WritingResponse(BaseModel):
    """Response model for a writing."""
    id: int
    title: Optional[str]
    content: str
    author: Optional[str]
    category: Optional[str] = "user"
    genre: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": 1,
                "title": "A Beautiful Poem",
                "content": "The sun sets in the west...",
                "author": "Anonymous",
                "category": "curated",
                "genre": "Poetry",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }


class WritingsListResponse(BaseModel):
    """Response model for a list of writings."""
    writings: list[WritingResponse]
    count: int


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    timestamp: str
    version: str = "1.0.0"

    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2024-01-01T00:00:00Z",
                "version": "1.0.0"
            }
        }


class StatusResponse(BaseModel):
    """Service status response model."""
    status: str
    services: dict
    timestamp: str

    class Config:
        schema_extra = {
            "example": {
                "status": "operational",
                "services": {
                    "tts": "available",
                    "avatar": "available"
                },
                "timestamp": "2024-01-01T00:00:00Z"
            }
        }


class VoicesResponse(BaseModel):
    """Response model for available voices."""
    voices: list[str]
    count: int

    class Config:
        schema_extra = {
            "example": {
                "voices": ["af_bella", "af_sarah", "am_michael"],
                "count": 3
            }
        }


class ConversationPromptRequest(BaseModel):
    """Request model for generating conversation practice prompts."""
    topic: str = Field(..., min_length=1, max_length=200, description="Topic to practice speaking about")
    count: int = Field(default=5, ge=1, le=10, description="Number of prompts to generate (1-10)")

    @validator('topic')
    def validate_topic(cls, v):
        if not v or not v.strip():
            raise ValueError("Topic cannot be empty or only whitespace")
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "topic": "climate change",
                "count": 5
            }
        }


class ConversationPrompt(BaseModel):
    """Model for a single conversation prompt."""
    question: str = Field(..., description="The conversation prompt question")
    context: str = Field(..., description="Context about the topic")


class ConversationPromptsResponse(BaseModel):
    """Response model for conversation prompts."""
    prompts: list[ConversationPrompt]
    topic: str
    count: int


class InteractiveConversationStartRequest(BaseModel):
    """Request model for starting an interactive conversation."""
    topic: str = Field(..., min_length=1, max_length=200, description="Topic to practice discussing")
    voice: str = Field(default="af_bella", description="Voice identifier for TTS responses")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed multiplier (0.5-2.0)")

    @validator('topic')
    def validate_topic(cls, v):
        if not v or not v.strip():
            raise ValueError("Topic cannot be empty or only whitespace")
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "topic": "climate change",
                "voice": "af_bella",
                "speed": 1.0
            }
        }


class ConversationMessage(BaseModel):
    """Model for a single conversation message."""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class InteractiveConversationContinueRequest(BaseModel):
    """Request model for continuing an interactive conversation."""
    topic: str = Field(..., min_length=1, max_length=200, description="Topic being discussed")
    user_message: str = Field(..., min_length=1, description="User's message")
    conversation_history: list[ConversationMessage] = Field(default_factory=list, description="Previous conversation messages")
    voice: str = Field(default="af_bella", description="Voice identifier for TTS responses")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed multiplier (0.5-2.0)")

    @validator('topic')
    def validate_topic(cls, v):
        if not v or not v.strip():
            raise ValueError("Topic cannot be empty or only whitespace")
        return v.strip()

    @validator('user_message')
    def validate_user_message(cls, v):
        if not v or not v.strip():
            raise ValueError("User message cannot be empty or only whitespace")
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "topic": "climate change",
                "user_message": "I think renewable energy is the key to solving climate change.",
                "conversation_history": [],
                "voice": "af_bella",
                "speed": 1.0
            }
        }


class InteractiveConversationResponse(BaseModel):
    """Response model for interactive conversation."""
    message: str = Field(..., description="AI's text response")
    topic: str = Field(..., description="The conversation topic")
    audio_url: Optional[str] = Field(None, description="URL or base64 audio data for the voice response")


class SpeechCreate(BaseModel):
    """Request model for creating a new speech."""
    topic: str = Field(..., min_length=1, max_length=200, description="Topic for the speech")

    @validator('topic')
    def validate_topic(cls, v):
        if not v or not v.strip():
            raise ValueError("Topic cannot be empty or only whitespace")
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "topic": "Quantum Mechanics"
            }
        }


class SpeechResponse(BaseModel):
    """Response model for a speech."""
    id: int
    topic: str
    content: str
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": 1,
                "topic": "Quantum Mechanics",
                "content": "Imagine standing at the edge of a quantum realm...",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }


class SpeechesListResponse(BaseModel):
    """Response model for a list of speeches."""
    speeches: list[SpeechResponse]
    count: int


class RhetoricalDevicePracticeRequest(BaseModel):
    """Request model for rhetorical device practice."""
    topic: str = Field(..., min_length=1, max_length=200, description="Topic to practice writing about")
    devices: list[str] = Field(..., min_items=1, max_items=10, description="List of rhetorical devices to practice")
    count: int = Field(default=3, ge=1, le=10, description="Number of practice prompts to generate (1-10)")

    @validator('topic')
    def validate_topic(cls, v):
        if not v or not v.strip():
            raise ValueError("Topic cannot be empty or only whitespace")
        return v.strip()

    @validator('devices')
    def validate_devices(cls, v):
        if not v or len(v) == 0:
            raise ValueError("At least one rhetorical device must be selected")
        return [d.strip() for d in v if d.strip()]

    class Config:
        schema_extra = {
            "example": {
                "topic": "climate change",
                "devices": ["Alliteration", "Anaphora", "Metaphor"],
                "count": 3
            }
        }


class RhetoricalDevicePrompt(BaseModel):
    """Model for a single rhetorical device practice prompt."""
    prompt: str = Field(..., description="The practice prompt or instruction")
    devices: list[str] = Field(..., description="List of rhetorical devices to use in this prompt")
    examples: Optional[str] = Field(None, description="Optional examples of the devices")


class RhetoricalDevicePracticeResponse(BaseModel):
    """Response model for rhetorical device practice prompts."""
    prompts: list[RhetoricalDevicePrompt]
    topic: str
    devices: list[str]
    count: int


class PoemCreate(BaseModel):
    """Request model for creating a new poem."""
    title: Optional[str] = Field(None, max_length=200, description="Optional title for the poem")
    content: str = Field(..., min_length=1, max_length=10000, description="The poem content")
    style: Optional[str] = Field(None, max_length=100, description="Poetry style (e.g., Haiku, Sonnet, Free Verse)")
    audio_url: Optional[str] = Field(None, description="Base64 encoded audio data or file path")

    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError("Content cannot be empty or only whitespace")
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "title": "A Beautiful Day",
                "content": "The sun rises in the east,\nPainting the sky with golden light,\nA new day begins.",
                "style": "Haiku",
                "audio_url": None
            }
        }


class PoemUpdate(BaseModel):
    """Request model for updating a poem."""
    title: Optional[str] = Field(None, max_length=200, description="Optional title for the poem")
    content: Optional[str] = Field(None, min_length=1, max_length=10000, description="The poem content")
    style: Optional[str] = Field(None, max_length=100, description="Poetry style")
    audio_url: Optional[str] = Field(None, description="Base64 encoded audio data or file path")

    @validator('content')
    def validate_content(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError("Content cannot be empty or only whitespace")
        return v.strip() if v else v


class PoemResponse(BaseModel):
    """Response model for a poem."""
    id: int
    title: Optional[str]
    content: str
    style: Optional[str]
    audio_url: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": 1,
                "title": "A Beautiful Day",
                "content": "The sun rises in the east...",
                "style": "Haiku",
                "audio_url": None,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }


class PoemsListResponse(BaseModel):
    """Response model for a list of poems."""
    poems: list[PoemResponse]
    count: int


class PoetryStylesResponse(BaseModel):
    """Response model for available poetry styles."""
    styles: list[dict]
    count: int

    class Config:
        schema_extra = {
            "example": {
                "styles": [
                    {"name": "Haiku", "description": "A 3-line poem with 5-7-5 syllable pattern"},
                    {"name": "Sonnet", "description": "A 14-line poem with a specific rhyme scheme"}
                ],
                "count": 2
            }
        }


class DailyStatisticsResponse(BaseModel):
    """Response model for daily statistics."""
    date: str
    writings_created: int
    speeches_practiced: int
    poems_created: int
    conversations_completed: int
    audio_minutes_listened: float
    total_words_written: int


class WeeklyStatisticsResponse(BaseModel):
    """Response model for weekly statistics."""
    period: str
    start_date: str
    end_date: str
    total_writings_created: int
    total_speeches_practiced: int
    total_poems_created: int
    total_conversations_completed: int
    total_audio_minutes_listened: float
    total_words_written: int
    daily_breakdown: list[dict]


class MonthlyStatisticsResponse(BaseModel):
    """Response model for monthly statistics."""
    period: str
    month: int
    year: int
    start_date: str
    end_date: str
    total_writings_created: int
    total_speeches_practiced: int
    total_poems_created: int
    total_conversations_completed: int
    total_audio_minutes_listened: float
    total_words_written: int
    weekly_breakdown: list[dict]


class UserGoalCreate(BaseModel):
    """Request model for creating a user goal."""
    goal_type: str = Field(..., description="Type of goal: 'words', 'writings', 'speeches', 'poems', 'conversations'")
    target_value: int = Field(..., ge=1, description="Target value for the goal")
    period: str = Field(default="daily", description="Goal period: 'daily', 'weekly', 'monthly'")

    @validator('goal_type')
    def validate_goal_type(cls, v):
        valid_types = ['words', 'writings', 'speeches', 'poems', 'conversations']
        if v not in valid_types:
            raise ValueError(f"Goal type must be one of: {', '.join(valid_types)}")
        return v

    @validator('period')
    def validate_period(cls, v):
        valid_periods = ['daily', 'weekly', 'monthly']
        if v not in valid_periods:
            raise ValueError(f"Period must be one of: {', '.join(valid_periods)}")
        return v


class UserGoalUpdate(BaseModel):
    """Request model for updating a user goal."""
    target_value: Optional[int] = Field(None, ge=1, description="Target value for the goal")
    is_active: Optional[bool] = Field(None, description="Whether the goal is active")


class UserGoalResponse(BaseModel):
    """Response model for a user goal."""
    id: int
    goal_type: str
    target_value: int
    current_value: int
    period: str
    is_active: bool
    progress_percentage: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class UserGoalsListResponse(BaseModel):
    """Response model for a list of user goals."""
    goals: list[UserGoalResponse]
    count: int


class StreakResponse(BaseModel):
    """Response model for streak information."""
    streak_days: int
    last_activity_date: Optional[str] = None


class StatisticsSummaryResponse(BaseModel):
    """Response model for statistics summary."""
    streak: StreakResponse
    today_stats: DailyStatisticsResponse
    weekly_stats: WeeklyStatisticsResponse
    goals: list[UserGoalResponse]

