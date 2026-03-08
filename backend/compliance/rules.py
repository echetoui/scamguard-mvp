"""Compliance rules for ScamGuard."""

from enum import Enum
from typing import Dict, Any, List, Callable, Optional


class ComplianceLevel(str, Enum):
    """Compliance levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ComplianceRule:
    """A single compliance rule."""

    def __init__(
        self,
        name: str,
        description: str,
        level: ComplianceLevel,
        validator: Callable,
    ):
        """Initialize compliance rule."""
        self.name = name
        self.description = description
        self.level = level
        self.validator = validator

    def validate(self, data: Dict[str, Any]) -> bool:
        """Validate data against rule."""
        try:
            return self.validator(data)
        except Exception:
            return False


class ComplianceRules:
    """Collection of compliance rules."""

    def __init__(self):
        """Initialize compliance rules."""
        self.rules: List[ComplianceRule] = []

    def add_rule(self, rule: ComplianceRule) -> None:
        """Add a compliance rule."""
        self.rules.append(rule)

    def validate(self, data: Dict[str, Any]) -> Dict[str, bool]:
        """Validate data against all rules."""
        return {rule.name: rule.validate(data) for rule in self.rules}

    def validate_all(self, data: Dict[str, Any]) -> bool:
        """Check if data passes all rules."""
        return all(self.validate(data).values())
