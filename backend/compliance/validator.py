"""Compliance validator for ScamGuard."""

from typing import Dict, Any
from .rules import ComplianceRules


class ComplianceValidator:
    """Validates data against compliance rules."""

    def __init__(self, rules: ComplianceRules = None):
        """Initialize validator."""
        self.rules = rules or ComplianceRules()

    def validate(self, data: Dict[str, Any]) -> bool:
        """Validate data."""
        return self.rules.validate_all(data)

    def validate_detailed(self, data: Dict[str, Any]) -> Dict[str, bool]:
        """Get detailed validation results."""
        return self.rules.validate(data)
