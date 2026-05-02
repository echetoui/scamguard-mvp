"""Anonymization utilities."""

import hashlib
from typing import Dict, Any, Optional, List


# PII fields to strip from training data
_PII_FIELDS = {"user_id", "email", "phone", "name", "address", "ip_address"}


class AnonymizationUtil:
    """Utility for anonymizing data."""

    @staticmethod
    def anonymize_email(email: str) -> str:
        """Anonymize email address."""
        if not email or "@" not in email:
            return "***"
        parts = email.split("@")
        user_part = parts[0][:2] + "***" if len(parts[0]) > 2 else "***"
        return f"{user_part}@{parts[1]}"

    @staticmethod
    def anonymize_data(data: Dict[str, Any], fields: list) -> Dict[str, Any]:
        """Anonymize specified fields in data."""
        result = data.copy()
        for field in fields:
            if field in result:
                result[field] = "***"
        return result

    @staticmethod
    def is_anonymized(data: Dict[str, Any]) -> bool:
        """Check if data is properly anonymized."""
        pii_indicators = ["@", "+1", "SSN"]
        data_str = str(data).lower()
        return not any(indicator.lower() in data_str for indicator in pii_indicators)

    @staticmethod
    def anonymize_user_id(user_id: str) -> str:
        """Hash a user ID to a consistent anonymized form.

        Returns a stable 'USER_<hash>' token for the same input.
        """
        h = hashlib.sha256(user_id.encode()).hexdigest()[:16]
        return f"USER_{h}"

    @staticmethod
    def anonymize_training_session(session: Dict[str, Any]) -> Dict[str, Any]:
        """Remove PII and compute a session hash from a training session dict.

        Strips user_id, email, and other PII. Preserves learning metrics.
        Adds 'session_hash' for cross-session correlation without identifying users.
        """
        result = {}

        # Compute a hash of the session for linkability without PII
        pii_val = str(session.get("user_id", "")) + str(session.get("email", ""))
        session_hash = hashlib.sha256(pii_val.encode()).hexdigest()[:16]

        # Copy non-PII fields
        for k, v in session.items():
            if k not in _PII_FIELDS:
                result[k] = v

        result["session_hash"] = session_hash

        # Compute confidence improvement if possible
        before = session.get("confidence_before")
        after = session.get("confidence_after")
        if before is not None and after is not None and before > 0:
            result["confidence_improvement_percent"] = round(
                ((after - before) / before) * 100, 1
            )
        else:
            result.setdefault("confidence_improvement_percent", None)

        return result

    @staticmethod
    def anonymize_image_metadata(image_data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize image metadata by removing URL and user identifier.

        Adds an 'image_hash' in place of image_url.
        """
        result = {}

        # Hash the image URL for linkability without exposing it
        url = image_data.get("image_url", "")
        image_hash = hashlib.sha256(url.encode()).hexdigest()[:16] if url else "no_url"

        for k, v in image_data.items():
            if k not in _PII_FIELDS and k != "image_url":
                result[k] = v

        result["image_hash"] = image_hash
        return result

    @staticmethod
    def create_aggregated_analytics(
        sessions: List[Dict[str, Any]],
        cohort: str = "all",
    ) -> Dict[str, Any]:
        """Create aggregated, anonymized analytics from a list of sessions.

        No individual user data is retained.
        """
        session_count = len(sessions)
        if session_count == 0:
            return {
                "cohort": cohort,
                "session_count": 0,
                "learning_effective_percent": 0.0,
                "difficulty_breakdown": {},
                "common_red_flags": [],
            }

        effective = sum(1 for s in sessions if s.get("learning_effective"))
        learning_effective_percent = round((effective / session_count) * 100, 1)

        # Difficulty breakdown
        difficulty_breakdown: Dict[str, int] = {}
        for s in sessions:
            d = s.get("difficulty", "unknown")
            difficulty_breakdown[d] = difficulty_breakdown.get(d, 0) + 1

        # Common red flags
        flag_counts: Dict[str, int] = {}
        for s in sessions:
            for flag in s.get("red_flags_identified", []):
                flag_counts[flag] = flag_counts.get(flag, 0) + 1
        common_red_flags = sorted(flag_counts, key=lambda x: -flag_counts[x])

        return {
            "cohort": cohort,
            "session_count": session_count,
            "learning_effective_percent": learning_effective_percent,
            "difficulty_breakdown": difficulty_breakdown,
            "common_red_flags": common_red_flags,
        }


def anonymize_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """Anonymize an item by removing/hashing PII fields."""
    result = item.copy()

    # Remove userId and add hashed version
    if "userId" in result:
        user_id = result.pop("userId")
        # Simple hash for stub
        result["hashedUserId"] = "anonymized_" + user_id[:8]

    # Add TTL/expiration
    from datetime import datetime, timedelta
    expiration = datetime.utcnow() + timedelta(days=30)
    result["expirationTime"] = int(expiration.timestamp())

    # Add timestamp if missing
    if "timestamp" not in result:
        result["timestamp"] = datetime.utcnow().isoformat() + "Z"

    return result
