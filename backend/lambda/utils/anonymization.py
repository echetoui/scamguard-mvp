"""Data anonymization utilities for elderly user protection."""

import hashlib
import json
import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class AnonymizationUtil:
    """Utilities for anonymizing training and analytics data."""

    SALT = "scamguard_elderly_protection_2026"  # For consistent hashing

    @staticmethod
    def anonymize_training_session(
        session_data: Dict[str, Any], include_metrics: bool = True
    ) -> Dict[str, Any]:
        """Anonymize a training session record.

        Removes all user identifiers while preserving learning metrics.

        Args:
            session_data: Original training session data
            include_metrics: Whether to include learning metrics

        Returns:
            Anonymized session data
        """
        anonymized = {}

        # Preserve learning metrics (no user identifier)
        metrics_to_keep = [
            "difficulty",
            "risk_level",
            "time_to_identify_seconds",
            "confidence_before",
            "confidence_after",
            "confidence_improvement_percent",
            "learning_effective",
            "scenario_category",
            "red_flags_identified",
            "false_positives",
            "timestamp",  # Keep timestamp for trend analysis
        ]

        for key in metrics_to_keep:
            if key in session_data:
                anonymized[key] = session_data[key]

        # Add anonymized user cohort (e.g., "age_group_70-80")
        if "age_range" in session_data:
            anonymized["age_cohort"] = session_data["age_range"]

        if "region" in session_data:
            anonymized["region_cohort"] = _anonymize_region(session_data["region"])

        # Hash the session ID for tracking without revealing user
        if "session_id" in session_data:
            anonymized["session_hash"] = AnonymizationUtil._hash_value(
                session_data["session_id"]
            )

        return anonymized

    @staticmethod
    def anonymize_user_id(user_id: str, prefix: str = "USER") -> str:
        """Generate a consistent anonymous user identifier.

        Args:
            user_id: Original user ID
            prefix: Prefix for the hashed ID (e.g., "USER", "ELDER")

        Returns:
            Anonymized identifier (e.g., "USER_a1b2c3d4")
        """
        hashed = AnonymizationUtil._hash_value(user_id)[:8]
        return f"{prefix}_{hashed}"

    @staticmethod
    def anonymize_image_metadata(image_data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize image metadata while keeping analysis results.

        Args:
            image_data: Image metadata with analysis

        Returns:
            Anonymized image data
        """
        anonymized = {
            "image_hash": AnonymizationUtil._hash_value(
                image_data.get("image_url", "unknown")
            )[:16],
            "file_size_kb": image_data.get("file_size_kb"),
            "format": image_data.get("format"),  # jpg, png, etc
            "analysis_result": image_data.get("analysis_result"),  # Keep analysis
            "processing_time_ms": image_data.get("processing_time_ms"),
            "confidence": image_data.get("confidence"),
            "timestamp": image_data.get("timestamp"),
        }

        return anonymized

    @staticmethod
    def create_aggregated_analytics(
        sessions: List[Dict[str, Any]], cohort: str = "all"
    ) -> Dict[str, Any]:
        """Create aggregated analytics from multiple anonymized sessions.

        Args:
            sessions: List of anonymized training sessions
            cohort: Cohort identifier (e.g., "age_70-80", "all")

        Returns:
            Aggregated analytics safe for reporting
        """
        if not sessions:
            return {
                "cohort": cohort,
                "session_count": 0,
                "timestamp": datetime.utcnow().isoformat(),
            }

        total_sessions = len(sessions)
        effective_learners = sum(
            1 for s in sessions if s.get("learning_effective") == True
        )

        avg_confidence_before = (
            sum(s.get("confidence_before", 0) for s in sessions) / total_sessions
        )
        avg_confidence_after = (
            sum(s.get("confidence_after", 0) for s in sessions) / total_sessions
        )
        avg_improvement = (
            sum(s.get("confidence_improvement_percent", 0) for s in sessions)
            / total_sessions
        )

        # Group by difficulty
        difficulty_stats = {}
        for session in sessions:
            diff = session.get("difficulty", "unknown")
            if diff not in difficulty_stats:
                difficulty_stats[diff] = {"count": 0, "effective": 0}
            difficulty_stats[diff]["count"] += 1
            if session.get("learning_effective"):
                difficulty_stats[diff]["effective"] += 1

        return {
            "cohort": cohort,
            "session_count": total_sessions,
            "learning_effective_percent": (effective_learners / total_sessions * 100)
            if total_sessions > 0
            else 0,
            "avg_confidence_before": round(avg_confidence_before, 2),
            "avg_confidence_after": round(avg_confidence_after, 2),
            "avg_confidence_improvement_percent": round(avg_improvement, 2),
            "difficulty_breakdown": difficulty_stats,
            "common_red_flags": _extract_common_flags(sessions),
            "timestamp": datetime.utcnow().isoformat(),
            "period_days": 30,
        }

    @staticmethod
    def _hash_value(value: str) -> str:
        """Create consistent hash of a value for anonymization.

        Args:
            value: Value to hash

        Returns:
            Hexadecimal hash
        """
        combined = f"{value}{AnonymizationUtil.SALT}"
        return hashlib.sha256(combined.encode()).hexdigest()


def _anonymize_region(region: str) -> str:
    """Anonymize region to country level (not city/postal code)."""
    # Extract country from region if available
    parts = region.split("-")
    if len(parts) > 1:
        return parts[0]  # Return country part only
    return region


def _extract_common_flags(sessions: List[Dict[str, Any]]) -> Dict[str, int]:
    """Extract most commonly identified red flags.

    Args:
        sessions: List of training sessions

    Returns:
        Count of each red flag identified
    """
    flags = {}
    for session in sessions:
        red_flags = session.get("red_flags_identified", [])
        for flag in red_flags:
            flags[flag] = flags.get(flag, 0) + 1

    # Return top 5 most common
    return dict(sorted(flags.items(), key=lambda x: x[1], reverse=True)[:5])
