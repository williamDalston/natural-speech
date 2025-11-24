import json
import traceback
from kokoro_onnx import Kokoro

try:
    print("Loading voices.json...")
    with open("voices.json", "r") as f:
        data = json.load(f)
    print("voices.json loaded successfully. Keys:", list(data.keys())[:5])
except Exception:
    traceback.print_exc()

try:
    print("\nInitializing Kokoro...")
    kokoro = Kokoro("kokoro-v0_19.onnx", "voices.json")
    print("Kokoro initialized successfully.")
except Exception:
    traceback.print_exc()
