"""
Background task processing for long-running avatar generation.
Uses threading for async processing.
"""
import os
import uuid
import threading
import soundfile as sf
import shutil
import time
import traceback
from typing import Optional, Callable
from job_tracker import JobTracker, JobStatus
from tts_service import TTSService
from avatar_service import AvatarService

class BackgroundTaskManager:
    """Manages background processing of avatar generation tasks"""
    
    def __init__(
        self,
        job_tracker: JobTracker,
        tts_service: TTSService,
        avatar_service: AvatarService,
        max_workers: int = 2
    ):
        self.job_tracker = job_tracker
        self.tts_service = tts_service
        self.avatar_service = avatar_service
        self.max_workers = max_workers
        self.active_workers = 0
        self.worker_lock = threading.Lock()
        self.task_queue = []
        self.queue_lock = threading.Lock()
    
    def submit_avatar_job(
        self,
        text: str,
        voice: str,
        speed: float,
        image_path: str,
        job_id: Optional[str] = None
    ) -> str:
        """Submit an avatar generation job and return job ID"""
        if job_id is None:
            job_id = str(uuid.uuid4())
        
        # Create job entry
        self.job_tracker.create_job(
            job_id,
            metadata={
                "text": text,
                "voice": voice,
                "speed": speed,
                "image_path": image_path
            }
        )
        
        # Add to queue
        with self.queue_lock:
            self.task_queue.append({
                "job_id": job_id,
                "text": text,
                "voice": voice,
                "speed": speed,
                "image_path": image_path
            })
        
        # Start processing if we have available workers
        self._process_queue()
        
        return job_id
    
    def _process_queue(self):
        """Process tasks from the queue"""
        with self.worker_lock:
            if self.active_workers >= self.max_workers:
                return  # All workers busy
            
            with self.queue_lock:
                if not self.task_queue:
                    return  # No tasks to process
                
                task = self.task_queue.pop(0)
            
            self.active_workers += 1
        
        # Start worker thread
        worker_thread = threading.Thread(
            target=self._worker,
            args=(task,),
            daemon=True
        )
        worker_thread.start()
    
    def _worker(self, task: dict):
        """Worker thread that processes a single task"""
        job_id = task["job_id"]
        temp_audio_path = None
        temp_image_path = task.get("image_path")
        
        try:
            # Update status to processing
            self.job_tracker.update_job_status(job_id, JobStatus.PROCESSING, progress=0.1)
            
            # Validate inputs
            if not task.get("text") or not task.get("voice"):
                raise ValueError("Text and voice are required")
            
            # Generate audio
            self.job_tracker.update_job_status(job_id, JobStatus.PROCESSING, progress=0.2)
            try:
                audio, sample_rate = self.tts_service.generate_audio(
                    task["text"],
                    task["voice"],
                    task.get("speed", 1.0)
                )
            except Exception as e:
                raise Exception(f"Audio generation failed: {str(e)}")
            
            # Save audio to temp file
            temp_audio_path = f"temp_audio_{job_id}.wav"
            try:
                sf.write(temp_audio_path, audio, sample_rate, format='WAV')
            except Exception as e:
                raise Exception(f"Failed to save audio file: {str(e)}")
            
            self.job_tracker.update_job_status(job_id, JobStatus.PROCESSING, progress=0.4)
            
            # Validate image file exists
            if not os.path.exists(temp_image_path):
                raise FileNotFoundError(f"Image file not found: {temp_image_path}")
            
            # Generate avatar video
            self.job_tracker.update_job_status(job_id, JobStatus.PROCESSING, progress=0.5)
            try:
                video_path = self.avatar_service.generate_avatar(
                    os.path.abspath(temp_audio_path),
                    os.path.abspath(temp_image_path)
                )
            except Exception as e:
                raise Exception(f"Avatar generation failed: {str(e)}")
            
            # Validate video was created
            if not video_path or not os.path.exists(video_path):
                raise FileNotFoundError("Generated video file not found")
            
            self.job_tracker.update_job_status(job_id, JobStatus.PROCESSING, progress=0.9)
            
            # Update job as completed
            self.job_tracker.update_job_status(
                job_id,
                JobStatus.COMPLETED,
                progress=1.0,
                result_path=video_path
            )
            
        except Exception as e:
            # Log full traceback for debugging
            error_traceback = traceback.format_exc()
            error_message = f"{str(e)}\n\nTraceback:\n{error_traceback}"
            
            self.job_tracker.update_job_status(
                job_id,
                JobStatus.FAILED,
                error_message=error_message[:1000]  # Limit error message length
            )
        
        finally:
            # Cleanup temp files
            try:
                if temp_audio_path and os.path.exists(temp_audio_path):
                    os.remove(temp_audio_path)
            except Exception:
                pass
            
            # Note: image_path cleanup is handled by the caller or cleanup scheduler
            
            # Worker finished, process next task
            with self.worker_lock:
                self.active_workers -= 1
            
            self._process_queue()
    
    def get_queue_status(self) -> dict:
        """Get current queue status"""
        with self.queue_lock:
            queue_size = len(self.task_queue)
        
        with self.worker_lock:
            active_workers = self.active_workers
        
        return {
            "queue_size": queue_size,
            "active_workers": active_workers,
            "max_workers": self.max_workers,
            "available_workers": self.max_workers - active_workers
        }
    
    def shutdown(self, timeout: int = 30):
        """Gracefully shutdown the task manager"""
        # Wait for active workers to finish
        start_time = time.time()
        while self.active_workers > 0 and (time.time() - start_time) < timeout:
            time.sleep(0.5)
        
        # Cancel pending tasks
        with self.queue_lock:
            cancelled = len(self.task_queue)
            for task in self.task_queue:
                job_id = task["job_id"]
                self.job_tracker.update_job_status(
                    job_id,
                    JobStatus.CANCELLED,
                    error_message="Service shutdown"
                )
            self.task_queue.clear()
        
        return cancelled

