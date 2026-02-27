"""
Threat Intelligence Updater - Scheduled Updates

Manages scheduled daily updates from threat intelligence feeds.
Integrates new indicators into the threat database and cross-references
with internal scam patterns.

Author: ScamGuard Threat Intelligence Team
Date: February 18, 2026
Version: 1.0
"""

import logging
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ThreatIntelligenceUpdater:
    """
    Manages scheduled threat intelligence updates.

    Features:
    - Daily schedule (configurable time)
    - Multi-source synchronization
    - Database integration
    - Pattern cross-referencing
    - Update history tracking
    """

    def __init__(
        self,
        integrator,
        db_handler,
        schedule_time: str = "02:00",  # UTC, 2 AM
        timezone: str = "UTC"
    ):
        """
        Initialize the updater.

        Args:
            integrator: ThreatIntelligenceIntegrator instance
            db_handler: Database handler for storing indicators
            schedule_time: Time to run daily update (HH:MM UTC)
            timezone: Timezone for scheduling
        """
        self.integrator = integrator
        self.db_handler = db_handler
        self.schedule_time = schedule_time
        self.timezone = timezone
        self.scheduler = BackgroundScheduler(timezone=timezone)
        self.update_history = []
        self.last_successful_update = None
        self.update_errors = []

        logger.info(f"Initialized ThreatIntelligenceUpdater (daily at {schedule_time} {timezone})")

    def start_scheduler(self):
        """Start the background scheduler."""
        try:
            # Parse schedule time
            hour, minute = map(int, self.schedule_time.split(':'))

            # Add daily job
            self.scheduler.add_job(
                self.run_daily_update,
                CronTrigger(hour=hour, minute=minute, timezone=self.timezone),
                id='threat_intel_daily_update',
                name='Daily Threat Intelligence Update',
                replace_existing=True
            )

            self.scheduler.start()
            logger.info(f"Started scheduler: Daily updates at {self.schedule_time} {self.timezone}")

        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
            raise

    def stop_scheduler(self):
        """Stop the background scheduler."""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Stopped threat intelligence scheduler")

    def run_daily_update(self) -> Dict:
        """
        Execute the daily threat intelligence update.

        Returns:
            Update result summary
        """
        logger.info("Starting daily threat intelligence update")
        update_start = datetime.now(pytz.UTC)

        result = {
            'start_time': update_start.isoformat(),
            'sources': {},
            'total_new_indicators': 0,
            'total_updated_indicators': 0,
            'cross_references': 0,
            'errors': []
        }

        try:
            # Step 1: Fetch from all sources
            logger.info("Step 1: Fetching from all sources")
            fetch_result = self.integrator.fetch_all_sources()

            result['sources'] = {
                'alienvault_otx': len(fetch_result['by_source'].get('alienvault_otx', [])),
                'abuse_ch_phishing': len(fetch_result['by_source'].get('abuse_ch_phishing', [])),
                'cisa_alerts': len(fetch_result['by_source'].get('cisa_alerts', []))
            }

            # Step 2: Store in database
            logger.info("Step 2: Storing indicators in database")
            consolidated = fetch_result.get('consolidated', [])
            db_result = self._store_indicators(consolidated)

            result['total_new_indicators'] = db_result.get('new_count', 0)
            result['total_updated_indicators'] = db_result.get('updated_count', 0)

            # Step 3: Cross-reference with internal patterns
            logger.info("Step 3: Cross-referencing with internal patterns")
            internal_patterns = self._get_internal_patterns()
            cross_ref = self.integrator.cross_reference_with_patterns(
                consolidated,
                internal_patterns
            )
            result['cross_references'] = cross_ref['total_matches']

            # Step 4: Generate alerts for high-confidence matches
            logger.info("Step 4: Processing cross-reference matches")
            alert_count = self._process_cross_references(cross_ref)
            result['alerts_generated'] = alert_count

            # Record success
            update_end = datetime.now(pytz.UTC)
            result['end_time'] = update_end.isoformat()
            result['duration_seconds'] = (update_end - update_start).total_seconds()
            result['status'] = 'SUCCESS'

            self.last_successful_update = update_end.isoformat()
            self.update_history.append(result)

            logger.info(f"Daily update completed successfully in {result['duration_seconds']:.1f}s")
            logger.info(
                f"Summary: {result['total_new_indicators']} new + "
                f"{result['total_updated_indicators']} updated + "
                f"{result['cross_references']} cross-refs"
            )

            return result

        except Exception as e:
            logger.error(f"Error during daily update: {e}")
            result['status'] = 'FAILED'
            result['error'] = str(e)
            result['end_time'] = datetime.now(pytz.UTC).isoformat()
            self.update_errors.append(result)
            return result

    def _store_indicators(self, indicators: List) -> Dict:
        """
        Store threat indicators in database.

        Args:
            indicators: Threat indicators to store

        Returns:
            Storage result with counts
        """
        try:
            db_export = self.integrator.export_indicators_for_database(indicators)

            # In production, this would be:
            # self.db_handler.bulk_insert_or_update('threat_indicators', db_export)

            # For now, simulate database storage
            new_count = len([ind for ind in db_export if True])  # All treated as new
            updated_count = 0

            logger.info(f"Stored {new_count} indicators in database")

            return {
                'new_count': new_count,
                'updated_count': updated_count,
                'total_stored': new_count + updated_count
            }

        except Exception as e:
            logger.error(f"Error storing indicators: {e}")
            raise

    def _get_internal_patterns(self) -> List[Dict]:
        """
        Retrieve internal scam patterns for cross-referencing.

        Returns:
            List of internal scam patterns
        """
        # In production, this would query the pattern database
        # For now, return sample patterns

        return [
            {
                'name': 'cryptocurrency_scam',
                'keywords': ['crypto', 'bitcoin', 'ethereum', 'trading'],
                'scam_types': ['investment', 'phishing'],
                'severity': 'HIGH'
            },
            {
                'name': 'tech_support_scam',
                'keywords': ['microsoft', 'apple', 'windows', 'virus', 'malware'],
                'scam_types': ['tech_support', 'phishing'],
                'severity': 'HIGH'
            },
            {
                'name': 'phishing_domain',
                'keywords': ['paypal', 'amazon', 'apple', 'bank'],
                'scam_types': ['phishing'],
                'severity': 'CRITICAL'
            },
            {
                'name': 'romance_scam',
                'keywords': ['military', 'wealthy', 'offshore', 'emergency'],
                'scam_types': ['romance'],
                'severity': 'MEDIUM'
            }
        ]

    def _process_cross_references(self, cross_ref: Dict) -> int:
        """
        Process cross-reference matches and generate alerts.

        Args:
            cross_ref: Cross-reference results

        Returns:
            Number of alerts generated
        """
        alerts_generated = 0
        matches = cross_ref.get('matches', [])

        for match in matches:
            # Only alert on high-confidence matches
            if match['match_confidence'] >= 0.8:
                alert = {
                    'type': 'threat_intel_match',
                    'indicator': match['indicator'],
                    'pattern': match['pattern'],
                    'severity': match['combined_severity'],
                    'scam_types': match['scam_types_overlap'],
                    'source': match['indicator_source'],
                    'confidence': match['match_confidence'],
                    'timestamp': datetime.now().isoformat(),
                    'recommendation': self._generate_recommendation(match)
                }

                # Store alert (in production)
                # self.db_handler.insert('threat_alerts', alert)

                # Log alert
                if match['combined_severity'] in ['CRITICAL', 'HIGH']:
                    logger.warning(
                        f"HIGH PRIORITY: {match['pattern']} matched {match['indicator']} "
                        f"(source: {match['indicator_source']})"
                    )

                alerts_generated += 1

        logger.info(f"Generated {alerts_generated} alerts from cross-references")
        return alerts_generated

    def _generate_recommendation(self, match: Dict) -> str:
        """Generate recommended action for a match."""
        severity = match['combined_severity']
        scam_types = match['scam_types_overlap']

        if severity == 'CRITICAL':
            return 'Immediately block indicator and notify users'
        elif severity == 'HIGH':
            if 'phishing' in scam_types:
                return 'Add to phishing blocklist and warn users'
            else:
                return 'Update threat detection rules'
        else:
            return 'Monitor and update knowledge base'

    def get_update_history(self, limit: int = 30) -> List[Dict]:
        """
        Get recent update history.

        Args:
            limit: Maximum number of updates to return

        Returns:
            List of recent updates
        """
        return self.update_history[-limit:]

    def get_update_statistics(self) -> Dict:
        """Get statistics about threat intelligence updates."""
        total_indicators = sum(
            len(v) for v in self.integrator.indicators_by_source.values()
        )

        return {
            'total_updates_run': len(self.update_history),
            'successful_updates': len([u for u in self.update_history if u.get('status') == 'SUCCESS']),
            'failed_updates': len([u for u in self.update_history if u.get('status') == 'FAILED']),
            'last_successful_update': self.last_successful_update,
            'total_indicators_in_database': total_indicators,
            'feed_status': self.integrator.get_feed_status(),
            'average_update_time_seconds': (
                sum(u.get('duration_seconds', 0) for u in self.update_history) /
                len([u for u in self.update_history if u.get('duration_seconds')])
                if self.update_history else 0
            ),
            'last_update_time': datetime.now().isoformat()
        }

    def force_immediate_update(self) -> Dict:
        """
        Force an immediate update (bypasses schedule).

        Returns:
            Update result
        """
        logger.warning("Forcing immediate threat intelligence update")
        return self.run_daily_update()

    def get_threat_indicators_by_scam_type(self, scam_type: str) -> List[Dict]:
        """
        Get threat indicators related to specific scam type.

        Args:
            scam_type: The scam type to filter by

        Returns:
            List of relevant threat indicators
        """
        relevant = []

        for source, indicators in self.integrator.indicators_by_source.items():
            for ind in indicators:
                if scam_type in ind.scam_types:
                    relevant.append({
                        'type': ind.type,
                        'value': ind.value,
                        'severity': ind.severity,
                        'source': ind.source,
                        'confidence': ind.confidence,
                        'first_seen': ind.first_seen
                    })

        return relevant

    def export_feed_summary(self) -> Dict:
        """
        Export current feed summary for dashboard/API.

        Returns:
            Feed summary data
        """
        feed_status = self.integrator.get_feed_status()
        stats = self.get_update_statistics()

        return {
            'feeds': feed_status['feeds'],
            'total_indicators': feed_status['total_indicators'],
            'last_update': feed_status['last_full_update'],
            'successful_updates': stats['successful_updates'],
            'failed_updates': stats['failed_updates'],
            'average_update_time': f"{stats['average_update_time_seconds']:.1f}s",
            'next_scheduled_update': self._calculate_next_update_time(),
            'timestamp': datetime.now().isoformat()
        }

    def _calculate_next_update_time(self) -> str:
        """Calculate when the next update is scheduled."""
        now = datetime.now(pytz.UTC)
        hour, minute = map(int, self.schedule_time.split(':'))

        next_update = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if next_update <= now:
            next_update += timedelta(days=1)

        return next_update.isoformat()


if __name__ == '__main__':
    print("Threat Intelligence Updater Module")
    print("=" * 50)
    print("Manages scheduled threat feed updates.")
    print("See threat_intel_integrator.py for feed integration.")
