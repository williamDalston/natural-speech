#!/usr/bin/env python3
"""
Health check script for Docker containers.
Exits with code 0 if healthy, 1 if unhealthy.
"""
import sys
import requests
import time

def check_health(url: str = "http://localhost:8000/api/health", timeout: int = 5):
    """Check if the API is healthy."""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                return True
        return False
    except Exception as e:
        print(f"Health check failed: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    # Allow some time for the service to start
    time.sleep(2)
    
    if check_health():
        sys.exit(0)
    else:
        sys.exit(1)

