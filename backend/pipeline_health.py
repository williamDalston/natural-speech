"""
Pipeline Health Monitoring System

This module provides comprehensive monitoring and health tracking for all
pipeline components including:
- Service availability (TTS, Avatar, Database)
- Error tracking and analysis
- Performance metrics
- Resource usage
- Pipeline status and diagnostics

The system helps understand everything happening in the pipeline by providing
detailed visibility into all components.
"""
import time
import threading
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from collections import deque, defaultdict
from dataclasses import dataclass, asdict
from enum import Enum

from logger_config import logger


class ComponentStatus(str, Enum):
    """Component health status"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    ERROR = "error"
    UNAVAILABLE = "unavailable"
    UNKNOWN = "unknown"


@dataclass
class ComponentHealth:
    """Health information for a single component"""
    name: str
    status: ComponentStatus
    last_check: str
    last_error: Optional[str] = None
    error_count: int = 0
    success_count: int = 0
    avg_response_time: Optional[float] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class PipelineError:
    """Structured error information"""
    timestamp: str
    component: str
    error_type: str
    message: str
    traceback: Optional[str] = None
    context: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.context is None:
            self.context = {}


class PipelineHealthMonitor:
    """
    Comprehensive pipeline health monitoring system.
    
    Tracks:
    - Component health and availability
    - Error patterns and trends
    - Performance metrics
    - Resource usage
    - Pipeline diagnostics
    """
    
    def __init__(self, max_error_history: int = 1000, max_metric_history: int = 10000):
        self.max_error_history = max_error_history
        self.max_metric_history = max_metric_history
        
        # Component health tracking
        self.components: Dict[str, ComponentHealth] = {}
        
        # Error tracking
        self.errors: deque = deque(maxlen=max_error_history)
        self.error_counts: Dict[str, int] = defaultdict(int)
        self.error_by_component: Dict[str, List[PipelineError]] = defaultdict(list)
        
        # Performance tracking
        self.response_times: Dict[str, deque] = defaultdict(lambda: deque(maxlen=max_metric_history))
        self.operation_counts: Dict[str, int] = defaultdict(int)
        
        # Thread safety
        self.lock = threading.Lock()
        
        # Initialize component tracking
        self._init_components()
    
    def _init_components(self):
        """Initialize tracking for known components"""
        components = [
            "database",
            "tts_service",
            "avatar_service",
            "background_tasks",
            "cache_manager",
            "rate_limiter",
            "cleanup_scheduler"
        ]
        
        for component in components:
            self.components[component] = ComponentHealth(
                name=component,
                status=ComponentStatus.UNKNOWN,
                last_check=datetime.utcnow().isoformat()
            )
    
    def record_component_check(
        self,
        component: str,
        status: ComponentStatus,
        response_time: Optional[float] = None,
        error: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Record a component health check.
        
        Args:
            component: Component name
            status: Health status
            response_time: Optional response time in seconds
            error: Optional error message
            metadata: Optional additional metadata
        """
        with self.lock:
            if component not in self.components:
                self.components[component] = ComponentHealth(
                    name=component,
                    status=status,
                    last_check=datetime.utcnow().isoformat()
                )
            
            comp = self.components[component]
            comp.status = status
            comp.last_check = datetime.utcnow().isoformat()
            
            if error:
                comp.last_error = error
                comp.error_count += 1
            else:
                comp.success_count += 1
            
            if response_time is not None:
                self.response_times[component].append(response_time)
                if len(self.response_times[component]) > 0:
                    times = list(self.response_times[component])
                    comp.avg_response_time = sum(times) / len(times)
            
            if metadata:
                comp.metadata.update(metadata)
    
    def record_error(
        self,
        component: str,
        error_type: str,
        message: str,
        traceback: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Record an error for analysis.
        
        Args:
            component: Component where error occurred
            error_type: Type of error (e.g., "DatabaseError", "ValidationError")
            message: Error message
            traceback: Optional traceback string
            context: Optional context information
        """
        error = PipelineError(
            timestamp=datetime.utcnow().isoformat(),
            component=component,
            error_type=error_type,
            message=message,
            traceback=traceback,
            context=context or {}
        )
        
        with self.lock:
            self.errors.append(error)
            self.error_counts[error_type] += 1
            self.error_by_component[component].append(error)
            
            # Update component health
            if component in self.components:
                self.components[component].error_count += 1
                self.components[component].last_error = message
                if self.components[component].status == ComponentStatus.HEALTHY:
                    self.components[component].status = ComponentStatus.DEGRADED
    
    def record_operation(
        self,
        component: str,
        operation: str,
        duration: float,
        success: bool = True
    ):
        """
        Record an operation for performance tracking.
        
        Args:
            component: Component name
            operation: Operation name
            duration: Operation duration in seconds
            success: Whether operation succeeded
        """
        with self.lock:
            self.operation_counts[f"{component}.{operation}"] += 1
            self.response_times[f"{component}.{operation}"].append(duration)
            
            if component in self.components:
                if success:
                    self.components[component].success_count += 1
                else:
                    self.components[component].error_count += 1
    
    def get_component_health(self, component: str) -> Optional[ComponentHealth]:
        """Get health information for a specific component."""
        with self.lock:
            return self.components.get(component)
    
    def get_all_components_health(self) -> Dict[str, Dict[str, Any]]:
        """Get health information for all components."""
        with self.lock:
            return {
                name: asdict(health)
                for name, health in self.components.items()
            }
    
    def get_error_summary(
        self,
        component: Optional[str] = None,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get error summary for analysis.
        
        Args:
            component: Optional component filter
            hours: Number of hours to look back
            
        Returns:
            Error summary dictionary
        """
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        with self.lock:
            if component:
                errors = [
                    e for e in self.error_by_component.get(component, [])
                    if datetime.fromisoformat(e.timestamp) >= cutoff
                ]
            else:
                errors = [
                    e for e in self.errors
                    if datetime.fromisoformat(e.timestamp) >= cutoff
                ]
            
            # Group by error type
            by_type = defaultdict(int)
            by_component = defaultdict(int)
            
            for error in errors:
                by_type[error.error_type] += 1
                by_component[error.component] += 1
            
            return {
                "total_errors": len(errors),
                "time_range_hours": hours,
                "errors_by_type": dict(by_type),
                "errors_by_component": dict(by_component),
                "recent_errors": [
                    {
                        "timestamp": e.timestamp,
                        "component": e.component,
                        "type": e.error_type,
                        "message": e.message[:200]  # Truncate long messages
                    }
                    for e in errors[-10:]  # Last 10 errors
                ]
            }
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics for all components."""
        with self.lock:
            metrics = {}
            
            for component, times in self.response_times.items():
                if len(times) > 0:
                    times_list = list(times)
                    metrics[component] = {
                        "count": len(times_list),
                        "avg": sum(times_list) / len(times_list),
                        "min": min(times_list),
                        "max": max(times_list),
                        "p95": self._percentile(times_list, 95),
                        "p99": self._percentile(times_list, 99)
                    }
            
            return metrics
    
    def _percentile(self, data: List[float], percentile: int) -> float:
        """Calculate percentile of a list."""
        if not data:
            return 0.0
        sorted_data = sorted(data)
        index = int(len(sorted_data) * percentile / 100)
        return sorted_data[min(index, len(sorted_data) - 1)]
    
    def get_pipeline_status(self) -> Dict[str, Any]:
        """
        Get comprehensive pipeline status.
        
        Returns:
            Complete pipeline status including all components, errors, and metrics
        """
        with self.lock:
            # Overall health
            component_statuses = [comp.status for comp in self.components.values()]
            if ComponentStatus.ERROR in component_statuses:
                overall_status = "error"
            elif ComponentStatus.UNAVAILABLE in component_statuses:
                overall_status = "degraded"
            elif ComponentStatus.DEGRADED in component_statuses:
                overall_status = "degraded"
            elif all(s == ComponentStatus.HEALTHY for s in component_statuses):
                overall_status = "healthy"
            else:
                overall_status = "unknown"
            
            return {
                "overall_status": overall_status,
                "timestamp": datetime.utcnow().isoformat(),
                "components": {
                    name: asdict(health)
                    for name, health in self.components.items()
                },
                "error_summary": self.get_error_summary(hours=24),
                "performance": self.get_performance_metrics(),
                "statistics": {
                    "total_operations": sum(self.operation_counts.values()),
                    "total_errors": len(self.errors),
                    "components_tracked": len(self.components)
                }
            }
    
    def get_diagnostics(self) -> Dict[str, Any]:
        """
        Get detailed diagnostics for troubleshooting.
        
        Returns:
            Comprehensive diagnostics information
        """
        with self.lock:
            # Find problematic components
            problematic = []
            for name, health in self.components.items():
                if health.status in [ComponentStatus.ERROR, ComponentStatus.DEGRADED]:
                    problematic.append({
                        "component": name,
                        "status": health.status.value,
                        "error_count": health.error_count,
                        "last_error": health.last_error,
                        "recent_errors": [
                            {
                                "timestamp": e.timestamp,
                                "type": e.error_type,
                                "message": e.message[:100]
                            }
                            for e in self.error_by_component.get(name, [])[-5:]
                        ]
                    })
            
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "problematic_components": problematic,
                "error_trends": {
                    "last_hour": self.get_error_summary(hours=1)["total_errors"],
                    "last_24_hours": self.get_error_summary(hours=24)["total_errors"],
                    "top_error_types": dict(
                        sorted(
                            self.error_counts.items(),
                            key=lambda x: x[1],
                            reverse=True
                        )[:10]
                    )
                },
                "performance_issues": self._identify_performance_issues(),
                "recommendations": self._generate_recommendations()
            }
    
    def _identify_performance_issues(self) -> List[Dict[str, Any]]:
        """Identify potential performance issues."""
        issues = []
        
        with self.lock:
            for component, times in self.response_times.items():
                if len(times) > 10:  # Need enough data
                    times_list = list(times)
                    avg = sum(times_list) / len(times_list)
                    p95 = self._percentile(times_list, 95)
                    
                    # Flag if p95 is significantly higher than average
                    if p95 > avg * 2 and avg > 1.0:  # More than 1 second average
                        issues.append({
                            "component": component,
                            "issue": "high_p95_latency",
                            "avg_ms": avg * 1000,
                            "p95_ms": p95 * 1000,
                            "recommendation": "Check for resource constraints or bottlenecks"
                        })
        
        return issues
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on current state."""
        recommendations = []
        
        with self.lock:
            # Check for high error rates
            total_errors = len(self.errors)
            total_operations = sum(self.operation_counts.values())
            
            if total_operations > 0:
                error_rate = (total_errors / total_operations) * 100
                if error_rate > 5:  # More than 5% error rate
                    recommendations.append(
                        f"High error rate detected: {error_rate:.2f}%. "
                        "Review error logs and component health."
                    )
            
            # Check for degraded components
            degraded = [
                name for name, health in self.components.items()
                if health.status == ComponentStatus.DEGRADED
            ]
            if degraded:
                recommendations.append(
                    f"Degraded components detected: {', '.join(degraded)}. "
                    "Review component health and recent errors."
                )
            
            # Check for unavailable components
            unavailable = [
                name for name, health in self.components.items()
                if health.status == ComponentStatus.UNAVAILABLE
            ]
            if unavailable:
                recommendations.append(
                    f"Unavailable components: {', '.join(unavailable)}. "
                    "These components need immediate attention."
                )
        
        if not recommendations:
            recommendations.append("All systems operating normally.")
        
        return recommendations


# Global pipeline health monitor instance
pipeline_health = PipelineHealthMonitor()

