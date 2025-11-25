"""
Statistics Service

This module provides:
- Daily statistics tracking and aggregation
- Weekly/monthly statistics calculation
- Goal tracking and progress calculation
- Streak calculation
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from datetime import datetime, timedelta, date
from typing import Dict, Any, Optional, List
import json

from database import DailyStatistics, UserGoal, Writing, Speech, Poem, Job
from logger_config import logger


class StatisticsService:
    """Service for managing user statistics and goals."""
    
    @staticmethod
    def _get_today_date() -> datetime:
        """Get today's date at midnight UTC."""
        today = datetime.utcnow().date()
        return datetime.combine(today, datetime.min.time())
    
    @staticmethod
    def _get_or_create_daily_stats(db: Session, target_date: Optional[datetime] = None) -> DailyStatistics:
        """Get or create daily statistics for a given date."""
        if target_date is None:
            target_date = StatisticsService._get_today_date()
        
        # Ensure we're using the date part only (midnight)
        if isinstance(target_date, datetime):
            target_date = datetime.combine(target_date.date(), datetime.min.time())
        
        stats = db.query(DailyStatistics).filter(
            func.date(DailyStatistics.date) == target_date.date()
        ).first()
        
        if not stats:
            stats = DailyStatistics(date=target_date)
            db.add(stats)
            db.commit()
            db.refresh(stats)
            logger.debug(f"Created daily statistics for {target_date.date()}")
        
        return stats
    
    @staticmethod
    def _calculate_word_count(text: str) -> int:
        """Calculate word count from text."""
        if not text:
            return 0
        # Simple word count - split by whitespace
        return len(text.split())
    
    @staticmethod
    def increment_writing_created(db: Session, word_count: int = 0) -> None:
        """Increment writing created count and update word count."""
        stats = StatisticsService._get_or_create_daily_stats(db)
        stats.writings_created += 1
        stats.total_words_written += word_count
        stats.updated_at = datetime.utcnow()
        db.commit()
        logger.debug(f"Incremented writings_created, new count: {stats.writings_created}")
    
    @staticmethod
    def increment_speech_practiced(db: Session) -> None:
        """Increment speech practiced count."""
        stats = StatisticsService._get_or_create_daily_stats(db)
        stats.speeches_practiced += 1
        stats.updated_at = datetime.utcnow()
        db.commit()
        logger.debug(f"Incremented speeches_practiced, new count: {stats.speeches_practiced}")
    
    @staticmethod
    def increment_poem_created(db: Session, word_count: int = 0) -> None:
        """Increment poem created count and update word count."""
        stats = StatisticsService._get_or_create_daily_stats(db)
        stats.poems_created += 1
        stats.total_words_written += word_count
        stats.updated_at = datetime.utcnow()
        db.commit()
        logger.debug(f"Incremented poems_created, new count: {stats.poems_created}")
    
    @staticmethod
    def increment_conversation_completed(db: Session) -> None:
        """Increment conversation completed count."""
        stats = StatisticsService._get_or_create_daily_stats(db)
        stats.conversations_completed += 1
        stats.updated_at = datetime.utcnow()
        db.commit()
        logger.debug(f"Incremented conversations_completed, new count: {stats.conversations_completed}")
    
    @staticmethod
    def add_audio_minutes(db: Session, minutes: float) -> None:
        """Add audio minutes listened."""
        if minutes <= 0:
            return
        stats = StatisticsService._get_or_create_daily_stats(db)
        stats.audio_minutes_listened += minutes
        stats.updated_at = datetime.utcnow()
        db.commit()
        logger.debug(f"Added {minutes} minutes of audio, total: {stats.audio_minutes_listened}")
    
    @staticmethod
    def get_daily_stats(db: Session, target_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Get daily statistics for a specific date."""
        if target_date is None:
            target_date = StatisticsService._get_today_date()
        
        # Ensure we're using the date part only
        if isinstance(target_date, datetime):
            target_date = datetime.combine(target_date.date(), datetime.min.time())
        
        stats = db.query(DailyStatistics).filter(
            func.date(DailyStatistics.date) == target_date.date()
        ).first()
        
        if not stats:
            # Return empty stats if no record exists
            return {
                "date": target_date.date().isoformat(),
                "writings_created": 0,
                "speeches_practiced": 0,
                "poems_created": 0,
                "conversations_completed": 0,
                "audio_minutes_listened": 0.0,
                "total_words_written": 0
            }
        
        return {
            "date": stats.date.date().isoformat(),
            "writings_created": stats.writings_created,
            "speeches_practiced": stats.speeches_practiced,
            "poems_created": stats.poems_created,
            "conversations_completed": stats.conversations_completed,
            "audio_minutes_listened": round(stats.audio_minutes_listened, 2),
            "total_words_written": stats.total_words_written
        }
    
    @staticmethod
    def get_weekly_stats(db: Session, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Get weekly statistics (last 7 days)."""
        if end_date is None:
            end_date = StatisticsService._get_today_date()
        
        start_date = end_date - timedelta(days=6)  # Include today, so 7 days total
        
        stats = db.query(DailyStatistics).filter(
            and_(
                DailyStatistics.date >= start_date,
                DailyStatistics.date <= end_date
            )
        ).all()
        
        # Aggregate statistics
        total_writings = sum(s.writings_created for s in stats)
        total_speeches = sum(s.speeches_practiced for s in stats)
        total_poems = sum(s.poems_created for s in stats)
        total_conversations = sum(s.conversations_completed for s in stats)
        total_audio_minutes = sum(s.audio_minutes_listened for s in stats)
        total_words = sum(s.total_words_written for s in stats)
        
        # Daily breakdown
        daily_breakdown = [
            {
                "date": s.date.date().isoformat(),
                "writings_created": s.writings_created,
                "speeches_practiced": s.speeches_practiced,
                "poems_created": s.poems_created,
                "conversations_completed": s.conversations_completed,
                "audio_minutes_listened": round(s.audio_minutes_listened, 2),
                "total_words_written": s.total_words_written
            }
            for s in stats
        ]
        
        return {
            "period": "weekly",
            "start_date": start_date.date().isoformat(),
            "end_date": end_date.date().isoformat(),
            "total_writings_created": total_writings,
            "total_speeches_practiced": total_speeches,
            "total_poems_created": total_poems,
            "total_conversations_completed": total_conversations,
            "total_audio_minutes_listened": round(total_audio_minutes, 2),
            "total_words_written": total_words,
            "daily_breakdown": daily_breakdown
        }
    
    @staticmethod
    def get_monthly_stats(db: Session, target_month: Optional[int] = None, target_year: Optional[int] = None) -> Dict[str, Any]:
        """Get monthly statistics for a specific month."""
        now = datetime.utcnow()
        if target_month is None:
            target_month = now.month
        if target_year is None:
            target_year = now.year
        
        start_date = datetime(target_year, target_month, 1)
        # Get last day of month
        if target_month == 12:
            end_date = datetime(target_year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(target_year, target_month + 1, 1) - timedelta(days=1)
        
        end_date = datetime.combine(end_date.date(), datetime.max.time())
        
        stats = db.query(DailyStatistics).filter(
            and_(
                DailyStatistics.date >= start_date,
                DailyStatistics.date <= end_date
            )
        ).all()
        
        # Aggregate statistics
        total_writings = sum(s.writings_created for s in stats)
        total_speeches = sum(s.speeches_practiced for s in stats)
        total_poems = sum(s.poems_created for s in stats)
        total_conversations = sum(s.conversations_completed for s in stats)
        total_audio_minutes = sum(s.audio_minutes_listened for s in stats)
        total_words = sum(s.total_words_written for s in stats)
        
        # Weekly breakdown
        weekly_breakdown = []
        current_week_start = start_date
        while current_week_start <= end_date:
            week_end = min(current_week_start + timedelta(days=6), end_date)
            week_stats = db.query(DailyStatistics).filter(
                and_(
                    DailyStatistics.date >= current_week_start,
                    DailyStatistics.date <= week_end
                )
            ).all()
            
            weekly_breakdown.append({
                "week_start": current_week_start.date().isoformat(),
                "week_end": week_end.date().isoformat(),
                "writings_created": sum(s.writings_created for s in week_stats),
                "speeches_practiced": sum(s.speeches_practiced for s in week_stats),
                "poems_created": sum(s.poems_created for s in week_stats),
                "conversations_completed": sum(s.conversations_completed for s in week_stats),
                "audio_minutes_listened": round(sum(s.audio_minutes_listened for s in week_stats), 2),
                "total_words_written": sum(s.total_words_written for s in week_stats)
            })
            
            current_week_start = week_end + timedelta(days=1)
        
        return {
            "period": "monthly",
            "month": target_month,
            "year": target_year,
            "start_date": start_date.date().isoformat(),
            "end_date": end_date.date().isoformat(),
            "total_writings_created": total_writings,
            "total_speeches_practiced": total_speeches,
            "total_poems_created": total_poems,
            "total_conversations_completed": total_conversations,
            "total_audio_minutes_listened": round(total_audio_minutes, 2),
            "total_words_written": total_words,
            "weekly_breakdown": weekly_breakdown
        }
    
    @staticmethod
    def calculate_streak(db: Session) -> int:
        """Calculate consecutive days with activity."""
        today = StatisticsService._get_today_date().date()
        streak = 0
        current_date = today
        
        while True:
            # Check if there's any activity on this date
            stats = db.query(DailyStatistics).filter(
                func.date(DailyStatistics.date) == current_date
            ).first()
            
            if stats and (
                stats.writings_created > 0 or
                stats.speeches_practiced > 0 or
                stats.poems_created > 0 or
                stats.conversations_completed > 0
            ):
                streak += 1
                current_date -= timedelta(days=1)
            elif current_date == today:
                # No activity today, but check if yesterday had activity (partial day)
                # For today, allow zero activity
                current_date -= timedelta(days=1)
                continue
            else:
                break
        
        return streak
    
    @staticmethod
    def get_all_goals(db: Session, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get all user goals."""
        query = db.query(UserGoal)
        if active_only:
            query = query.filter(UserGoal.is_active == True)
        
        goals = query.all()
        return [
            {
                "id": goal.id,
                "goal_type": goal.goal_type,
                "target_value": goal.target_value,
                "current_value": goal.current_value,
                "period": goal.period,
                "is_active": goal.is_active,
                "progress_percentage": min(100, int((goal.current_value / goal.target_value * 100))) if goal.target_value > 0 else 0,
                "created_at": goal.created_at.isoformat() if goal.created_at else None,
                "updated_at": goal.updated_at.isoformat() if goal.updated_at else None
            }
            for goal in goals
        ]
    
    @staticmethod
    def create_goal(db: Session, goal_type: str, target_value: int, period: str = "daily") -> UserGoal:
        """Create a new user goal."""
        goal = UserGoal(
            goal_type=goal_type,
            target_value=target_value,
            period=period,
            current_value=0,
            is_active=True
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        logger.info(f"Created goal: {goal_type} {target_value} ({period})")
        return goal
    
    @staticmethod
    def update_goal(db: Session, goal_id: int, target_value: Optional[int] = None, 
                   is_active: Optional[bool] = None) -> Optional[UserGoal]:
        """Update a user goal."""
        goal = db.query(UserGoal).filter(UserGoal.id == goal_id).first()
        if not goal:
            return None
        
        if target_value is not None:
            goal.target_value = target_value
        if is_active is not None:
            goal.is_active = is_active
        
        goal.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def delete_goal(db: Session, goal_id: int) -> bool:
        """Delete a user goal."""
        goal = db.query(UserGoal).filter(UserGoal.id == goal_id).first()
        if not goal:
            return False
        
        db.delete(goal)
        db.commit()
        logger.info(f"Deleted goal {goal_id}")
        return True
    
    @staticmethod
    def update_goal_progress(db: Session) -> None:
        """Update progress for all active goals based on current statistics."""
        today_stats = StatisticsService.get_daily_stats(db)
        
        goals = db.query(UserGoal).filter(UserGoal.is_active == True).all()
        
        for goal in goals:
            if goal.period == "daily":
                # Update based on today's stats
                if goal.goal_type == "words":
                    goal.current_value = today_stats["total_words_written"]
                elif goal.goal_type == "writings":
                    goal.current_value = today_stats["writings_created"]
                elif goal.goal_type == "speeches":
                    goal.current_value = today_stats["speeches_practiced"]
                elif goal.goal_type == "poems":
                    goal.current_value = today_stats["poems_created"]
                elif goal.goal_type == "conversations":
                    goal.current_value = today_stats["conversations_completed"]
                
                goal.updated_at = datetime.utcnow()
        
        db.commit()


# Create singleton instance
statistics_service = StatisticsService()

