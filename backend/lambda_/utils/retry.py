"""Retry utilities for Lambda functions."""

import time
from typing import Callable, Any, Type, Tuple
from functools import wraps


class TimeoutError(Exception):
    """Timeout error for retries."""

    pass


class RateLimitError(Exception):
    """Rate limit error for retries."""

    pass


class RetryConfig:
    """Configuration for retry behavior."""

    def __init__(
        self,
        max_attempts: int = 3,
        initial_delay: float = 0.1,
        max_delay: float = 30.0,
        exponential_base: float = 2.0,
    ):
        """Initialize retry config."""
        self.max_attempts = max_attempts
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base


def retry(
    max_attempts: int = 3,
    delay: float = 0.1,
    backoff: float = 2.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
):
    """Decorator to retry a function."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            current_delay = delay
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        time.sleep(current_delay)
                        current_delay = min(current_delay * backoff, 30)
                    continue

            raise last_exception or RuntimeError("Retry failed")

        return wrapper

    return decorator


class RetryableOperation:
    """Wrapper for retryable operations."""

    def __init__(self, config: RetryConfig = None):
        """Initialize retryable operation."""
        self.config = config or RetryConfig()

    def execute(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with retry logic."""
        current_delay = self.config.initial_delay

        for attempt in range(self.config.max_attempts):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempt == self.config.max_attempts - 1:
                    raise
                time.sleep(current_delay)
                current_delay = min(
                    current_delay * self.config.exponential_base,
                    self.config.max_delay,
                )


def retry_with_backoff(
    max_attempts: int = 3,
    initial_delay: float = 0.1,
    max_delay: float = 30.0,
    exponential_base: float = 2.0,
):
    """Decorator for retrying with exponential backoff."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            config = RetryConfig(
                max_attempts=max_attempts,
                initial_delay=initial_delay,
                max_delay=max_delay,
                exponential_base=exponential_base,
            )
            operation = RetryableOperation(config)
            return operation.execute(func, *args, **kwargs)

        return wrapper

    return decorator
