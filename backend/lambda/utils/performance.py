"""Performance optimization utilities."""

import logging
import time
import psutil
import os
from functools import wraps
from typing import Callable, Any
from aws_xray_sdk.core import xray_recorder

logger = logging.getLogger(__name__)


def monitor_performance(func: Callable) -> Callable:
    """Decorator to monitor function performance and memory usage."""

    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        start_time = time.time()
        start_memory = get_memory_usage()

        try:
            result = func(*args, **kwargs)
            return result

        finally:
            duration = time.time() - start_time
            end_memory = get_memory_usage()
            memory_delta = end_memory - start_memory

            # Log performance metrics
            logger.info(
                f"{func.__name__}: duration={duration:.2f}s, "
                f"memory_start={start_memory:.1f}MB, "
                f"memory_end={end_memory:.1f}MB, "
                f"memory_delta={memory_delta:.1f}MB"
            )

            # Annotate X-Ray
            xray_recorder.put_annotation(f"{func.__name__}_duration", f"{duration:.2f}s")
            xray_recorder.put_annotation(
                f"{func.__name__}_memory_mb", f"{end_memory:.1f}MB"
            )

            # Warn if exceeding thresholds
            if duration > 30:
                logger.warning(f"{func.__name__} exceeded 30s: {duration:.2f}s")

            if end_memory > 1200:  # 80% of 1536MB
                logger.warning(
                    f"{func.__name__} memory usage high: {end_memory:.1f}MB"
                )

    return wrapper


def get_memory_usage() -> float:
    """Get current memory usage in MB."""
    try:
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024 * 1024)
    except Exception:
        return 0.0


def timeout_guard(timeout_sec: int):
    """Decorator to warn if function approaches timeout.

    Args:
        timeout_sec: Expected timeout in seconds
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()

            def get_remaining_time():
                return timeout_sec - (time.time() - start_time)

            # Store in context for function to check
            kwargs["remaining_time"] = get_remaining_time

            try:
                return func(*args, **kwargs)
            finally:
                duration = time.time() - start_time
                if duration > (timeout_sec * 0.8):
                    logger.warning(
                        f"{func.__name__} used {duration:.2f}s of {timeout_sec}s timeout"
                    )

        return wrapper

    return decorator


class ConnectionPool:
    """Reuse connections to reduce overhead."""

    _instances = {}

    def __init__(self, client_type: str):
        """Initialize connection pool.

        Args:
            client_type: Type of client (openai, dynamodb, s3, etc)
        """
        self.client_type = client_type
        self._client = None

    def get(self):
        """Get or create connection."""
        if self._client is None:
            if self.client_type == "openai":
                from openai import OpenAI

                self._client = OpenAI()
            elif self.client_type == "dynamodb":
                import boto3

                self._client = boto3.resource("dynamodb")
            elif self.client_type == "s3":
                import boto3

                self._client = boto3.client("s3")

        return self._client

    @staticmethod
    def get_pool(client_type: str):
        """Get singleton pool for client type."""
        if client_type not in ConnectionPool._instances:
            ConnectionPool._instances[client_type] = ConnectionPool(client_type)
        return ConnectionPool._instances[client_type]


# Lambda initialization recommendations
LAMBDA_INIT_NOTES = """
Lambda Optimization for ScamGuard v5.2:

Memory: 1536 MB
- Allocates 3GB+ CPU
- Python + dependencies: ~100MB
- Available for processing: ~1400MB

Timeout: 60 seconds
- Vision API calls: 8-15s
- Agent processing: 5-10s
- Buffer: 20-30s

Performance Tips:
1. Reuse connections (boto3, openai clients)
2. Import heavy modules at runtime (not global)
3. Cache Secrets Manager calls
4. Monitor memory usage in CloudWatch
5. Set SDK timeout < Lambda timeout

X-Ray Tracing:
- Enabled by default
- 100% sampling in dev, 10% in prod
- Use annotations for filtering traces

Cost Optimization:
- Duration billed in 100ms increments
- Memory affects CPU allocation
- Target: 30-40s avg duration (scales with requests)
"""


# Lambda memory/duration recommendations
HANDLER_RECOMMENDATIONS = {
    "post_scenarios": {
        "avg_duration": "8-10s",
        "max_duration": "15s",
        "memory_peak": "600MB",
        "notes": "Gemini API call + caching",
    },
    "post_analysis": {
        "avg_duration": "25-30s",
        "max_duration": "45s",
        "memory_peak": "900MB",
        "notes": "GPT-4o-mini vision + agent processing",
    },
    "get_profile": {
        "avg_duration": "1-2s",
        "max_duration": "5s",
        "memory_peak": "300MB",
        "notes": "Simple DynamoDB query",
    },
    "get_analytics": {
        "avg_duration": "2-3s",
        "max_duration": "8s",
        "memory_peak": "400MB",
        "notes": "Aggregate queries",
    },
}
