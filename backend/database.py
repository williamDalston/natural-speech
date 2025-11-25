"""
Database models and setup for job tracking.

This module provides:
- Database models for jobs and writings
- Error handling with detailed logging
- Pipeline health tracking
- Database connection management with retry logic
- Comprehensive error context for debugging
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, event, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError, OperationalError, IntegrityError
from datetime import datetime
from typing import Optional, Dict, Any
import os
import time
import traceback
from contextlib import contextmanager

from config import settings
from logger_config import logger

Base = declarative_base()

# Database connection retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 1.0  # seconds

# Create engine with connection pooling and error handling
try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
        echo=settings.DEBUG,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,   # Recycle connections after 1 hour
    )
    logger.info(f"Database engine created successfully: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}", exc_info=True)
    raise

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Track database health
_db_health = {
    "status": "healthy",
    "last_error": None,
    "error_count": 0,
    "last_successful_operation": None,
    "connection_pool_size": 0,
    "active_connections": 0
}


class Job(Base):
    """Job tracking model for async operations."""
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True)
    job_type = Column(String)  # 'tts' or 'avatar'
    status = Column(String)  # 'pending', 'processing', 'completed', 'failed'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    result_path = Column(String, nullable=True)
    progress = Column(Float, default=0.0)  # 0.0 to 1.0
    metadata = Column(Text, nullable=True)  # JSON string for additional data


class Writing(Base):
    """Model for storing wonderful writings."""
    __tablename__ = "writings"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)  # Optional title
    content = Column(Text, nullable=False)  # The actual text content
    author = Column(String, nullable=True)  # Optional author name
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


@contextmanager
def get_db() -> Session:
    """
    Get database session with comprehensive error handling.
    
    Yields:
        Session: Database session
        
    Raises:
        OperationalError: If database connection fails after retries
        SQLAlchemyError: For other database errors
    """
    db = None
    retry_count = 0
    
    while retry_count < MAX_RETRIES:
        try:
            db = SessionLocal()
            # Test connection
            db.execute("SELECT 1")
            _db_health["status"] = "healthy"
            _db_health["last_successful_operation"] = datetime.utcnow().isoformat()
            _db_health["error_count"] = 0
            break
        except OperationalError as e:
            retry_count += 1
            _db_health["status"] = "degraded"
            _db_health["last_error"] = str(e)
            _db_health["error_count"] += 1
            
            if retry_count >= MAX_RETRIES:
                logger.error(f"Database connection failed after {MAX_RETRIES} retries: {e}", exc_info=True)
                if db:
                    db.close()
                raise
            else:
                logger.warning(f"Database connection failed (attempt {retry_count}/{MAX_RETRIES}), retrying...")
                time.sleep(RETRY_DELAY * retry_count)
        except Exception as e:
            logger.error(f"Unexpected database error: {e}", exc_info=True)
            if db:
                db.close()
            raise
    
    try:
        yield db
    except IntegrityError as e:
        db.rollback()
        error_msg = f"Database integrity error: {str(e)}"
        logger.error(error_msg, exc_info=True)
        _db_health["last_error"] = error_msg
        _db_health["error_count"] += 1
        raise
    except SQLAlchemyError as e:
        db.rollback()
        error_msg = f"Database error: {str(e)}"
        logger.error(error_msg, exc_info=True)
        _db_health["last_error"] = error_msg
        _db_health["error_count"] += 1
        raise
    except Exception as e:
        db.rollback()
        error_msg = f"Unexpected error in database session: {str(e)}"
        logger.error(error_msg, exc_info=True)
        _db_health["last_error"] = error_msg
        _db_health["error_count"] += 1
        raise
    finally:
        if db:
            try:
                db.close()
            except Exception as e:
                logger.warning(f"Error closing database session: {e}")


def get_db_health() -> Dict[str, Any]:
    """Get database health status."""
    try:
        # Get connection pool info
        pool = engine.pool
        _db_health["connection_pool_size"] = pool.size()
        _db_health["active_connections"] = pool.checkedout()
    except Exception as e:
        logger.warning(f"Could not get connection pool info: {e}")
    
    return _db_health.copy()


def create_job(db: Session, job_id: str, job_type: str, metadata: Optional[str] = None) -> Job:
    """
    Create a new job record with error handling.
    
    Args:
        db: Database session
        job_id: Unique job identifier
        job_type: Type of job ('tts' or 'avatar')
        metadata: Optional metadata as JSON string
        
    Returns:
        Job: Created job record
        
    Raises:
        IntegrityError: If job_id already exists
        SQLAlchemyError: For other database errors
    """
    try:
        job = Job(
            job_id=job_id,
            job_type=job_type,
            status="pending",
            metadata=metadata
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        logger.debug(f"Created job: {job_id} (type: {job_type})")
        return job
    except IntegrityError as e:
        db.rollback()
        error_msg = f"Job {job_id} already exists"
        logger.error(error_msg, exc_info=True)
        raise IntegrityError(error_msg, params=None, orig=e)
    except SQLAlchemyError as e:
        db.rollback()
        error_msg = f"Failed to create job {job_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise


def update_job_status(
    db: Session,
    job_id: str,
    status: str,
    progress: Optional[float] = None,
    error_message: Optional[str] = None,
    result_path: Optional[str] = None
) -> Optional[Job]:
    """
    Update job status with comprehensive error handling.
    
    Args:
        db: Database session
        job_id: Job identifier
        status: New status ('pending', 'processing', 'completed', 'failed')
        progress: Optional progress (0.0 to 1.0)
        error_message: Optional error message
        result_path: Optional path to result file
        
    Returns:
        Job: Updated job record, or None if not found
        
    Raises:
        SQLAlchemyError: For database errors
    """
    try:
        job = db.query(Job).filter(Job.job_id == job_id).first()
        if not job:
            logger.warning(f"Job {job_id} not found for status update")
            return None
        
        # Validate status
        valid_statuses = ["pending", "processing", "completed", "failed"]
        if status not in valid_statuses:
            logger.warning(f"Invalid status '{status}' for job {job_id}, using as-is")
        
        # Validate progress
        if progress is not None:
            if progress < 0.0 or progress > 1.0:
                logger.warning(f"Progress {progress} out of range [0.0, 1.0] for job {job_id}, clamping")
                progress = max(0.0, min(1.0, progress))
        
        job.status = status
        job.updated_at = datetime.utcnow()
        if progress is not None:
            job.progress = progress
        if error_message:
            # Truncate error message if too long
            max_error_length = 5000
            if len(error_message) > max_error_length:
                job.error_message = error_message[:max_error_length] + "... [truncated]"
                logger.warning(f"Error message truncated for job {job_id}")
            else:
                job.error_message = error_message
        if result_path:
            job.result_path = result_path
        if status in ["completed", "failed"]:
            job.completed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(job)
        logger.debug(f"Updated job {job_id}: status={status}, progress={progress}")
        return job
    except SQLAlchemyError as e:
        db.rollback()
        error_msg = f"Failed to update job {job_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise


def get_job(db: Session, job_id: str) -> Optional[Job]:
    """
    Get job by ID with error handling.
    
    Args:
        db: Database session
        job_id: Job identifier
        
    Returns:
        Job: Job record if found, None otherwise
        
    Raises:
        SQLAlchemyError: For database errors
    """
    try:
        job = db.query(Job).filter(Job.job_id == job_id).first()
        if job:
            logger.debug(f"Retrieved job {job_id}: status={job.status}")
        else:
            logger.debug(f"Job {job_id} not found")
        return job
    except SQLAlchemyError as e:
        error_msg = f"Failed to get job {job_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise


def init_db():
    """Initialize database tables with error handling."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
        _db_health["status"] = "healthy"
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)
        _db_health["status"] = "error"
        _db_health["last_error"] = str(e)
        raise


def get_pipeline_stats(db: Session) -> Dict[str, Any]:
    """
    Get comprehensive pipeline statistics.
    
    Args:
        db: Database session
        
    Returns:
        Dict with pipeline statistics
    """
    try:
        # Job statistics
        total_jobs = db.query(func.count(Job.id)).scalar() or 0
        pending_jobs = db.query(func.count(Job.id)).filter(Job.status == "pending").scalar() or 0
        processing_jobs = db.query(func.count(Job.id)).filter(Job.status == "processing").scalar() or 0
        completed_jobs = db.query(func.count(Job.id)).filter(Job.status == "completed").scalar() or 0
        failed_jobs = db.query(func.count(Job.id)).filter(Job.status == "failed").scalar() or 0
        
        # Writing statistics
        total_writings = db.query(func.count(Writing.id)).scalar() or 0
        
        # Recent activity
        recent_jobs = db.query(Job).order_by(Job.created_at.desc()).limit(10).all()
        recent_activity = [
            {
                "job_id": job.job_id,
                "type": job.job_type,
                "status": job.status,
                "created_at": job.created_at.isoformat() if job.created_at else None
            }
            for job in recent_jobs
        ]
        
        return {
            "jobs": {
                "total": total_jobs,
                "pending": pending_jobs,
                "processing": processing_jobs,
                "completed": completed_jobs,
                "failed": failed_jobs,
                "success_rate": (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0
            },
            "writings": {
                "total": total_writings
            },
            "recent_activity": recent_activity,
            "database_health": get_db_health()
        }
    except Exception as e:
        logger.error(f"Failed to get pipeline stats: {e}", exc_info=True)
        return {
            "error": str(e),
            "database_health": get_db_health()
        }


# Initialize database on import
try:
    if "sqlite" in settings.DATABASE_URL:
        db_file = settings.DATABASE_URL.replace("sqlite:///", "")
        if not os.path.exists(db_file):
            init_db()
    else:
        # For other databases, try to initialize
        try:
            init_db()
        except Exception as e:
            logger.warning(f"Database initialization check failed (may already exist): {e}")
except Exception as e:
    logger.error(f"Error during database initialization check: {e}", exc_info=True)

