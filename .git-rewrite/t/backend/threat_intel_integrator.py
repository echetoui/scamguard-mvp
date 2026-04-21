"""
Threat Intelligence Integrator

Integrates multiple external threat intelligence feeds to provide real-time
threat data for scam detection and risk assessment.

Supports:
- AlienVault OTX (Open Threat Exchange)
- Abuse.ch (Phishing and Malware Database)
- CISA Alerts (Cybersecurity & Infrastructure Security Agency)

Author: ScamGuard Threat Intelligence Team
Date: February 18, 2026
Version: 1.0
"""

import requests
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ThreatSource(Enum):
    """Supported threat intelligence sources."""
    ALIENVAULT_OTX = "alienvault_otx"
    ABUSE_CH_PHISHING = "abuse_ch_phishing"
    ABUSE_CH_MALWARE = "abuse_ch_malware"
    CISA_ALERTS = "cisa_alerts"


@dataclass
class ThreatIndicator:
    """Standardized threat indicator format."""
    type: str  # domain, ip, email, url, hash, etc.
    value: str  # Actual indicator value
    source: str  # Which feed provided this
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    scam_types: List[str]  # Associated scam types
    first_seen: str  # ISO datetime
    last_seen: str  # ISO datetime
    confidence: float  # 0-1.0
    metadata: Dict  # Additional context
    source_id: str  # ID in original source


class ThreatIntelligenceIntegrator:
    """
    Integrates multiple threat intelligence feeds.

    Features:
    - Multi-source integration (OTX, Abuse.ch, CISA)
    - Standardized threat indicator format
    - Deduplication across sources
    - Confidence scoring
    - Cross-referencing with internal patterns
    """

    # API Endpoints
    ENDPOINTS = {
        ThreatSource.ALIENVAULT_OTX: "https://otx.alienvault.com/api/v1",
        ThreatSource.ABUSE_CH_PHISHING: "https://phishing.abuse.ch/api/v1",
        ThreatSource.ABUSE_CH_MALWARE: "https://malware-traffic-analysis.net/api",
        ThreatSource.CISA_ALERTS: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    }

    def __init__(self, api_keys: Optional[Dict[str, str]] = None):
        """
        Initialize integrator with optional API keys.

        Args:
            api_keys: Dictionary of {source: api_key} for authenticated feeds
        """
        self.api_keys = api_keys or {}
        self.threat_cache = {}
        self.last_update = {}
        self.indicators_by_source = {}
        self.deduplication_map = {}  # Map duplicate indicators to primary

        logger.info("Initialized ThreatIntelligenceIntegrator")

    def fetch_from_alienvault_otx(self, query: Optional[str] = None) -> List[ThreatIndicator]:
        """
        Fetch threat indicators from AlienVault OTX.

        Args:
            query: Optional search query (domain, IP, hash, etc.)

        Returns:
            List of threat indicators
        """
        logger.info("Fetching from AlienVault OTX")
        indicators = []

        try:
            # Get pulses (threat collections)
            url = f"{self.ENDPOINTS[ThreatSource.ALIENVAULT_OTX]}/pulses/subscribed"
            headers = {"X-OTX-API-KEY": self.api_keys.get(ThreatSource.ALIENVAULT_OTX.value, "")}

            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()

            data = response.json()
            pulses = data.get('results', [])

            for pulse in pulses[:10]:  # Limit to recent 10 pulses
                # Extract indicators from pulse
                for indicator_type, indicators_list in pulse.get('indicators', {}).items():
                    for indicator_data in indicators_list[:5]:  # Limit per type
                        indicator = ThreatIndicator(
                            type=indicator_type,
                            value=indicator_data.get('indicator', ''),
                            source=ThreatSource.ALIENVAULT_OTX.value,
                            severity=self._map_otx_severity(indicator_data),
                            scam_types=self._detect_scam_types_from_indicator(indicator_data),
                            first_seen=pulse.get('created', datetime.now().isoformat()),
                            last_seen=pulse.get('modified', datetime.now().isoformat()),
                            confidence=0.85,
                            metadata={
                                'pulse_id': pulse.get('id'),
                                'pulse_name': pulse.get('name'),
                                'tlp': pulse.get('tlp', 'white')
                            },
                            source_id=pulse.get('id')
                        )
                        indicators.append(indicator)

            logger.info(f"Fetched {len(indicators)} indicators from AlienVault OTX")
            return indicators

        except requests.RequestException as e:
            logger.error(f"AlienVault OTX fetch error: {e}")
            return []

    def fetch_from_abuse_ch(self) -> List[ThreatIndicator]:
        """
        Fetch threat indicators from Abuse.ch databases.

        Returns:
            List of threat indicators
        """
        logger.info("Fetching from Abuse.ch")
        indicators = []

        try:
            # Fetch phishing database
            url = "https://phishing.abuse.ch/downloads/phishing_feed.csv"
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            lines = response.text.split('\n')[1:]  # Skip header
            for line in lines[:100]:  # Limit to first 100
                if not line.strip():
                    continue

                parts = line.split(',')
                if len(parts) >= 3:
                    indicator = ThreatIndicator(
                        type='url',
                        value=parts[0].strip(),
                        source=ThreatSource.ABUSE_CH_PHISHING.value,
                        severity='HIGH',
                        scam_types=['phishing'],
                        first_seen=datetime.now().isoformat(),
                        last_seen=datetime.now().isoformat(),
                        confidence=0.90,
                        metadata={
                            'host': parts[1].strip() if len(parts) > 1 else '',
                            'date_added': parts[2].strip() if len(parts) > 2 else ''
                        },
                        source_id=hashlib.sha256(parts[0].encode()).hexdigest()[:16]
                    )
                    indicators.append(indicator)

            logger.info(f"Fetched {len(indicators)} phishing URLs from Abuse.ch")
            return indicators

        except requests.RequestException as e:
            logger.error(f"Abuse.ch fetch error: {e}")
            return []

    def fetch_from_cisa(self) -> List[ThreatIndicator]:
        """
        Fetch threat alerts from CISA (Known Exploited Vulnerabilities).

        Returns:
            List of threat indicators
        """
        logger.info("Fetching from CISA")
        indicators = []

        try:
            url = self.ENDPOINTS[ThreatSource.CISA_ALERTS]
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            data = response.json()
            vulnerabilities = data.get('vulnerabilities', [])[:50]  # Limit to first 50

            for vuln in vulnerabilities:
                indicator = ThreatIndicator(
                    type='vulnerability',
                    value=vuln.get('cveID', ''),
                    source=ThreatSource.CISA_ALERTS.value,
                    severity='CRITICAL' if vuln.get('dateAdded') else 'HIGH',
                    scam_types=['tech_support', 'phishing'],  # Often used in tech scams
                    first_seen=vuln.get('dateAdded', datetime.now().isoformat()),
                    last_seen=datetime.now().isoformat(),
                    confidence=0.95,
                    metadata={
                        'product': vuln.get('product', ''),
                        'vendor': vuln.get('vendor', ''),
                        'notes': vuln.get('notes', '')
                    },
                    source_id=vuln.get('cveID', '')
                )
                indicators.append(indicator)

            logger.info(f"Fetched {len(indicators)} CVEs from CISA")
            return indicators

        except requests.RequestException as e:
            logger.error(f"CISA fetch error: {e}")
            return []

    def fetch_all_sources(self, api_keys: Optional[Dict] = None) -> Dict[str, List[ThreatIndicator]]:
        """
        Fetch indicators from all available sources.

        Args:
            api_keys: Optional updated API keys

        Returns:
            Dictionary mapping source names to indicator lists
        """
        if api_keys:
            self.api_keys = api_keys

        logger.info("Fetching from all threat intelligence sources")

        all_indicators = {
            'alienvault_otx': self.fetch_from_alienvault_otx(),
            'abuse_ch_phishing': self.fetch_from_abuse_ch(),
            'cisa_alerts': self.fetch_from_cisa()
        }

        # Store in cache
        self.indicators_by_source = all_indicators

        # Update last fetch time
        for source in all_indicators.keys():
            self.last_update[source] = datetime.now().isoformat()

        # Consolidate and deduplicate
        consolidated = self._deduplicate_indicators(all_indicators)

        return {
            'by_source': all_indicators,
            'consolidated': consolidated,
            'total_indicators': sum(len(v) for v in all_indicators.values()),
            'deduplicated_count': len(consolidated),
            'fetch_timestamp': datetime.now().isoformat()
        }

    def _deduplicate_indicators(self, indicators_by_source: Dict) -> List[ThreatIndicator]:
        """
        Remove duplicate indicators across sources.

        Args:
            indicators_by_source: Indicators grouped by source

        Returns:
            Deduplicated list of indicators
        """
        seen = {}  # Map of (type, value) -> primary indicator
        consolidated = []

        for source, indicators in indicators_by_source.items():
            for indicator in indicators:
                key = (indicator.type, indicator.value)

                if key in seen:
                    # Merge with existing
                    existing = seen[key]
                    existing.confidence = max(existing.confidence, indicator.confidence)
                    existing.scam_types = list(set(existing.scam_types + indicator.scam_types))
                    existing.metadata['sources'] = existing.metadata.get('sources', []) + [source]
                else:
                    # New indicator
                    indicator.metadata['sources'] = [source]
                    seen[key] = indicator
                    consolidated.append(indicator)

        logger.info(f"Deduplicated to {len(consolidated)} unique indicators")
        return consolidated

    def cross_reference_with_patterns(
        self,
        indicators: List[ThreatIndicator],
        internal_patterns: List[Dict]
    ) -> Dict:
        """
        Cross-reference threat indicators with internal scam patterns.

        Args:
            indicators: Threat indicators from external sources
            internal_patterns: Patterns from emerging threat detection

        Returns:
            Cross-reference results
        """
        matches = []

        for indicator in indicators:
            for pattern in internal_patterns:
                # Check for keyword matches
                pattern_keywords = pattern.get('keywords', [])
                indicator_value_lower = indicator.value.lower()

                for keyword in pattern_keywords:
                    if keyword.lower() in indicator_value_lower:
                        matches.append({
                            'indicator': indicator.value,
                            'indicator_type': indicator.type,
                            'indicator_source': indicator.source,
                            'pattern': pattern.get('name'),
                            'pattern_keywords': pattern_keywords,
                            'scam_types_overlap': list(set(
                                indicator.scam_types + pattern.get('scam_types', [])
                            )),
                            'combined_severity': self._calculate_combined_severity(
                                indicator.severity,
                                pattern.get('severity', 'MEDIUM')
                            ),
                            'match_confidence': 0.9,
                            'timestamp': datetime.now().isoformat()
                        })

        logger.info(f"Found {len(matches)} cross-reference matches")
        return {
            'total_matches': len(matches),
            'matches': matches,
            'timestamp': datetime.now().isoformat()
        }

    def _map_otx_severity(self, indicator_data: Dict) -> str:
        """Map OTX indicator severity to standard levels."""
        type_ = indicator_data.get('type', '').lower()
        if type_ in ['malware', 'c2']:
            return 'CRITICAL'
        elif type_ in ['phishing', 'injector']:
            return 'HIGH'
        return 'MEDIUM'

    def _detect_scam_types_from_indicator(self, indicator_data: Dict) -> List[str]:
        """Detect likely scam types from indicator metadata."""
        description = indicator_data.get('description', '').lower()
        scam_types = []

        if any(word in description for word in ['phish', 'credential', 'banking']):
            scam_types.append('phishing')
        if any(word in description for word in ['malware', 'trojan', 'ransomware']):
            scam_types.append('tech_support')
        if any(word in description for word in ['investment', 'crypto', 'forex']):
            scam_types.append('investment')

        return scam_types if scam_types else ['other']

    def _calculate_combined_severity(self, sev1: str, sev2: str) -> str:
        """Calculate combined severity from two sources."""
        severity_levels = {'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0}
        max_level = max(severity_levels.get(sev1, 0), severity_levels.get(sev2, 0))

        for level, value in severity_levels.items():
            if value == max_level:
                return level
        return 'MEDIUM'

    def get_feed_status(self) -> Dict:
        """Get status of all threat feeds."""
        return {
            'feeds': {
                'alienvault_otx': {
                    'status': 'active' if 'alienvault_otx' in self.last_update else 'inactive',
                    'last_update': self.last_update.get('alienvault_otx'),
                    'indicator_count': len(self.indicators_by_source.get('alienvault_otx', []))
                },
                'abuse_ch_phishing': {
                    'status': 'active' if 'abuse_ch_phishing' in self.last_update else 'inactive',
                    'last_update': self.last_update.get('abuse_ch_phishing'),
                    'indicator_count': len(self.indicators_by_source.get('abuse_ch_phishing', []))
                },
                'cisa_alerts': {
                    'status': 'active' if 'cisa_alerts' in self.last_update else 'inactive',
                    'last_update': self.last_update.get('cisa_alerts'),
                    'indicator_count': len(self.indicators_by_source.get('cisa_alerts', []))
                }
            },
            'total_indicators': sum(
                len(v) for v in self.indicators_by_source.values()
            ),
            'last_full_update': max(self.last_update.values()) if self.last_update else None
        }

    def export_indicators_for_database(self, indicators: List[ThreatIndicator]) -> List[Dict]:
        """
        Export indicators in database-ready format.

        Args:
            indicators: Threat indicators to export

        Returns:
            Database-ready dictionaries
        """
        return [
            {
                'indicator_type': ind.type,
                'indicator_value': ind.value,
                'source': ind.source,
                'severity': ind.severity,
                'scam_types': ind.scam_types,
                'first_seen': ind.first_seen,
                'last_seen': ind.last_seen,
                'confidence': ind.confidence,
                'metadata_json': json.dumps(ind.metadata),
                'source_id': ind.source_id,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            for ind in indicators
        ]


if __name__ == '__main__':
    print("Threat Intelligence Integrator Module")
    print("=" * 50)
    print("Integrates multiple external threat feeds.")
    print("See threat_intel_updater.py for scheduled updates.")
