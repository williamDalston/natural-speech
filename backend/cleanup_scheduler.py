"""
Periodic cleanup scheduler for jobs, cache, and temporary files.
"""
import os
import threading
import time
from typing import Optional
from job_tracker import JobTracker
from cache_manager import CacheManager
from rate_limiter import RateLimiter

class CleanupScheduler:
    """Schedules periodic cleanup tasks"""
    
    def __init__(
        self,
        job_tracker: JobTracker,
        cache_manager: CacheManager,
        rate_limiter: Optional[RateLimiter] = None,
        temp_dir: str = "temp",
        cleanup_interval: int = 3600  # 1 hour
    ):
        self.job_tracker = job_tracker
        self.cache_manager = cache_manager
        self.rate_limiter = rate_limiter
        self.temp_dir = temp_dir
        self.cleanup_interval = cleanup_interval
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
    
    def start(self):
        """Start the cleanup scheduler"""
        with self.lock:
            if self.running:
                return
            
            self.running = True
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()
    
    def stop(self):
        """Stop the cleanup scheduler"""
        with self.lock:
            self.running = False
            if self.thread:
                self.thread.join(timeout=5)
    
    def _run(self):
        """Main cleanup loop"""
        while self.running:
            try:
                # Cleanup old jobs (older than 7 days)
                deleted_jobs = self.job_tracker.cleanup_old_jobs(days=7)
                if deleted_jobs > 0:
                    print(f"Cleaned up {deleted_jobs} old jobs")
                
                # Cleanup rate limiter buckets
                if self.rate_limiter:
                    self.rate_limiter.cleanup_old_buckets(max_age_seconds=3600)
                
                # Cleanup temporary files
                self._cleanup_temp_files()
                
            except Exception as e:
                print(f"Error during cleanup: {e}")
            
            # Sleep for cleanup interval
            for _ in range(self.cleanup_interval):
                if not self.running:
                    break
                time.sleep(1)
    
    def _cleanup_temp_files(self):
        """Clean up temporary files older than 1 hour"""
        if not os.path.exists(self.temp_dir):
            return
        
        current_time = time.time()
        cleaned = 0
        
        try:
            for filename in os.listdir(self.temp_dir):
                filepath = os.path.join(self.temp_dir, filename)
                try:
                    # Remove files older than 1 hour
                    if os.path.isfile(filepath):
                        file_age = current_time - os.path.getmtime(filepath)
                        if file_age > 3600:  # 1 hour
                            os.remove(filepath)
                            cleaned += 1
                except (OSError, PermissionError):
                    # File might be in use, skip it
                    pass
        except OSError:
            # Directory might not exist or be inaccessible
            pass
        
        # Also cleanup temp files in root directory
        for pattern in ["temp_audio_*.wav", "temp_*.wav", "temp_*.mp4", "temp_*.jpg", "temp_*.jpeg", "temp_*.png", "temp_*.webp"]:
            import glob
            for filepath in glob.glob(pattern):
                try:
                    file_age = current_time - os.path.getmtime(filepath)
                    if file_age > 3600:  # 1 hour
                        os.remove(filepath)
                        cleaned += 1
                except (OSError, PermissionError):
                    pass
        
        if cleaned > 0:
            print(f"Cleaned up {cleaned} temporary files")

