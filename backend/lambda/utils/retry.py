"""Retry logic with exponential backoff."""

import time
import logging
from typing import Callable, Any, Optional, Type, Tuple
from dataclasses import dataclass
from aws_xray_sdk.core import xray_recorder

logger = logging.getLogger(__name__)


@dataclass
class RetryConfig:
    """Retry configuration."""

    max_attempts: int = 3
    initial_delay: float = 0.5  # seconds
    max_delay: float = 10.0  # seconds
    exponential_base: float = 2.0
    jitter: bool = True
    retryable_exceptions: Tuple[Type[Exception], ...] = (
        Exception,  # Catch all by default
    )


def retry_with_backoff(config: Optional[RetryConfig] = None):
    """Decorator for retry logic with exponential backoff.

    Args:
        config: RetryConfig with retry parameters

    Returns:
        Decorator function
    """
    if config is None:
        config = RetryConfig()

    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs) -> Any:
            attempt = 0
            last_exception = None

            while attempt < config.max_attempts:
                try:
                    attempt += 1
                    xray_recorder.put_annotation("retry_attempt", str(attempt))

                    result = func(*args, **kwargs)
                    if attempt > 1:
                        logger.info(
                            f"{func.__name__} succeeded on attempt {attempt}"
                        )
                    return result

                except config.retryable_exceptions as e:
                    last_exception = e
                    if attempt >= config.max_attempts:
                        logger.error(
                            f"{func.__name__} failed after {attempt} attempts: {str(e)}"
                        )
                        xray_recorder.put_annotation("retry_failed", "true")
                        raise

                    # Calculate delay with exponential backoff
                    delay = min(
                        config.initial_delay
                        * (config.exponential_base ** (attempt - 1)),
                        config.max_delay,
                    )

                    # Add jitter to prevent thundering herd
                    if config.jitter:
                        import random

                        delay *= random.uniform(0.5, 1.5)

                    logger.warning(
                        f"{func.__name__} failed on attempt {attempt}, "
                        f"retrying in {delay:.2f}s: {str(e)}"
                    )

                    xray_recorder.put_annotation(
                        f"retry_delay_attempt_{attempt}", f"{delay:.2f}s"
                    )
                    time.sleep(delay)

        return wrapper

    return decorator


class RetryableError(Exception):
    """Base exception for retryable errors."""

    pass


class TimeoutError(RetryableError):
    """Timeout during API call."""

    pass


class RateLimitError(RetryableError):
    """Rate limit exceeded (429)."""

    pass


# Retry configs for different scenarios

VISION_API_RETRY_CONFIG = RetryConfig(
    max_attempts=3,
    initial_delay=1.0,
    max_delay=15.0,
    exponential_base=2.0,
    retryable_exceptions=(TimeoutError, RateLimitError, Exception),
)

GEMINI_API_RETRY_CONFIG = RetryConfig(
    max_attempts=3,
    initial_delay=0.5,
    max_delay=8.0,
    exponential_base=2.0,
    retryable_exceptions=(TimeoutError, RateLimitError, Exception),
)

DYNAMODB_RETRY_CONFIG = RetryConfig(
    max_attempts=3,
    initial_delay=0.1,
    max_delay=2.0,
    exponential_base=2.0,
    retryable_exceptions=(Exception,),
)
