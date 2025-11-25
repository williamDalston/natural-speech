"""
Writings Service Module
Handles CRUD operations for wonderful writings.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from database import Writing, get_db
from logger_config import logger


class WritingsService:
    """Service for managing writings"""
    
    def get_all_writings(self, db: Session, skip: int = 0, limit: int = 100) -> List[Writing]:
        """Get all writings, ordered by most recent first."""
        return db.query(Writing).order_by(desc(Writing.created_at)).offset(skip).limit(limit).all()
    
    def get_writing_by_id(self, db: Session, writing_id: int) -> Optional[Writing]:
        """Get a single writing by ID."""
        return db.query(Writing).filter(Writing.id == writing_id).first()
    
    def create_writing(
        self,
        db: Session,
        title: Optional[str],
        content: str,
        author: Optional[str]
    ) -> Writing:
        """Create a new writing."""
        writing = Writing(
            title=title,
            content=content,
            author=author
        )
        db.add(writing)
        db.commit()
        db.refresh(writing)
        logger.info(f"Created writing with ID {writing.id}")
        return writing
    
    def update_writing(
        self,
        db: Session,
        writing_id: int,
        title: Optional[str] = None,
        content: Optional[str] = None,
        author: Optional[str] = None
    ) -> Optional[Writing]:
        """Update an existing writing."""
        writing = db.query(Writing).filter(Writing.id == writing_id).first()
        if not writing:
            return None
        
        if title is not None:
            writing.title = title
        if content is not None:
            writing.content = content
        if author is not None:
            writing.author = author
        
        writing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(writing)
        logger.info(f"Updated writing with ID {writing.id}")
        return writing
    
    def delete_writing(self, db: Session, writing_id: int) -> bool:
        """Delete a writing."""
        writing = db.query(Writing).filter(Writing.id == writing_id).first()
        if not writing:
            return False
        
        db.delete(writing)
        db.commit()
        logger.info(f"Deleted writing with ID {writing_id}")
        return True
    
    def search_writings(
        self,
        db: Session,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Writing]:
        """Search writings by title, content, or author."""
        search_term = f"%{query}%"
        return db.query(Writing).filter(
            (Writing.title.ilike(search_term)) |
            (Writing.content.ilike(search_term)) |
            (Writing.author.ilike(search_term))
        ).order_by(desc(Writing.created_at)).offset(skip).limit(limit).all()
    
    def get_writings_count(self, db: Session) -> int:
        """Get total count of writings."""
        return db.query(Writing).count()


# Create singleton instance
writings_service = WritingsService()

