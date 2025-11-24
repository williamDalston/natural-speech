"""
Performance monitoring and metrics collection.
Tracks request timing, success/failure rates, and resource usage.
"""
import time
import threading
from typing import Dict, List, Optional
from collections import defaultdict, deque
from datetime import datetime
import psutil
import os

class PerformanceMonitor:
    """Monitors application performance metrics"""
    
    def __init__(self, max_history: int = 1000):
        self.max_history = max_history
        self.request_times: deque = deque(maxlen=max_history)
        self.request_counts: Dict[str, int] = defaultdict(int)
        self.error_counts: Dict[str, int] = defaultdict(int)
        self.endpoint_times: Dict[str, List[float]] = defaultdict(list)
        self.lock = threading.Lock()
        self.start_time = time.time()
        self.process = psutil.Process(os.getpid())
    
    def record_request(self, endpoint: str, duration: float, success: bool = True):
        """Record a request with its duration"""
        with self.lock:
            self.request_times.append(duration)
            self.request_counts[endpoint] += 1
            self.endpoint_times[endpoint].append(duration)
            
            # Keep only recent times per endpoint
            if len(self.endpoint_times[endpoint]) > self.max_history:
                self.endpoint_times[endpoint] = self.endpoint_times[endpoint][-self.max_history:]
            
            if not success:
                self.error_counts[endpoint] += 1
    
    def get_metrics(self) -> Dict:
        """Get current performance metrics"""
        with self.lock:
            request_times_list = list(self.request_times)
            
            if not request_times_list:
                avg_time = 0
                min_time = 0
                max_time = 0
                p95_time = 0
                p99_time = 0
            else:
                sorted_times = sorted(request_times_list)
                avg_time = sum(request_times_list) / len(request_times_list)
                min_time = sorted_times[0]
                max_time = sorted_times[-1]
                p95_index = int(len(sorted_times) * 0.95)
                p99_index = int(len(sorted_times) * 0.99)
                p95_time = sorted_times[p95_index] if p95_index < len(sorted_times) else sorted_times[-1]
                p99_time = sorted_times[p99_index] if p99_index < len(sorted_times) else sorted_times[-1]
            
            # Calculate endpoint-specific metrics
            endpoint_metrics = {}
            for endpoint, times in self.endpoint_times.items():
                if times:
                    sorted_endpoint_times = sorted(times)
                    endpoint_metrics[endpoint] = {
                        "count": self.request_counts[endpoint],
                        "error_count": self.error_counts.get(endpoint, 0),
                        "success_rate": 1 - (self.error_counts.get(endpoint, 0) / self.request_counts[endpoint]),
                        "avg_time": sum(times) / len(times),
                        "min_time": sorted_endpoint_times[0],
                        "max_time": sorted_endpoint_times[-1],
                        "p95_time": sorted_endpoint_times[int(len(sorted_endpoint_times) * 0.95)] if len(sorted_endpoint_times) > 0 else 0,
                    }
            
            # Get system resources
            try:
                cpu_percent = self.process.cpu_percent(interval=0.1)
                memory_info = self.process.memory_info()
                memory_mb = memory_info.rss / 1024 / 1024
            except Exception:
                cpu_percent = 0
                memory_mb = 0
            
            uptime = time.time() - self.start_time
            
            return {
                "uptime_seconds": uptime,
                "total_requests": len(request_times_list),
                "global_metrics": {
                    "avg_response_time": avg_time,
                    "min_response_time": min_time,
                    "max_response_time": max_time,
                    "p95_response_time": p95_time,
                    "p99_response_time": p99_time,
                },
                "endpoint_metrics": endpoint_metrics,
                "system_resources": {
                    "cpu_percent": cpu_percent,
                    "memory_mb": memory_mb,
                }
            }
    
    def reset(self):
        """Reset all metrics"""
        with self.lock:
            self.request_times.clear()
            self.request_counts.clear()
            self.error_counts.clear()
            self.endpoint_times.clear()
            self.start_time = time.time()

