import json
import numpy as np

print("Loading voices.json...")
with open("voices.json", "r") as f:
    data = json.load(f)

print(f"Loaded {len(data)} voices.")
print("Saving to voices.bin...")
np.save("voices.bin", data)
print("Done.")
