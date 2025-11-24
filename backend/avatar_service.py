"""
Avatar Generation Service

This module provides a wrapper around the SadTalker avatar generation system.
It handles running the SadTalker inference script as a subprocess to generate
talking avatar videos from audio and image inputs.

Note: This service uses subprocess calls rather than direct imports to avoid
conflicts with the complex research code dependencies.

Example:
    service = AvatarService()
    video_path = service.generate_avatar("/path/to/audio.wav", "/path/to/image.png")
"""
import os
import sys
import torch
import shutil
from pathlib import Path

# Add SadTalker to sys.path
SADTALKER_PATH = os.path.join(os.path.dirname(__file__), "SadTalker")
sys.path.append(SADTALKER_PATH)

# Import SadTalker modules (this might need adjustment based on actual structure)
# We will use a subprocess call to run inference.py as it's safer and easier 
# than importing complex research code directly into a FastAPI app context.
import subprocess

class AvatarService:
    def __init__(self, base_path="SadTalker"):
        """
        Initialize the Avatar service.
        
        Args:
            base_path: Path to the SadTalker directory containing inference.py
        """
        self.base_path = base_path
        self.checkpoints_dir = os.path.join(base_path, "checkpoints")
        self.results_dir = os.path.join(base_path, "results")
        os.makedirs(self.results_dir, exist_ok=True)

    def generate_avatar(self, audio_path, image_path):
        """
        Generate a talking avatar video from audio and image inputs.
        
        This method runs the SadTalker inference script as a subprocess to
        generate the video. The result is saved in the results directory with
        a timestamp-based folder structure.
        
        Args:
            audio_path: Absolute path to the input audio file (WAV format)
            image_path: Absolute path to the input image file (PNG/JPG)
            
        Returns:
            str: Path to the generated video file (MP4)
            
        Raises:
            Exception: If subprocess fails or result file is not found
        """
        # Construct command to run inference.py
        # python inference.py --driven_audio <audio> --source_image <image> --result_dir <results> --still --preprocess full --enhancer gfpgan
        
        # Note: We might skip enhancer for speed if needed.
        
        command = [
            "python3", 
            os.path.join(self.base_path, "inference.py"),
            "--driven_audio", audio_path,
            "--source_image", image_path,
            "--result_dir", self.results_dir,
            "--still", # Use still mode for fewer head movements (better for single image)
            "--preprocess", "full",
            "--checkpoint_dir", self.checkpoints_dir
        ]
        
        print(f"Running SadTalker command: {' '.join(command)}")
        
        try:
            subprocess.run(command, check=True, cwd=self.base_path)
            
            # Find the latest generated video
            # Results are usually in results_dir/YYYY_MM_DD_HH.MM.SS/name.mp4
            # We need to find the most recently created folder
            
            subdirs = [os.path.join(self.results_dir, d) for d in os.listdir(self.results_dir) if os.path.isdir(os.path.join(self.results_dir, d))]
            if not subdirs:
                raise Exception("No result directory found")
                
            latest_subdir = max(subdirs, key=os.path.getmtime)
            
            # Find mp4 in that subdir
            mp4_files = [f for f in os.listdir(latest_subdir) if f.endswith(".mp4")]
            if not mp4_files:
                raise Exception("No MP4 file found in result directory")
                
            video_path = os.path.join(latest_subdir, mp4_files[0])
            return video_path
            
        except subprocess.CalledProcessError as e:
            print(f"SadTalker failed: {e}")
            raise Exception("Avatar generation failed")

