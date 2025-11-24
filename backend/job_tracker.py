"""
Job tracking system for async avatar generation tasks.
Uses SQLite for lightweight job status tracking.
"""
import sqlite3
import json
import os
from datetime import datetime
from typing import Optional, Dict, List
from enum import Enum
import threading

class JobStatus(str, Enum):
    """Job status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobTracker:
    """Manages job tracking for async tasks"""
    
    def __init__(self, db_path: str = "jobs.db"):
        self.db_path = db_path
        self.lock = threading.Lock()
        self._init_db()
    
    def _init_db(self):
        """Initialize the database schema"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    job_id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP NOT NULL,
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    progress REAL DEFAULT 0.0,
                    error_message TEXT,
                    result_path TEXT,
                    metadata TEXT
                )
            """)
            conn.commit()
            conn.close()
    
    def create_job(self, job_id: str, metadata: Optional[Dict] = None) -> str:
        """Create a new job entry"""
        now = datetime.utcnow().isoformat()
        metadata_json = json.dumps(metadata or {})
        
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO jobs (job_id, status, created_at, updated_at, metadata)
                VALUES (?, ?, ?, ?, ?)
            """, (job_id, JobStatus.PENDING.value, now, now, metadata_json))
            conn.commit()
            conn.close()
        
        return job_id
    
    def update_job_status(
        self,
        job_id: str,
        status: JobStatus,
        progress: Optional[float] = None,
        error_message: Optional[str] = None,
        result_path: Optional[str] = None
    ):
        """Update job status and related fields"""
        now = datetime.utcnow().isoformat()
        
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Build update query dynamically
            updates = ["status = ?", "updated_at = ?"]
            values = [status.value, now]
            
            if status == JobStatus.PROCESSING and not self.get_job(job_id).get("started_at"):
                updates.append("started_at = ?")
                values.append(now)
            
            if status in [JobStatus.COMPLETED, JobStatus.FAILED]:
                updates.append("completed_at = ?")
                values.append(now)
            
            if progress is not None:
                updates.append("progress = ?")
                values.append(progress)
            
            if error_message is not None:
                updates.append("error_message = ?")
                values.append(error_message)
            
            if result_path is not None:
                updates.append("result_path = ?")
                values.append(result_path)
            
            values.append(job_id)
            query = f"UPDATE jobs SET {', '.join(updates)} WHERE job_id = ?"
            cursor.execute(query, values)
            conn.commit()
            conn.close()
    
    def get_job(self, job_id: str) -> Optional[Dict]:
        """Get job information by ID"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                job = dict(row)
                if job.get("metadata"):
                    job["metadata"] = json.loads(job["metadata"])
                return job
            return None
    
    def get_jobs(self, status: Optional[JobStatus] = None, limit: int = 100) -> List[Dict]:
        """Get list of jobs, optionally filtered by status"""
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            if status:
                cursor.execute(
                    "SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC LIMIT ?",
                    (status.value, limit)
                )
            else:
                cursor.execute(
                    "SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?",
                    (limit,)
                )
            
            rows = cursor.fetchall()
            conn.close()
            
            jobs = []
            for row in rows:
                job = dict(row)
                if job.get("metadata"):
                    job["metadata"] = json.loads(job["metadata"])
                jobs.append(job)
            
            return jobs
    
    def cleanup_old_jobs(self, days: int = 7):
        """Remove jobs older than specified days"""
        cutoff_date = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        from datetime import timedelta
        cutoff_date = cutoff_date - timedelta(days=days)
        
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM jobs WHERE created_at < ?",
                (cutoff_date.isoformat(),)
            )
            deleted = cursor.rowcount
            conn.commit()
            conn.close()
        
        return deleted

