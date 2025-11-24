"""
Unit tests for the Avatar service.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import os
import sys
import subprocess

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from avatar_service import AvatarService


@pytest.mark.unit
class TestAvatarService:
    """Unit tests for AvatarService class."""
    
    def test_init_creates_results_dir(self, tmp_path):
        """Test that initialization creates results directory."""
        base_path = str(tmp_path / "SadTalker")
        os.makedirs(base_path, exist_ok=True)
        
        service = AvatarService(base_path=base_path)
        results_dir = os.path.join(base_path, "results")
        assert os.path.exists(results_dir)
    
    @patch('avatar_service.subprocess.run')
    def test_generate_avatar_success(self, mock_subprocess, tmp_path):
        """Test successful avatar generation."""
        base_path = str(tmp_path / "SadTalker")
        os.makedirs(base_path, exist_ok=True)
        os.makedirs(os.path.join(base_path, "results"), exist_ok=True)
        
        # Create mock inference.py
        inference_path = os.path.join(base_path, "inference.py")
        with open(inference_path, "w") as f:
            f.write("# Mock inference.py")
        
        # Create mock result directory and video
        result_subdir = os.path.join(base_path, "results", "2024_01_01_12.00.00")
        os.makedirs(result_subdir, exist_ok=True)
        video_path = os.path.join(result_subdir, "test.mp4")
        with open(video_path, "w") as f:
            f.write("mock video data")
        
        mock_subprocess.return_value = Mock()
        
        service = AvatarService(base_path=base_path)
        
        # Mock os.listdir and os.path.getmtime to return our test directory
        with patch('os.listdir') as mock_listdir, \
             patch('os.path.getmtime') as mock_getmtime, \
             patch('os.path.isdir') as mock_isdir:
            
            mock_listdir.return_value = ["2024_01_01_12.00.00"]
            mock_isdir.return_value = True
            mock_getmtime.return_value = 1234567890.0
            
            # Mock finding the mp4 file
            with patch('os.listdir') as mock_listdir2:
                mock_listdir2.return_value = ["test.mp4"]
                
                result = service.generate_avatar("/tmp/audio.wav", "/tmp/image.png")
                assert result == video_path
                mock_subprocess.assert_called_once()
    
    @patch('avatar_service.subprocess.run')
    def test_generate_avatar_subprocess_failure(self, mock_subprocess, tmp_path):
        """Test avatar generation when subprocess fails."""
        base_path = str(tmp_path / "SadTalker")
        os.makedirs(base_path, exist_ok=True)
        os.makedirs(os.path.join(base_path, "results"), exist_ok=True)
        
        inference_path = os.path.join(base_path, "inference.py")
        with open(inference_path, "w") as f:
            f.write("# Mock inference.py")
        
        # Make subprocess raise an error
        mock_subprocess.side_effect = subprocess.CalledProcessError(1, "python3")
        
        service = AvatarService(base_path=base_path)
        
        with pytest.raises(Exception, match="Avatar generation failed"):
            service.generate_avatar("/tmp/audio.wav", "/tmp/image.png")
    
    @patch('avatar_service.subprocess.run')
    def test_generate_avatar_no_result_dir(self, mock_subprocess, tmp_path):
        """Test avatar generation when no result directory is found."""
        base_path = str(tmp_path / "SadTalker")
        os.makedirs(base_path, exist_ok=True)
        results_dir = os.path.join(base_path, "results")
        os.makedirs(results_dir, exist_ok=True)
        
        inference_path = os.path.join(base_path, "inference.py")
        with open(inference_path, "w") as f:
            f.write("# Mock inference.py")
        
        mock_subprocess.return_value = Mock()
        
        service = AvatarService(base_path=base_path)
        
        # Mock os.listdir to return empty list
        with patch('os.listdir') as mock_listdir:
            mock_listdir.return_value = []
            
            with pytest.raises(Exception, match="No result directory found"):
                service.generate_avatar("/tmp/audio.wav", "/tmp/image.png")
    
    @patch('avatar_service.subprocess.run')
    def test_generate_avatar_no_mp4_file(self, mock_subprocess, tmp_path):
        """Test avatar generation when no MP4 file is found."""
        base_path = str(tmp_path / "SadTalker")
        os.makedirs(base_path, exist_ok=True)
        results_dir = os.path.join(base_path, "results")
        os.makedirs(results_dir, exist_ok=True)
        
        inference_path = os.path.join(base_path, "inference.py")
        with open(inference_path, "w") as f:
            f.write("# Mock inference.py")
        
        result_subdir = os.path.join(results_dir, "2024_01_01_12.00.00")
        os.makedirs(result_subdir, exist_ok=True)
        
        mock_subprocess.return_value = Mock()
        
        service = AvatarService(base_path=base_path)
        
        with patch('os.listdir') as mock_listdir, \
             patch('os.path.getmtime') as mock_getmtime, \
             patch('os.path.isdir') as mock_isdir:
            
            # First call returns subdirs
            mock_listdir.side_effect = [
                ["2024_01_01_12.00.00"],  # First call for results dir
                []  # Second call for mp4 files (empty)
            ]
            mock_isdir.return_value = True
            mock_getmtime.return_value = 1234567890.0
            
            with pytest.raises(Exception, match="No MP4 file found"):
                service.generate_avatar("/tmp/audio.wav", "/tmp/image.png")

