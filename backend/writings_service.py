"""
Writings Service Module
Handles CRUD operations for wonderful writings.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_
from datetime import datetime, date
from database import Writing, get_db
from logger_config import logger


class WritingsService:
    """Service for managing writings"""
    
    def get_all_writings(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        category: Optional[str] = None,
        genre: Optional[str] = None,
        author: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        min_word_count: Optional[int] = None,
        max_word_count: Optional[int] = None
    ) -> List[Writing]:
        """
        Get all writings, ordered by most recent first. 
        Can filter by category, genre, author, date range, and word count.
        """
        return self.search_writings(
            db=db,
            query=None,
            skip=skip,
            limit=limit,
            author=author,
            genre=genre,
            category=category,
            start_date=start_date,
            end_date=end_date,
            min_word_count=min_word_count,
            max_word_count=max_word_count
        )
    
    def get_writing_by_id(self, db: Session, writing_id: int) -> Optional[Writing]:
        """Get a single writing by ID."""
        return db.query(Writing).filter(Writing.id == writing_id).first()
    
    def create_writing(
        self,
        db: Session,
        title: Optional[str],
        content: str,
        author: Optional[str],
        category: str = "user",
        genre: Optional[str] = None
    ) -> Writing:
        """Create a new writing."""
        writing = Writing(
            title=title,
            content=content,
            author=author,
            category=category,
            genre=genre
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
        query: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        author: Optional[str] = None,
        genre: Optional[str] = None,
        category: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        min_word_count: Optional[int] = None,
        max_word_count: Optional[int] = None
    ) -> List[Writing]:
        """
        Advanced search writings with multiple filters.
        Supports search by text, author, genre, date range, and word count.
        """
        query_obj = db.query(Writing)
        
        # Text search (title, content, or author)
        if query:
            search_term = f"%{query}%"
            query_obj = query_obj.filter(
                (Writing.title.ilike(search_term)) |
                (Writing.content.ilike(search_term)) |
                (Writing.author.ilike(search_term))
            )
        
        # Author filter
        if author:
            query_obj = query_obj.filter(Writing.author.ilike(f"%{author}%"))
        
        # Genre filter
        if genre:
            query_obj = query_obj.filter(Writing.genre == genre)
        
        # Category filter
        if category:
            query_obj = query_obj.filter(Writing.category == category)
        
        # Date range filter
        if start_date:
            query_obj = query_obj.filter(Writing.created_at >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query_obj = query_obj.filter(Writing.created_at <= datetime.combine(end_date, datetime.max.time()))
        
        # Word count filter (calculate word count from content)
        if min_word_count is not None or max_word_count is not None:
            # Get all writings first, then filter by word count in Python
            # (SQLite doesn't have great text processing functions)
            all_writings = query_obj.all()
            filtered_writings = []
            for writing in all_writings:
                word_count = len(writing.content.split()) if writing.content else 0
                if min_word_count is not None and word_count < min_word_count:
                    continue
                if max_word_count is not None and word_count > max_word_count:
                    continue
                filtered_writings.append(writing)
            # Sort and paginate
            filtered_writings.sort(key=lambda w: w.created_at, reverse=True)
            return filtered_writings[skip:skip + limit]
        
        return query_obj.order_by(desc(Writing.created_at)).offset(skip).limit(limit).all()
    
    def get_writings_count(self, db: Session, category: Optional[str] = None, genre: Optional[str] = None) -> int:
        """Get total count of writings. Can filter by category and genre."""
        query = db.query(Writing)
        if category:
            query = query.filter(Writing.category == category)
        if genre:
            query = query.filter(Writing.genre == genre)
        return query.count()
    
    def get_curated_writings(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        genre: Optional[str] = None
    ) -> List[Writing]:
        """Get curated amazing writings."""
        return self.get_all_writings(db, skip, limit, category="curated", genre=genre)
    
    def get_genres(self, db: Session, category: Optional[str] = None) -> List[str]:
        """Get list of unique genres. Can filter by category."""
        query = db.query(Writing.genre).distinct()
        if category:
            query = query.filter(Writing.category == category)
        genres = [g[0] for g in query.all() if g[0] is not None]
        return sorted(genres)


# Create singleton instance
writings_service = WritingsService()

