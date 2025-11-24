"""
Database models and setup for job tracking.
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from typing import Optional
import os

from config import settings

Base = declarative_base()

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


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


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_job(db: Session, job_id: str, job_type: str, metadata: Optional[str] = None) -> Job:
    """Create a new job record."""
    job = Job(
        job_id=job_id,
        job_type=job_type,
        status="pending",
        metadata=metadata
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job_status(
    db: Session,
    job_id: str,
    status: str,
    progress: Optional[float] = None,
    error_message: Optional[str] = None,
    result_path: Optional[str] = None
) -> Optional[Job]:
    """Update job status."""
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if job:
        job.status = status
        job.updated_at = datetime.utcnow()
        if progress is not None:
            job.progress = progress
        if error_message:
            job.error_message = error_message
        if result_path:
            job.result_path = result_path
        if status in ["completed", "failed"]:
            job.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(job)
    return job


def get_job(db: Session, job_id: str) -> Optional[Job]:
    """Get job by ID."""
    return db.query(Job).filter(Job.job_id == job_id).first()


# Initialize database on import
if not os.path.exists(settings.DATABASE_URL.replace("sqlite:///", "")):
    init_db()

