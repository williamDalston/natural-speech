"""
Poems Service Module
Handles CRUD operations for user-created poems.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from database import Poem, get_db
from logger_config import logger


class PoemsService:
    """Service for managing poems"""
    
    def get_all_poems(self, db: Session, skip: int = 0, limit: int = 100) -> List[Poem]:
        """Get all poems, ordered by most recent first."""
        return db.query(Poem).order_by(desc(Poem.created_at)).offset(skip).limit(limit).all()
    
    def get_poem_by_id(self, db: Session, poem_id: int) -> Optional[Poem]:
        """Get a single poem by ID."""
        return db.query(Poem).filter(Poem.id == poem_id).first()
    
    def get_poems_by_style(self, db: Session, style: str, skip: int = 0, limit: int = 100) -> List[Poem]:
        """Get poems by style."""
        return db.query(Poem).filter(Poem.style.ilike(f"%{style}%")).order_by(desc(Poem.created_at)).offset(skip).limit(limit).all()
    
    def create_poem(
        self,
        db: Session,
        title: Optional[str],
        content: str,
        style: Optional[str] = None,
        audio_url: Optional[str] = None
    ) -> Poem:
        """Create a new poem."""
        poem = Poem(
            title=title,
            content=content,
            style=style,
            audio_url=audio_url
        )
        db.add(poem)
        db.commit()
        db.refresh(poem)
        logger.info(f"Created poem with ID {poem.id}, style: {style}")
        return poem
    
    def update_poem(
        self,
        db: Session,
        poem_id: int,
        title: Optional[str] = None,
        content: Optional[str] = None,
        style: Optional[str] = None,
        audio_url: Optional[str] = None
    ) -> Optional[Poem]:
        """Update an existing poem."""
        poem = db.query(Poem).filter(Poem.id == poem_id).first()
        if not poem:
            return None
        
        if title is not None:
            poem.title = title
        if content is not None:
            poem.content = content
        if style is not None:
            poem.style = style
        if audio_url is not None:
            poem.audio_url = audio_url
        
        poem.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(poem)
        logger.info(f"Updated poem with ID {poem_id}")
        return poem
    
    def delete_poem(self, db: Session, poem_id: int) -> bool:
        """Delete a poem."""
        poem = db.query(Poem).filter(Poem.id == poem_id).first()
        if not poem:
            return False
        
        db.delete(poem)
        db.commit()
        logger.info(f"Deleted poem with ID {poem_id}")
        return True
    
    def search_poems(
        self,
        db: Session,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Poem]:
        """Search poems by title, content, or style."""
        search_term = f"%{query}%"
        return db.query(Poem).filter(
            (Poem.title.ilike(search_term)) |
            (Poem.content.ilike(search_term)) |
            (Poem.style.ilike(search_term))
        ).order_by(desc(Poem.created_at)).offset(skip).limit(limit).all()
    
    def get_poems_count(self, db: Session) -> int:
        """Get total count of poems."""
        return db.query(Poem).count()


# Create singleton instance
poems_service = PoemsService()

