"""Lambda handler wrapper for testing."""

from .index import handler as lambda_handler

__all__ = ["lambda_handler"]
