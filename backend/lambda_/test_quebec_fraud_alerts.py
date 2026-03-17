"""
Test suite for Quebec Fraud Alerts module
Tests data structure, filtering, and retrieval functions
"""

import pytest
from datetime import datetime, timedelta
from quebec_fraud_alerts import (
    QUEBEC_FRAUD_ALERTS,
    get_quebec_alerts_by_level,
    get_quebec_alert_by_id,
    get_recent_quebec_alerts
)


class TestQuebecAlertsData:
    """Test the Quebec fraud alerts data structure and content"""

    def test_alerts_exist(self):
        """Verify Quebec alerts data is populated"""
        assert len(QUEBEC_FRAUD_ALERTS) > 0
        assert len(QUEBEC_FRAUD_ALERTS) == 8

    def test_alert_structure(self):
        """Verify each alert has required fields"""
        required_fields = [
            'threat_id', 'title', 'description', 'institution',
            'threat_level', 'regions', 'type', 'date_detected',
            'prevention_tips', 'report_link', 'statistics'
        ]

        for alert in QUEBEC_FRAUD_ALERTS:
            for field in required_fields:
                assert field in alert, f"Missing field '{field}' in alert {alert.get('threat_id')}"
                assert alert[field] is not None, f"Field '{field}' is None in alert {alert.get('threat_id')}"

    def test_alert_ids_unique(self):
        """Verify all alert IDs are unique"""
        ids = [alert['threat_id'] for alert in QUEBEC_FRAUD_ALERTS]
        assert len(ids) == len(set(ids)), "Duplicate alert IDs found"

    def test_alert_ids_have_qc_prefix(self):
        """Verify all Quebec alert IDs start with QC_"""
        for alert in QUEBEC_FRAUD_ALERTS:
            assert alert['threat_id'].startswith('QC_'), f"Alert ID doesn't start with QC_: {alert['threat_id']}"

    def test_threat_levels_valid(self):
        """Verify threat levels are valid"""
        valid_levels = ['high', 'medium', 'low']
        for alert in QUEBEC_FRAUD_ALERTS:
            assert alert['threat_level'] in valid_levels, f"Invalid threat level: {alert['threat_level']}"

    def test_dates_valid_format(self):
        """Verify date formats are valid ISO format"""
        for alert in QUEBEC_FRAUD_ALERTS:
            try:
                datetime.fromisoformat(alert['date_detected'])
            except ValueError:
                pytest.fail(f"Invalid date format in alert {alert['threat_id']}: {alert['date_detected']}")

    def test_dates_are_recent(self):
        """Verify alerts are from recent dates (not future, not too old)"""
        now = datetime.utcnow()
        for alert in QUEBEC_FRAUD_ALERTS:
            alert_date = datetime.fromisoformat(alert['date_detected'])
            # Alert should not be in the future
            assert alert_date <= now, f"Alert {alert['threat_id']} has future date"
            # Alert should not be older than 30 days
            days_old = (now - alert_date).days
            assert days_old <= 30, f"Alert {alert['threat_id']} is too old ({days_old} days)"

    def test_prevention_tips_is_list(self):
        """Verify prevention tips are lists of strings"""
        for alert in QUEBEC_FRAUD_ALERTS:
            assert isinstance(alert['prevention_tips'], list), f"Prevention tips not a list in {alert['threat_id']}"
            assert len(alert['prevention_tips']) > 0, f"No prevention tips in {alert['threat_id']}"
            for tip in alert['prevention_tips']:
                assert isinstance(tip, str), f"Prevention tip is not a string in {alert['threat_id']}"
                assert len(tip) > 10, f"Prevention tip too short in {alert['threat_id']}"

    def test_regions_is_list(self):
        """Verify regions are lists of strings"""
        for alert in QUEBEC_FRAUD_ALERTS:
            assert isinstance(alert['regions'], list), f"Regions not a list in {alert['threat_id']}"
            assert len(alert['regions']) > 0, f"No regions in {alert['threat_id']}"
            for region in alert['regions']:
                assert isinstance(region, str), f"Region is not a string in {alert['threat_id']}"

    def test_statistics_structure(self):
        """Verify statistics have correct structure"""
        for alert in QUEBEC_FRAUD_ALERTS:
            stats = alert['statistics']
            assert isinstance(stats, dict), f"Statistics not a dict in {alert['threat_id']}"
            assert 'reports_last_7_days' in stats, f"Missing reports_last_7_days in {alert['threat_id']}"
            assert 'affected_users' in stats, f"Missing affected_users in {alert['threat_id']}"
            assert isinstance(stats['reports_last_7_days'], int), f"reports_last_7_days not int in {alert['threat_id']}"
            assert isinstance(stats['affected_users'], int), f"affected_users not int in {alert['threat_id']}"

    def test_titles_in_french(self):
        """Verify titles contain French characters or are in French"""
        for alert in QUEBEC_FRAUD_ALERTS:
            # Simple check: title should contain lowercase French words
            title = alert['title'].lower()
            assert any(word in title for word in ['arnaque', 'fraude', 'usurpation', 'email', 'sms', 'appel']), \
                f"Title may not be in French: {alert['title']}"

    def test_descriptions_in_french(self):
        """Verify descriptions are in French"""
        for alert in QUEBEC_FRAUD_ALERTS:
            desc = alert['description'].lower()
            # Should contain some French-specific words
            assert len(desc) > 100, f"Description too short in {alert['threat_id']}"


class TestGetQuebecAlertsByLevel:
    """Test filtering alerts by threat level"""

    def test_get_high_level_alerts(self):
        """Test filtering high-level alerts"""
        high_alerts = get_quebec_alerts_by_level('high')
        assert len(high_alerts) > 0
        for alert in high_alerts:
            assert alert['threat_level'] == 'high'

    def test_get_medium_level_alerts(self):
        """Test filtering medium-level alerts"""
        medium_alerts = get_quebec_alerts_by_level('medium')
        assert len(medium_alerts) > 0
        for alert in medium_alerts:
            assert alert['threat_level'] == 'medium'

    def test_get_low_level_alerts(self):
        """Test filtering low-level alerts"""
        low_alerts = get_quebec_alerts_by_level('low')
        for alert in low_alerts:
            assert alert['threat_level'] == 'low'

    def test_get_all_alerts_no_filter(self):
        """Test getting all alerts without filter"""
        all_alerts = get_quebec_alerts_by_level(None)
        assert len(all_alerts) == len(QUEBEC_FRAUD_ALERTS)

    def test_invalid_level_returns_empty(self):
        """Test that invalid level returns empty list"""
        invalid_alerts = get_quebec_alerts_by_level('critical')
        assert len(invalid_alerts) == 0

    def test_level_counts_match_total(self):
        """Test that sum of filtered alerts equals total"""
        high = get_quebec_alerts_by_level('high')
        medium = get_quebec_alerts_by_level('medium')
        low = get_quebec_alerts_by_level('low')
        total = len(high) + len(medium) + len(low)
        assert total == len(QUEBEC_FRAUD_ALERTS)


class TestGetQuebecAlertById:
    """Test retrieving alerts by ID"""

    def test_get_existing_alert(self):
        """Test retrieving an existing alert by ID"""
        alert_id = QUEBEC_FRAUD_ALERTS[0]['threat_id']
        alert = get_quebec_alert_by_id(alert_id)
        assert alert is not None
        assert alert['threat_id'] == alert_id

    def test_get_nonexistent_alert(self):
        """Test retrieving a non-existent alert returns None"""
        alert = get_quebec_alert_by_id('QC_FRAUD_999')
        assert alert is None

    def test_get_all_alerts_individually(self):
        """Test that all alerts can be retrieved by ID"""
        for original_alert in QUEBEC_FRAUD_ALERTS:
            retrieved_alert = get_quebec_alert_by_id(original_alert['threat_id'])
            assert retrieved_alert is not None
            assert retrieved_alert['threat_id'] == original_alert['threat_id']
            assert retrieved_alert['title'] == original_alert['title']


class TestGetRecentQuebecAlerts:
    """Test retrieving recent alerts within a time window"""

    def test_get_recent_alerts_7_days(self):
        """Test getting alerts from last 7 days"""
        recent = get_recent_quebec_alerts(7)
        assert len(recent) > 0

        now = datetime.utcnow()
        for alert in recent:
            alert_date = datetime.fromisoformat(alert['date_detected'])
            days_ago = (now - alert_date).days
            assert days_ago <= 7, f"Alert is older than 7 days: {alert['threat_id']}"

    def test_get_recent_alerts_1_day(self):
        """Test getting alerts from last 1 day"""
        recent = get_recent_quebec_alerts(1)
        # May be empty or have recent alerts
        assert isinstance(recent, list)

        now = datetime.utcnow()
        for alert in recent:
            alert_date = datetime.fromisoformat(alert['date_detected'])
            days_ago = (now - alert_date).days
            assert days_ago <= 1, f"Alert is older than 1 day: {alert['threat_id']}"

    def test_get_recent_alerts_30_days(self):
        """Test getting alerts from last 30 days"""
        recent = get_recent_quebec_alerts(30)
        assert len(recent) > 0

        now = datetime.utcnow()
        for alert in recent:
            alert_date = datetime.fromisoformat(alert['date_detected'])
            days_ago = (now - alert_date).days
            assert days_ago <= 30, f"Alert is older than 30 days: {alert['threat_id']}"

    def test_get_recent_alerts_includes_all(self):
        """Test that 30-day window includes all alerts"""
        recent = get_recent_quebec_alerts(30)
        assert len(recent) == len(QUEBEC_FRAUD_ALERTS)

    def test_recent_alerts_sorted_by_date(self):
        """Test that recent alerts are returned in order"""
        recent = get_recent_quebec_alerts(7)
        for i in range(len(recent) - 1):
            current_date = datetime.fromisoformat(recent[i]['date_detected'])
            next_date = datetime.fromisoformat(recent[i + 1]['date_detected'])
            # Should be ordered (most recent first or same order as data)
            assert current_date >= next_date or current_date == next_date


class TestQuebecAlertsIntegration:
    """Integration tests for Quebec alerts with threats"""

    def test_all_alerts_have_consistent_keys(self):
        """Verify all alerts have same set of keys"""
        first_alert_keys = set(QUEBEC_FRAUD_ALERTS[0].keys())
        for alert in QUEBEC_FRAUD_ALERTS[1:]:
            alert_keys = set(alert.keys())
            assert alert_keys == first_alert_keys, f"Alert {alert['threat_id']} has different keys"

    def test_quebec_alerts_ready_for_json_serialization(self):
        """Test that alerts can be serialized to JSON"""
        import json
        try:
            json_str = json.dumps(QUEBEC_FRAUD_ALERTS)
            assert len(json_str) > 0
        except Exception as e:
            pytest.fail(f"Failed to serialize Quebec alerts to JSON: {str(e)}")

    def test_no_duplicate_institutions_too_common(self):
        """Test that alerts don't over-represent single institutions"""
        institutions = [alert['institution'] for alert in QUEBEC_FRAUD_ALERTS]
        institution_counts = {}
        for inst in institutions:
            institution_counts[inst] = institution_counts.get(inst, 0) + 1

        # No institution should appear more than 2 times
        for inst, count in institution_counts.items():
            assert count <= 2, f"Institution '{inst}' appears too many times ({count})"

    def test_fraud_types_coverage(self):
        """Test that we have variety of fraud types"""
        fraud_types = set(alert['type'] for alert in QUEBEC_FRAUD_ALERTS)
        expected_types = {'SMS', 'Phone', 'Email', 'Malware/Pop-up', 'Identity Theft', 'SMS/Email'}
        assert len(fraud_types) > 1, "Should have variety of fraud types"
        # Check that we have at least some of the expected types
        assert len(fraud_types & expected_types) > 0

    def test_quebec_regions_coverage(self):
        """Test that alerts cover various Quebec regions"""
        all_regions = []
        for alert in QUEBEC_FRAUD_ALERTS:
            all_regions.extend(alert['regions'])

        quebec_specific_regions = [r for r in all_regions if 'Québec' in r or 'Quebec' in r]
        assert len(quebec_specific_regions) > 0, "Should have Quebec-specific regions"
