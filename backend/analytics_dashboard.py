"""
Analytics Dashboard

Aggregates analytics data and provides dashboard-ready visualizations.
Generates real-time and historical reports for admin/analytics view.

Features:
- Real-time dashboard data
- Daily/weekly/monthly reports
- Trend analysis
- Anomaly detection
- Data export

Author: ScamGuard Analytics Team
Date: February 18, 2026
Version: 1.0
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AnalyticsDashboard:
    """
    Analytics dashboard aggregator.

    Provides:
    - Real-time metrics
    - Trend analysis
    - Anomaly detection
    - Report generation
    """

    def __init__(self, analytics_engine):
        """
        Initialize dashboard.

        Args:
            analytics_engine: UserAnalyticsEngine instance
        """
        self.engine = analytics_engine
        self.alerts = []
        self.trends = defaultdict(list)
        self.anomalies = []

        logger.info("Initialized AnalyticsDashboard")

    def get_realtime_dashboard(self) -> Dict:
        """
        Get real-time dashboard data.

        Returns:
            Dashboard-ready data for immediate display
        """
        now = datetime.now()

        # Current metrics
        dau = self.engine.calculate_dau()
        wau = self.engine.calculate_wau()
        mau = self.engine.calculate_mau()

        # Retention
        retention_day1 = self.engine._average_cohort_retention(1)
        retention_day7 = self.engine._average_cohort_retention(7)
        retention_day30 = self.engine._average_cohort_retention(30)

        # Feature adoption
        feature_adoption = self.engine.get_feature_adoption()
        top_features = sorted(
            feature_adoption.items(),
            key=lambda x: x[1]['adoption_rate'],
            reverse=True
        )[:5]

        # Churn
        churn_rate = self.engine.calculate_churn_rate()

        # Engagement
        avg_engagement = self.engine._average_engagement_score()
        avg_session_length = self.engine._average_session_length()

        return {
            'timestamp': datetime.now().isoformat(),
            'active_users': {
                'dau': dau,
                'wau': wau,
                'mau': mau,
                'status': 'healthy' if dau > 10 else 'warning' if dau > 1 else 'low'
            },
            'retention': {
                'day1': round(retention_day1, 3),
                'day7': round(retention_day7, 3),
                'day30': round(retention_day30, 3),
                'trend': self._get_retention_trend(retention_day7)
            },
            'churn': {
                'rate': round(churn_rate, 3),
                'status': 'acceptable' if churn_rate < 0.15 else 'warning' if churn_rate < 0.25 else 'critical'
            },
            'engagement': {
                'average_score': round(avg_engagement, 1),
                'average_session_length_minutes': round(avg_session_length / 60, 1),
                'level': 'high' if avg_engagement > 60 else 'medium' if avg_engagement > 40 else 'low'
            },
            'features': {
                'top_features': [
                    {
                        'feature': name,
                        'adoption_rate': round(data['adoption_rate'], 3),
                        'users': data['users']
                    }
                    for name, data in top_features
                ],
                'total_tracked': len(feature_adoption)
            },
            'total_events': len(self.engine.events),
            'alerts': self.get_active_alerts()
        }

    def get_daily_report(self, date: Optional[str] = None) -> Dict:
        """
        Generate daily report.

        Args:
            date: Report date (default: today)

        Returns:
            Daily analytics report
        """
        target_date = date or datetime.now().date().isoformat()

        daily_metrics = self.engine.get_daily_metrics(target_date)

        # Previous day for comparison
        prev_date = (datetime.fromisoformat(target_date) - timedelta(days=1)).date().isoformat()
        prev_metrics = self.engine.get_daily_metrics(prev_date)

        return {
            'report_date': target_date,
            'daily_active_users': {
                'value': daily_metrics['dau'],
                'change_percent': self._calculate_change(
                    daily_metrics['dau'],
                    prev_metrics.get('dau', 0)
                )
            },
            'new_users': {
                'value': daily_metrics['new_users'],
                'change_percent': self._calculate_change(
                    daily_metrics['new_users'],
                    prev_metrics.get('new_users', 0)
                )
            },
            'total_events': {
                'value': daily_metrics['total_events'],
                'by_type': daily_metrics['events_by_type']
            },
            'feature_usage': daily_metrics['feature_usage'],
            'generated_at': datetime.now().isoformat()
        }

    def get_weekly_report(self, end_date: Optional[str] = None) -> Dict:
        """
        Generate weekly report.

        Args:
            end_date: End date of week (default: today)

        Returns:
            Weekly analytics report
        """
        if not end_date:
            end_date = datetime.now().date().isoformat()

        end_datetime = datetime.fromisoformat(end_date)
        start_date = (end_datetime - timedelta(days=7)).date().isoformat()

        # Collect week's metrics
        wau = self.engine.calculate_wau(end_date)
        dau = self.engine.calculate_dau()

        # Daily breakdown
        daily_breakdown = []
        for i in range(7):
            day = (end_datetime - timedelta(days=i)).date().isoformat()
            metrics = self.engine.get_daily_metrics(day)
            daily_breakdown.append({
                'date': day,
                'dau': metrics['dau'],
                'events': metrics['total_events']
            })

        daily_breakdown.reverse()

        return {
            'report_period': f"{start_date} to {end_date}",
            'weekly_active_users': wau,
            'daily_average': round(wau / 7, 1),
            'daily_breakdown': daily_breakdown,
            'retention': {
                'day1': self.engine._average_cohort_retention(1),
                'day7': self.engine._average_cohort_retention(7)
            },
            'churn_rate': round(self.engine.calculate_churn_rate(), 3),
            'engagement': {
                'avg_score': round(self.engine._average_engagement_score(), 1),
                'avg_session_minutes': round(self.engine._average_session_length() / 60, 1)
            },
            'generated_at': datetime.now().isoformat()
        }

    def get_monthly_report(self, month_date: Optional[str] = None) -> Dict:
        """
        Generate monthly report.

        Args:
            month_date: Date in target month (default: today)

        Returns:
            Monthly analytics report
        """
        if not month_date:
            month_date = datetime.now().date().isoformat()

        month_datetime = datetime.fromisoformat(month_date)
        end_date = month_datetime.date().isoformat()
        start_date = (month_datetime.replace(day=1)).date().isoformat()

        mau = self.engine.calculate_mau(end_date)
        new_users = len([
            uid for uid, signup_date in self.engine.users_created.items()
            if start_date <= signup_date[:10] <= end_date
        ])

        # Cohort analysis for month
        cohort_data = self.engine.get_user_cohort_analysis()

        return {
            'report_period': f"{start_date} to {end_date}",
            'monthly_active_users': mau,
            'new_users_this_month': new_users,
            'total_registered_users': len(self.engine.users_created),
            'retention': {
                'day1': self.engine._average_cohort_retention(1),
                'day7': self.engine._average_cohort_retention(7),
                'day30': self.engine._average_cohort_retention(30)
            },
            'churn_rate': round(self.engine.calculate_churn_rate(30), 3),
            'engagement_metrics': {
                'average_engagement_score': round(self.engine._average_engagement_score(), 1),
                'average_session_length_minutes': round(
                    self.engine._average_session_length() / 60, 1
                ),
                'sessions_per_user': round(self.engine._sessions_per_user(), 2)
            },
            'top_features': self._get_top_features(5),
            'cohorts': cohort_data['cohorts'],
            'generated_at': datetime.now().isoformat()
        }

    def check_anomalies(self) -> List[Dict]:
        """
        Detect anomalies in metrics.

        Returns:
            List of detected anomalies
        """
        anomalies = []

        # Check DAU anomaly
        dau = self.engine.calculate_dau()
        wau = self.engine.calculate_wau()
        expected_dau = wau / 7  # Rough expectation

        if dau < expected_dau * 0.5:  # 50% below expected
            anomalies.append({
                'type': 'low_dau',
                'severity': 'warning',
                'metric': 'Daily Active Users',
                'value': dau,
                'expected': round(expected_dau),
                'message': f"DAU ({dau}) is 50% below weekly average ({round(expected_dau)})"
            })

        # Check churn anomaly
        churn = self.engine.calculate_churn_rate()
        if churn > 0.25:  # 25% churn is high
            anomalies.append({
                'type': 'high_churn',
                'severity': 'critical',
                'metric': 'Churn Rate',
                'value': round(churn, 3),
                'threshold': 0.25,
                'message': f"Churn rate ({round(churn, 1)}%) is above 25% threshold"
            })

        # Check retention anomaly
        retention_7 = self.engine._average_cohort_retention(7)
        if retention_7 < 0.25:  # 25% retention is concerning
            anomalies.append({
                'type': 'low_retention',
                'severity': 'critical',
                'metric': '7-Day Retention',
                'value': round(retention_7, 3),
                'threshold': 0.25,
                'message': f"7-day retention ({round(retention_7*100, 1)}%) is below 25%"
            })

        # Check engagement anomaly
        engagement = self.engine._average_engagement_score()
        if engagement < 30:  # Low engagement
            anomalies.append({
                'type': 'low_engagement',
                'severity': 'warning',
                'metric': 'Average Engagement Score',
                'value': round(engagement, 1),
                'threshold': 30,
                'message': f"Average engagement ({round(engagement, 1)}) is below 30"
            })

        self.anomalies = anomalies
        return anomalies

    def get_active_alerts(self) -> List[Dict]:
        """Get active alerts from anomaly detection."""
        anomalies = self.check_anomalies()
        return [
            {
                'alert_id': f"anomaly_{i}",
                'type': anom['type'],
                'severity': anom['severity'],
                'message': anom['message'],
                'timestamp': datetime.now().isoformat()
            }
            for i, anom in enumerate(anomalies)
        ]

    def _get_retention_trend(self, current_retention: float) -> str:
        """Determine retention trend."""
        if current_retention > 0.5:
            return 'strong'
        elif current_retention > 0.25:
            return 'moderate'
        else:
            return 'weak'

    def _calculate_change(self, current: int, previous: int) -> float:
        """Calculate percentage change."""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100

    def _get_top_features(self, limit: int = 5) -> List[Dict]:
        """Get top features by adoption."""
        feature_adoption = self.engine.get_feature_adoption()
        top = sorted(
            feature_adoption.items(),
            key=lambda x: x[1]['adoption_rate'],
            reverse=True
        )[:limit]

        return [
            {
                'feature': name,
                'adoption_rate': round(data['adoption_rate'], 3),
                'users': data['users'],
                'events': data['events']
            }
            for name, data in top
        ]

    def export_for_api(self) -> Dict:
        """Export dashboard data for API/external use."""
        return {
            'realtime': self.get_realtime_dashboard(),
            'daily': self.get_daily_report(),
            'anomalies': self.check_anomalies(),
            'generated_at': datetime.now().isoformat()
        }


class CohortAnalyzer:
    """Specialized cohort analysis tool."""

    def __init__(self, analytics_engine):
        """Initialize cohort analyzer."""
        self.engine = analytics_engine

    def analyze_cohort(self, cohort_id: str) -> Dict:
        """Get detailed analysis of specific cohort."""
        cohort = self.engine.cohorts.get(cohort_id)

        if not cohort:
            return {'status': 'error', 'message': f'Cohort {cohort_id} not found'}

        return {
            'cohort_id': cohort_id,
            'signup_count': cohort.signup_count,
            'retention': {
                'day1': self.engine.calculate_retention(cohort_id, 1),
                'day7': self.engine.calculate_retention(cohort_id, 7),
                'day30': self.engine.calculate_retention(cohort_id, 30)
            },
            'health_status': self._get_cohort_health(cohort_id),
            'recommendations': self._get_cohort_recommendations(cohort_id)
        }

    def _get_cohort_health(self, cohort_id: str) -> str:
        """Determine cohort health status."""
        retention_7 = self.engine.calculate_retention(cohort_id, 7)

        if retention_7 > 0.5:
            return 'excellent'
        elif retention_7 > 0.35:
            return 'good'
        elif retention_7 > 0.2:
            return 'fair'
        else:
            return 'poor'

    def _get_cohort_recommendations(self, cohort_id: str) -> List[str]:
        """Get recommendations for cohort improvement."""
        recommendations = []
        retention_7 = self.engine.calculate_retention(cohort_id, 7)

        if retention_7 < 0.25:
            recommendations.append("Consider re-engagement campaign for this cohort")
            recommendations.append("Review onboarding experience for new users")

        if retention_7 < 0.5:
            recommendations.append("Implement gamification features targeting this cohort")
            recommendations.append("Send personalized engagement emails")

        return recommendations


if __name__ == '__main__':
    print("Analytics Dashboard")
    print("=" * 50)
    print("Real-time and historical analytics visualization.")
    print("Works with UserAnalyticsEngine for data aggregation.")
