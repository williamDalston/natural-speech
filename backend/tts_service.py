"""
Text-to-Speech Service

This module provides a wrapper around the Kokoro ONNX TTS model for generating
speech audio from text input. It handles model initialization, voice selection,
and audio generation.

Example:
    service = TTSService(model_path="kokoro-v0_19.onnx", voices_path="voices.json")
    audio, sample_rate = service.generate_audio("Hello world", "af_bella", 1.0)
"""
import soundfile as sf
from kokoro_onnx import Kokoro
import numpy as np
import os

class TTSService:
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

    def generate_audio(self, text, voice, speed):
        """
        Generate audio from text using the specified voice and speed.
        
        Args:
            text: Text to convert to speech
            voice: Voice identifier (e.g., "af_bella")
            speed: Speech speed multiplier (0.5-2.0)
            
        Returns:
            tuple: (audio_data, sample_rate) where audio_data is numpy array
                   and sample_rate is the audio sample rate (typically 22050)
        """
        # Generate audio
        # lang is hardcoded to en-us for now as per Kokoro default
        audio, sample_rate = self.kokoro.create(text, voice=voice, speed=speed, lang="en-us")
        return audio, sample_rate

    def get_voices(self):
        """
        Get list of available voices from the voices configuration file.
        
        Returns:
            list: List of voice identifier strings (e.g., ["af_bella", "af_sarah"])
        """
        # This is a placeholder. Kokoro-onnx doesn't expose a list of voices easily 
        # unless we parse the json ourselves.
        # For now, we return a hardcoded list of known voices or parse the json.
        import json
        with open("voices.json", "r") as f:
            voices_data = json.load(f)
        return list(voices_data.keys())
