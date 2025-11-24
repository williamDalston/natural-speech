import soundfile as sf
from kokoro_onnx import Kokoro
import numpy as np
import os

class TTSService:
    def __init__(self, model_path="kokoro-v0_19.onnx", voices_path="voices.json"):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not os.path.exists(voices_path):
            raise FileNotFoundError(f"Voices file not found: {voices_path}")
            
        self.kokoro = Kokoro(model_path, voices_path)

    def generate_audio(self, text, voice, speed):
        # Generate audio
        # lang is hardcoded to en-us for now as per Kokoro default
        audio, sample_rate = self.kokoro.create(text, voice=voice, speed=speed, lang="en-us")
        return audio, sample_rate

    def get_voices(self):
        # This is a placeholder. Kokoro-onnx doesn't expose a list of voices easily 
        # unless we parse the json ourselves.
        # For now, we return a hardcoded list of known voices or parse the json.
        import json
        with open("voices.json", "r") as f:
            voices_data = json.load(f)
        return list(voices_data.keys())
