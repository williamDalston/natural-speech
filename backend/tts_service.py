"""
Text-to-Speech Service

This module provides a wrapper around the Kokoro ONNX TTS model for generating
speech audio from text input. It handles model initialization, voice selection,
audio generation, and intelligent text chunking for long texts.

Kokoro ONNX is an excellent choice for TTS because:
- High-quality, natural-sounding speech synthesis
- Fast inference with ONNX optimization
- Multiple voice options
- Supports various languages
- Efficient memory usage
- Can handle long texts through intelligent chunking

Example:
    service = TTSService(model_path="kokoro-v0_19.onnx", voices_path="voices.json")
    audio, sample_rate = service.generate_audio("Hello world", "af_bella", 1.0)
"""
import soundfile as sf
from kokoro_onnx import Kokoro
import numpy as np
import os
import re
from typing import List

class TTSService:
    # Optimal chunk size for Kokoro model (characters per chunk)
    # This balances quality and memory usage
    OPTIMAL_CHUNK_SIZE = 1000  # Characters per chunk
    MAX_CHUNK_SIZE = 2000  # Maximum safe chunk size
    
    def __init__(self, model_path="kokoro-v0_19.onnx", voices_path="voices.json"):
        """
        Initialize the TTS service.
        
        Args:
            model_path: Path to the Kokoro ONNX model file
            voices_path: Path to the voices JSON configuration file
            
        Raises:
            FileNotFoundError: If model or voices file doesn't exist
        """
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not os.path.exists(voices_path):
            raise FileNotFoundError(f"Voices file not found: {voices_path}")
            
        self.kokoro = Kokoro(model_path, voices_path)
        self._voices_path = voices_path  # Store for get_voices()

    def _split_text_intelligently(self, text: str) -> List[str]:
        """
        Split text into chunks intelligently, preserving sentence boundaries.
        
        This method attempts to split text at natural break points (sentences,
        paragraphs) to maintain speech quality and naturalness.
        
        Args:
            text: The text to split
            
        Returns:
            List of text chunks, each suitable for TTS processing
        """
        # If text is short enough, return as single chunk
        if len(text) <= self.OPTIMAL_CHUNK_SIZE:
            return [text]
        
        chunks = []
        
        # First, try to split by paragraphs (double newlines)
        paragraphs = re.split(r'\n\s*\n', text)
        
        current_chunk = ""
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
                
            # If adding this paragraph would exceed optimal size
            if len(current_chunk) + len(paragraph) + 2 > self.OPTIMAL_CHUNK_SIZE:
                # Save current chunk if it has content
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""
                
                # If paragraph itself is too long, split by sentences
                if len(paragraph) > self.MAX_CHUNK_SIZE:
                    sentences = self._split_into_sentences(paragraph)
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) + 1 > self.OPTIMAL_CHUNK_SIZE:
                            if current_chunk:
                                chunks.append(current_chunk.strip())
                                current_chunk = ""
                        current_chunk += sentence + " "
                else:
                    current_chunk = paragraph
            else:
                current_chunk += paragraph + "\n\n"
        
        # Add remaining chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # If no chunks were created (shouldn't happen), return original text
        return chunks if chunks else [text]
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences using regex.
        
        Args:
            text: Text to split
            
        Returns:
            List of sentences
        """
        # Pattern to match sentence endings (. ! ?) followed by space or end of string
        sentence_pattern = r'(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])\s*$'
        sentences = re.split(sentence_pattern, text)
        
        # Filter out empty sentences and clean up
        sentences = [s.strip() for s in sentences if s.strip()]
        
        return sentences if sentences else [text]

    def generate_audio(self, text, voice, speed):
        """
        Generate audio from text using the specified voice and speed.
        Handles text of any length by intelligently chunking long texts.
        
        Args:
            text: Text to convert to speech (can be of any length)
            voice: Voice identifier (e.g., "af_bella")
            speed: Speech speed multiplier (0.5-2.0)
            
        Returns:
            tuple: (audio_data, sample_rate) where audio_data is numpy array
                   and sample_rate is the audio sample rate (typically 22050)
        """
        # Clean and validate text
        text = text.strip()
        if not text:
            raise ValueError("Text cannot be empty")
        
        # Split text into manageable chunks
        chunks = self._split_text_intelligently(text)
        
        # If single chunk, process directly
        if len(chunks) == 1:
            audio, sample_rate = self.kokoro.create(
                chunks[0], 
                voice=voice, 
                speed=speed, 
                lang="en-us"
            )
            return audio, sample_rate
        
        # Process multiple chunks and concatenate
        audio_segments = []
        sample_rate = None
        
        for i, chunk in enumerate(chunks):
            try:
                # Generate audio for this chunk
                chunk_audio, chunk_sample_rate = self.kokoro.create(
                    chunk, 
                    voice=voice, 
                    speed=speed, 
                    lang="en-us"
                )
                
                # Store sample rate from first chunk
                if sample_rate is None:
                    sample_rate = chunk_sample_rate
                elif chunk_sample_rate != sample_rate:
                    # Resample if needed (shouldn't happen with Kokoro, but be safe)
                    try:
                        from scipy import signal
                        num_samples = int(len(chunk_audio) * sample_rate / chunk_sample_rate)
                        chunk_audio = signal.resample(chunk_audio, num_samples)
                    except ImportError:
                        # If scipy not available, raise error (sample rates should match anyway)
                        raise RuntimeError(
                            f"Sample rate mismatch: {chunk_sample_rate} vs {sample_rate}. "
                            "This should not happen with Kokoro model."
                        )
                
                audio_segments.append(chunk_audio)
                
                # Add small pause between chunks for natural speech flow
                # 0.2 seconds of silence at the sample rate
                pause_samples = int(0.2 * sample_rate)
                pause = np.zeros(pause_samples, dtype=chunk_audio.dtype)
                audio_segments.append(pause)
                
            except Exception as e:
                raise RuntimeError(
                    f"Error processing text chunk {i+1}/{len(chunks)}: {str(e)}"
                )
        
        # Concatenate all audio segments
        if audio_segments:
            # Remove the last pause (no pause after final chunk)
            if len(audio_segments) > 1:
                audio_segments.pop()
            final_audio = np.concatenate(audio_segments)
        else:
            raise RuntimeError("No audio segments were generated")
        
        return final_audio, sample_rate

    def get_voices(self):
        """
        Get list of available voices from the voices configuration file.
        
        Returns:
            list: List of voice identifier strings (e.g., ["af_bella", "af_sarah"])
        """
        import json
        # Try to use the voices_path from initialization
        voices_path = getattr(self, '_voices_path', "voices.json")
        
        try:
            with open(voices_path, "r") as f:
                voices_data = json.load(f)
            return list(voices_data.keys())
        except (FileNotFoundError, json.JSONDecodeError, KeyError) as e:
            # Fallback: return common Kokoro voices
            return [
                "af_bella", "af_sarah", "am_michael", "am_adam",
                "af_sky", "af_angelica", "am_marko", "af_samantha"
            ]
