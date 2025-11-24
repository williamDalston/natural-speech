"""
Production monitoring and metrics collection.
"""
import time
import psutil
from typing import Dict, Any
from datetime import datetime
from loguru import logger


class SystemMonitor:
    """Monitor system resources and application metrics."""
    
    def __init__(self):
        self.start_time = time.time()
        self.process = psutil.Process()
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system metrics."""
        try:
            cpu_percent = self.process.cpu_percent(interval=0.1)
            memory_info = self.process.memory_info()
            memory_percent = self.process.memory_percent()
            
            # System-wide metrics
            system_memory = psutil.virtual_memory()
            system_cpu = psutil.cpu_percent(interval=0.1)
            
            return {
                "process": {
                    "cpu_percent": round(cpu_percent, 2),
                    "memory_mb": round(memory_info.rss / 1024 / 1024, 2),
                    "memory_percent": round(memory_percent, 2),
                    "threads": self.process.num_threads(),
                    "open_files": len(self.process.open_files()),
                },
                "system": {
                    "cpu_percent": round(system_cpu, 2),
                    "memory_total_gb": round(system_memory.total / 1024 / 1024 / 1024, 2),
                    "memory_available_gb": round(system_memory.available / 1024 / 1024 / 1024, 2),
                    "memory_percent": round(system_memory.percent, 2),
                },
                "uptime_seconds": int(time.time() - self.start_time),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get health status based on system metrics."""
        try:
            metrics = self.get_system_metrics()
            
            # Determine health status
            memory_percent = metrics.get("process", {}).get("memory_percent", 0)
            cpu_percent = metrics.get("process", {}).get("cpu_percent", 0)
            
            if memory_percent > 90 or cpu_percent > 95:
                status = "degraded"
            elif memory_percent > 75 or cpu_percent > 80:
                status = "warning"
            else:
                status = "healthy"
            
            return {
                "status": status,
                "metrics": metrics,
                "checks": {
                    "memory": "ok" if memory_percent < 90 else "warning",
                    "cpu": "ok" if cpu_percent < 95 else "warning",
                }
            }
        except Exception as e:
            logger.error(f"Error checking health: {e}")
            return {
                "status": "unknown",
                "error": str(e)
            }


# Global monitor instance
system_monitor = SystemMonitor()

