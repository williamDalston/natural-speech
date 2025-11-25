"""
Speeches Service Module
Handles CRUD operations for practice speeches.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from database import Speech, get_db
from logger_config import logger


class SpeechesService:
    """Service for managing speeches"""
    
    def get_all_speeches(self, db: Session, skip: int = 0, limit: int = 100) -> List[Speech]:
        """Get all speeches, ordered by most recent first."""
        return db.query(Speech).order_by(desc(Speech.created_at)).offset(skip).limit(limit).all()
    
    def get_speech_by_id(self, db: Session, speech_id: int) -> Optional[Speech]:
        """Get a single speech by ID."""
        return db.query(Speech).filter(Speech.id == speech_id).first()
    
    def get_speeches_by_topic(self, db: Session, topic: str, skip: int = 0, limit: int = 100) -> List[Speech]:
        """Get speeches by topic."""
        return db.query(Speech).filter(Speech.topic.ilike(f"%{topic}%")).order_by(desc(Speech.created_at)).offset(skip).limit(limit).all()
    
    def create_speech(
        self,
        db: Session,
        topic: str,
        content: str
    ) -> Speech:
        """Create a new speech."""
        speech = Speech(
            topic=topic,
            content=content
        )
        db.add(speech)
        db.commit()
        db.refresh(speech)
        logger.info(f"Created speech with ID {speech.id} for topic: {topic}")
        return speech
    
    def delete_speech(self, db: Session, speech_id: int) -> bool:
        """Delete a speech."""
        speech = db.query(Speech).filter(Speech.id == speech_id).first()
        if not speech:
            return False
        
        db.delete(speech)
        db.commit()
        logger.info(f"Deleted speech with ID {speech_id}")
        return True
    
    def search_speeches(
        self,
        db: Session,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Speech]:
        """Search speeches by topic or content."""
        search_term = f"%{query}%"
        return db.query(Speech).filter(
            (Speech.topic.ilike(search_term)) |
            (Speech.content.ilike(search_term))
        ).order_by(desc(Speech.created_at)).offset(skip).limit(limit).all()
    
    def get_speeches_count(self, db: Session) -> int:
        """Get total count of speeches."""
        return db.query(Speech).count()


# Create singleton instance
speeches_service = SpeechesService()

