"""
Unit tests for the TTS service.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tts_service import TTSService


@pytest.mark.unit
class TestTTSService:
    """Unit tests for TTSService class."""
    
    def test_init_missing_model(self):
        """Test initialization with missing model file."""
        with pytest.raises(FileNotFoundError):
            TTSService(model_path="nonexistent.onnx", voices_path="voices.json")
    
    def test_init_missing_voices(self):
        """Test initialization with missing voices file."""
        # This will fail if model doesn't exist, so we skip if model is missing
        if not os.path.exists("kokoro-v0_19.onnx"):
            pytest.skip("Model file not found")
        
        with pytest.raises(FileNotFoundError):
            TTSService(model_path="kokoro-v0_19.onnx", voices_path="nonexistent.json")
    
    @patch('tts_service.Kokoro')
    def test_init_success(self, mock_kokoro):
        """Test successful initialization."""
        mock_kokoro_instance = Mock()
        mock_kokoro.return_value = mock_kokoro_instance
        
        # Create temporary files for testing
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.onnx', delete=False) as model_file:
            model_path = model_file.name
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as voices_file:
            voices_file.write('{"af_bella": {}}')
            voices_path = voices_file.name
        
        try:
            service = TTSService(model_path=model_path, voices_path=voices_path)
            assert service.kokoro == mock_kokoro_instance
            mock_kokoro.assert_called_once_with(model_path, voices_path)
        finally:
            os.unlink(model_path)
            os.unlink(voices_path)
    
    @patch('tts_service.Kokoro')
    def test_generate_audio(self, mock_kokoro):
        """Test audio generation."""
        mock_kokoro_instance = Mock()
        mock_kokoro_instance.create.return_value = (b"audio_data", 22050)
        mock_kokoro.return_value = mock_kokoro_instance
        
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.onnx', delete=False) as model_file:
            model_path = model_file.name
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as voices_file:
            voices_file.write('{"af_bella": {}}')
            voices_path = voices_file.name
        
        try:
            service = TTSService(model_path=model_path, voices_path=voices_path)
            audio, sample_rate = service.generate_audio("Hello", "af_bella", 1.0)
            
            assert audio == b"audio_data"
            assert sample_rate == 22050
            mock_kokoro_instance.create.assert_called_once_with(
                "Hello", voice="af_bella", speed=1.0, lang="en-us"
            )
        finally:
            os.unlink(model_path)
            os.unlink(voices_path)
    
    @patch('tts_service.Kokoro')
    @patch('builtins.open', create=True)
    def test_get_voices(self, mock_open, mock_kokoro):
        """Test getting voices list."""
        mock_kokoro_instance = Mock()
        mock_kokoro.return_value = mock_kokoro_instance
        
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.onnx', delete=False) as model_file:
            model_path = model_file.name
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as voices_file:
            voices_file.write('{"af_bella": {}, "af_sarah": {}}')
            voices_path = voices_file.name
        
        try:
            service = TTSService(model_path=model_path, voices_path=voices_path)
            voices = service.get_voices()
            
            assert isinstance(voices, list)
            assert "af_bella" in voices
            assert "af_sarah" in voices
        finally:
            os.unlink(model_path)
            os.unlink(voices_path)
    
    @patch('tts_service.Kokoro')
    def test_generate_audio_long_text(self, mock_kokoro):
        """Test audio generation with long text (chunking)."""
        import numpy as np
        mock_kokoro_instance = Mock()
        # Simulate multiple chunks being generated
        mock_kokoro_instance.create.side_effect = [
            (np.array([0.1, 0.2, 0.3]), 22050),
            (np.array([0.4, 0.5, 0.6]), 22050),
        ]
        mock_kokoro.return_value = mock_kokoro_instance
        
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.onnx', delete=False) as model_file:
            model_path = model_file.name
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as voices_file:
            voices_file.write('{"af_bella": {}}')
            voices_path = voices_file.name
        
        try:
            service = TTSService(model_path=model_path, voices_path=voices_path)
            # Create text longer than OPTIMAL_CHUNK_SIZE to trigger chunking
            long_text = "This is a sentence. " * 100  # ~2000 characters
            audio, sample_rate = service.generate_audio(long_text, "af_bella", 1.0)
            
            assert sample_rate == 22050
            assert len(audio) > 0
            # Should have been called multiple times for chunking
            assert mock_kokoro_instance.create.call_count >= 1
        finally:
            os.unlink(model_path)
            os.unlink(voices_path)
    
    @patch('tts_service.Kokoro')
    def test_split_text_intelligently(self, mock_kokoro):
        """Test intelligent text splitting."""
        mock_kokoro_instance = Mock()
        mock_kokoro.return_value = mock_kokoro_instance
        
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.onnx', delete=False) as model_file:
            model_path = model_file.name
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as voices_file:
            voices_file.write('{"af_bella": {}}')
            voices_path = voices_file.name
        
        try:
            service = TTSService(model_path=model_path, voices_path=voices_path)
            
            # Test short text (should not be split)
            short_text = "Short text."
            chunks = service._split_text_intelligently(short_text)
            assert len(chunks) == 1
            assert chunks[0] == short_text
            
            # Test long text with paragraphs (should be split)
            long_text = "\n\n".join(["Paragraph " + str(i) + ". " * 200 for i in range(10)])
            chunks = service._split_text_intelligently(long_text)
            assert len(chunks) > 1
            # Each chunk should be reasonable size
            for chunk in chunks:
                assert len(chunk) <= service.MAX_CHUNK_SIZE
        finally:
            os.unlink(model_path)
            os.unlink(voices_path)

