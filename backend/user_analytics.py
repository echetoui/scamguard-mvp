"""
User Engagement Analytics

Tracks and analyzes user behavior to understand engagement patterns,
retention, feature usage, and cohort performance.

Features:
- Real-time event tracking
- Cohort analysis
- Retention metrics
- Feature usage tracking
- User journey analytics
- Churn prediction

Author: ScamGuard Analytics Team
Date: February 18, 2026
Version: 1.0
"""

import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class UserEvent:
    """Tracked user event."""
    user_id: str
    event_type: str  # signup, report, login, achievement, etc.
    feature: str     # Which feature used
    timestamp: str
    session_id: str
    metadata: Dict = field(default_factory=dict)


@dataclass
class UserSession:
    """User session tracking."""
    session_id: str
    user_id: str
    start_time: str
    end_time: Optional[str] = None
    duration_seconds: int = 0
    events_count: int = 0
    features_used: List[str] = field(default_factory=list)


@dataclass
class CohortData:
    """Cohort analysis data."""
    cohort_id: str  # e.g., "2026-02-W1" for week 1 of Feb
    signup_count: int
    users_by_day: Dict[str, int]  # Day -> active user count


class UserAnalyticsEngine:
    """
    Comprehensive user engagement analytics system.

    Features:
    - Event tracking (10+ event types)
    - User journey analysis
    - Cohort analysis
    - Retention metrics (day 1, 7, 30)
    - Feature usage tracking
    - Churn prediction
    - Engagement scoring
    """

    # Event types tracked
    EVENT_TYPES = {
        'signup': 'User signup',
        'first_report': 'First scam report',
        'report_submitted': 'Scam report submitted',
        'accurate_report': 'Report marked accurate',
        'quiz_completed': 'Quiz completed',
        'module_completed': 'Module completed',
        'achievement_unlocked': 'Achievement unlocked',
        'leaderboard_viewed': 'Leaderboard viewed',
        'community_helped': 'Helped community member',
        'social_share': 'Shared achievement',
        'login': 'User login',
        'session_end': 'Session ended'
    }

    # Feature tracking
    FEATURES = {
        'report_submission': 'Scam report submission',
        'threat_analysis': 'Threat score view',
        'leaderboards': 'Leaderboard view',
        'achievements': 'Achievement system',
        'education': 'Educational modules',
        'community': 'Community features',
        'gamification': 'Gamification elements',
        'social_sharing': 'Social sharing',
        'events': 'Seasonal events',
        'profile': 'User profile'
    }

    # Key metrics
    KEY_METRICS = [
        'daily_active_users',
        'weekly_active_users',
        'monthly_active_users',
        'new_users',
        'returning_users',
        'churn_rate',
        'retention_day1',
        'retention_day7',
        'retention_day30',
        'average_session_length',
        'sessions_per_user',
        'feature_adoption',
        'engagement_score',
        'reports_per_user'
    ]

    def __init__(self):
        """Initialize analytics engine."""
        self.events: List[UserEvent] = []
        self.sessions: Dict[str, UserSession] = {}
        self.users_created: Dict[str, str] = {}  # user_id -> signup_date
        self.cohorts: Dict[str, CohortData] = {}
        self.feature_usage: Dict[str, int] = defaultdict(int)
        self.user_journeys: Dict[str, List[str]] = defaultdict(list)  # user_id -> event sequence
        self.daily_metrics: Dict[str, Dict] = defaultdict(dict)  # date -> metrics

        logger.info("Initialized UserAnalyticsEngine")

    def track_event(
        self,
        user_id: str,
        event_type: str,
        feature: str = "",
        session_id: str = "",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Track a user event.

        Args:
            user_id: User ID
            event_type: Type of event
            feature: Feature involved
            session_id: Current session ID
            metadata: Additional event data

        Returns:
            Event tracking result
        """
        event = UserEvent(
            user_id=user_id,
            event_type=event_type,
            feature=feature,
            timestamp=datetime.now().isoformat(),
            session_id=session_id,
            metadata=metadata or {}
        )

        self.events.append(event)

        # Track feature usage
        if feature:
            self.feature_usage[feature] += 1

        # Track user journey
        self.user_journeys[user_id].append(event_type)

        logger.debug(f"Tracked event: {user_id} - {event_type} ({feature})")

        return {
            'user_id': user_id,
            'event_type': event_type,
            'timestamp': event.timestamp
        }

    def start_session(self, user_id: str, session_id: str) -> Dict:
        """Start a user session."""
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            start_time=datetime.now().isoformat()
        )

        self.sessions[session_id] = session

        # Track login event
        self.track_event(user_id, 'login', session_id=session_id)

        logger.info(f"Started session {session_id} for user {user_id}")

        return {
            'session_id': session_id,
            'user_id': user_id,
            'start_time': session.start_time
        }

    def end_session(self, session_id: str) -> Dict:
        """End a user session."""
        if session_id not in self.sessions:
            return {'status': 'error', 'message': 'Session not found'}

        session = self.sessions[session_id]
        session.end_time = datetime.now().isoformat()

        # Calculate duration
        start = datetime.fromisoformat(session.start_time)
        end = datetime.fromisoformat(session.end_time)
        session.duration_seconds = int((end - start).total_seconds())

        # Track session end event
        self.track_event(session.user_id, 'session_end', session_id=session_id)

        logger.info(
            f"Ended session {session_id}: {session.duration_seconds}s, "
            f"{session.events_count} events"
        )

        return {
            'session_id': session_id,
            'duration_seconds': session.duration_seconds,
            'events_count': session.events_count
        }

    def register_user(self, user_id: str) -> Dict:
        """Register a new user for tracking."""
        signup_date = datetime.now().isoformat()
        self.users_created[user_id] = signup_date

        # Create cohort if not exists
        cohort_id = self._get_cohort_id(signup_date)
        if cohort_id not in self.cohorts:
            self.cohorts[cohort_id] = CohortData(
                cohort_id=cohort_id,
                signup_count=0,
                users_by_day={}
            )

        self.cohorts[cohort_id].signup_count += 1

        # Track signup event
        self.track_event(user_id, 'signup')

        logger.info(f"Registered user {user_id} to cohort {cohort_id}")

        return {
            'user_id': user_id,
            'signup_date': signup_date,
            'cohort_id': cohort_id
        }

    def calculate_retention(
        self,
        cohort_id: str,
        day: int
    ) -> float:
        """
        Calculate retention rate for cohort at specific day.

        Args:
            cohort_id: Cohort ID
            day: Day number (1, 7, 30, etc.)

        Returns:
            Retention rate (0-1.0)
        """
        cohort = self.cohorts.get(cohort_id)
        if not cohort:
            return 0.0

        target_date = datetime.fromisoformat(cohort_id[:10]) + timedelta(days=day)
        target_date_str = target_date.date().isoformat()

        # Count unique users active on target date
        active_count = len(set(
            event.user_id
            for event in self.events
            if event.timestamp.startswith(target_date_str)
            and event.user_id in self.users_created
            and self.users_created[event.user_id].startswith(cohort_id[:7])
        ))

        if cohort.signup_count == 0:
            return 0.0

        retention_rate = active_count / cohort.signup_count

        return retention_rate

    def calculate_dau(self, date: Optional[str] = None) -> int:
        """Calculate daily active users."""
        target_date = date or datetime.now().date().isoformat()

        dau = len(set(
            event.user_id
            for event in self.events
            if event.timestamp.startswith(target_date)
        ))

        return dau

    def calculate_wau(self, end_date: Optional[str] = None) -> int:
        """Calculate weekly active users."""
        if not end_date:
            end_date = datetime.now().date().isoformat()

        end_datetime = datetime.fromisoformat(end_date)
        start_datetime = end_datetime - timedelta(days=7)
        start_date = start_datetime.date().isoformat()

        wau = len(set(
            event.user_id
            for event in self.events
            if start_date <= event.timestamp[:10] <= end_date
        ))

        return wau

    def calculate_mau(self, end_date: Optional[str] = None) -> int:
        """Calculate monthly active users."""
        if not end_date:
            end_date = datetime.now().date().isoformat()

        end_datetime = datetime.fromisoformat(end_date)
        start_datetime = end_datetime - timedelta(days=30)
        start_date = start_datetime.date().isoformat()

        mau = len(set(
            event.user_id
            for event in self.events
            if start_date <= event.timestamp[:10] <= end_date
        ))

        return mau

    def calculate_churn_rate(self, period_days: int = 7) -> float:
        """
        Calculate churn rate for period.

        Churn = users active last period but not current period
        """
        now = datetime.now()
        current_start = (now - timedelta(days=period_days)).date().isoformat()
        current_end = now.date().isoformat()

        previous_start = (now - timedelta(days=period_days*2)).date().isoformat()
        previous_end = (now - timedelta(days=period_days)).date().isoformat()

        # Users active in previous period
        previous_users = set(
            event.user_id
            for event in self.events
            if previous_start <= event.timestamp[:10] <= previous_end
        )

        # Users active in current period
        current_users = set(
            event.user_id
            for event in self.events
            if current_start <= event.timestamp[:10] <= current_end
        )

        # Churned users
        churned = len(previous_users - current_users)

        if len(previous_users) == 0:
            return 0.0

        churn_rate = churned / len(previous_users)

        return churn_rate

    def get_feature_adoption(self) -> Dict[str, Dict]:
        """Get feature adoption metrics."""
        unique_users_by_feature = defaultdict(set)

        for event in self.events:
            if event.feature:
                unique_users_by_feature[event.feature].add(event.user_id)

        adoption = {}
        total_users = len(self.users_created)

        for feature, users in unique_users_by_feature.items():
            adoption[feature] = {
                'users': len(users),
                'adoption_rate': len(users) / total_users if total_users > 0 else 0,
                'events': sum(1 for e in self.events if e.feature == feature)
            }

        return adoption

    def calculate_engagement_score(self, user_id: str) -> float:
        """
        Calculate engagement score for user (0-100).

        Factors:
        - Session frequency
        - Feature diversity
        - Event count
        - Streak
        """
        user_events = [e for e in self.events if e.user_id == user_id]

        if not user_events:
            return 0.0

        score = 0.0

        # Event frequency (max 30 points)
        event_count = len(user_events)
        frequency_score = min(30, (event_count / 10) * 30)
        score += frequency_score

        # Feature diversity (max 30 points)
        features_used = len(set(e.feature for e in user_events if e.feature))
        diversity_score = min(30, (features_used / len(self.FEATURES)) * 30)
        score += diversity_score

        # Consistency (max 20 points)
        # Days active in last 7 days
        now = datetime.now()
        recent_cutoff = (now - timedelta(days=7)).isoformat()
        recent_events = [e for e in user_events if e.timestamp > recent_cutoff]
        days_active = len(set(e.timestamp[:10] for e in recent_events))
        consistency_score = min(20, (days_active / 7) * 20)
        score += consistency_score

        # Achievement/milestone score (max 20 points)
        achievements = sum(1 for e in user_events if e.event_type == 'achievement_unlocked')
        achievement_score = min(20, (achievements / 5) * 20)
        score += achievement_score

        return min(100, score)

    def get_user_cohort_analysis(self) -> Dict:
        """Get analysis of all cohorts."""
        cohort_summary = {
            'total_cohorts': len(self.cohorts),
            'cohorts': {}
        }

        for cohort_id, cohort in self.cohorts.items():
            retention_1 = self.calculate_retention(cohort_id, 1)
            retention_7 = self.calculate_retention(cohort_id, 7)
            retention_30 = self.calculate_retention(cohort_id, 30)

            cohort_summary['cohorts'][cohort_id] = {
                'signup_count': cohort.signup_count,
                'retention_day1': retention_1,
                'retention_day7': retention_7,
                'retention_day30': retention_30,
                'health': 'strong' if retention_7 > 0.5 else 'moderate' if retention_7 > 0.25 else 'weak'
            }

        return cohort_summary

    def get_user_journey(self, user_id: str) -> Dict:
        """Get user's journey (event sequence)."""
        if user_id not in self.user_journeys:
            return {'user_id': user_id, 'journey': []}

        journey = self.user_journeys[user_id]

        return {
            'user_id': user_id,
            'journey': journey,
            'length': len(journey),
            'unique_events': len(set(journey)),
            'signup_date': self.users_created.get(user_id, 'unknown')
        }

    def get_daily_metrics(self, date: Optional[str] = None) -> Dict:
        """Get metrics for specific day."""
        target_date = date or datetime.now().date().isoformat()

        if target_date in self.daily_metrics:
            return self.daily_metrics[target_date]

        day_events = [e for e in self.events if e.timestamp.startswith(target_date)]

        metrics = {
            'date': target_date,
            'dau': len(set(e.user_id for e in day_events)),
            'new_users': len(set(
                e.user_id for e in day_events if e.event_type == 'signup'
            )),
            'total_events': len(day_events),
            'events_by_type': defaultdict(int),
            'feature_usage': defaultdict(int)
        }

        for event in day_events:
            metrics['events_by_type'][event.event_type] += 1
            if event.feature:
                metrics['feature_usage'][event.feature] += 1

        # Convert defaultdicts to regular dicts
        metrics['events_by_type'] = dict(metrics['events_by_type'])
        metrics['feature_usage'] = dict(metrics['feature_usage'])

        self.daily_metrics[target_date] = metrics

        return metrics

    def get_comprehensive_report(self) -> Dict:
        """Generate comprehensive analytics report."""
        now = datetime.now().date().isoformat()

        return {
            'report_date': now,
            'users': {
                'total_registered': len(self.users_created),
                'dau': self.calculate_dau(),
                'wau': self.calculate_wau(),
                'mau': self.calculate_mau()
            },
            'retention': {
                'day1': self._average_cohort_retention(1),
                'day7': self._average_cohort_retention(7),
                'day30': self._average_cohort_retention(30)
            },
            'churn_rate': self.calculate_churn_rate(),
            'engagement': {
                'average_session_length': self._average_session_length(),
                'sessions_per_user': self._sessions_per_user(),
                'avg_engagement_score': self._average_engagement_score()
            },
            'features': self.get_feature_adoption(),
            'events_tracked': len(self.events),
            'cohorts_total': len(self.cohorts)
        }

    def _average_cohort_retention(self, day: int) -> float:
        """Calculate average retention across all cohorts."""
        if not self.cohorts:
            return 0.0

        retentions = [
            self.calculate_retention(cohort_id, day)
            for cohort_id in self.cohorts.keys()
        ]

        return sum(retentions) / len(retentions) if retentions else 0.0

    def _average_session_length(self) -> float:
        """Calculate average session length."""
        sessions_with_duration = [
            s.duration_seconds
            for s in self.sessions.values()
            if s.end_time
        ]

        if not sessions_with_duration:
            return 0.0

        return sum(sessions_with_duration) / len(sessions_with_duration)

    def _sessions_per_user(self) -> float:
        """Calculate average sessions per user."""
        if not self.users_created:
            return 0.0

        sessions_by_user = defaultdict(int)
        for session in self.sessions.values():
            sessions_by_user[session.user_id] += 1

        return sum(sessions_by_user.values()) / len(self.users_created)

    def _average_engagement_score(self) -> float:
        """Calculate average engagement score across users."""
        if not self.users_created:
            return 0.0

        scores = [
            self.calculate_engagement_score(user_id)
            for user_id in self.users_created.keys()
        ]

        return sum(scores) / len(scores) if scores else 0.0

    def _get_cohort_id(self, date_str: str) -> str:
        """Get cohort ID from date (format: YYYY-MM-W#)."""
        date = datetime.fromisoformat(date_str.split('T')[0])
        week = date.isocalendar()[1]
        return f"{date.year}-{date.month:02d}-W{week}"


if __name__ == '__main__':
    print("User Engagement Analytics Engine")
    print("=" * 50)
    print("Tracks user behavior and generates analytics reports.")
    print("See analytics_dashboard.py for dashboard visualization.")
