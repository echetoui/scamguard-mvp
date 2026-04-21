"""
Threat Pattern Analyzer - Emerging Pattern Detection

Analyzes scam descriptions for emerging patterns, keywords, and trending threats.
Generates alerts for new/evolving scam tactics.

Author: ScamGuard ML Team
Date: February 18, 2026
Version: 1.0
"""

import json
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ThreatPatternAnalyzer:
    """
    Analyze scam descriptions for emerging patterns and threats.

    Features:
    - Keyword frequency tracking
    - Pattern clustering and similarity
    - Emerging threat identification
    - Temporal trend analysis
    - Alert generation for new patterns
    """

    def __init__(self):
        """Initialize the pattern analyzer."""
        self.keyword_history = defaultdict(list)
        self.pattern_database = {}
        self.emerging_threats = []
        self.alert_log = []
        self.scam_type_trends = defaultdict(list)
        self.vectorizer = TfidfVectorizer(
            max_features=100,
            min_df=1,
            ngram_range=(1, 2),
            lowercase=True,
            stop_words='english'
        )
        self.fitted_vectorizer = None

        logger.info("Initialized ThreatPatternAnalyzer")

    def analyze_descriptions(self, descriptions: List[Dict]) -> Dict:
        """
        Analyze batch of scam descriptions for patterns.

        Args:
            descriptions: List of {"text": "...", "scam_type": "...", "timestamp": "..."} dicts

        Returns:
            Analysis results with patterns and alerts
        """
        logger.info(f"Analyzing {len(descriptions)} descriptions for patterns")

        patterns = {}
        keyword_frequency = Counter()
        scam_type_counts = Counter()
        alerts = []

        for desc in descriptions:
            text = desc.get('text', '').lower()
            scam_type = desc.get('scam_type', 'unknown')
            timestamp = desc.get('timestamp', datetime.now().isoformat())

            # Extract keywords (words >3 chars)
            keywords = [word for word in text.split() if len(word) > 3]
            keyword_frequency.update(keywords)

            # Track scam type
            scam_type_counts[scam_type] += 1

            # Store in history
            for keyword in keywords:
                self.keyword_history[keyword].append({
                    'timestamp': timestamp,
                    'scam_type': scam_type,
                    'text_snippet': text[:50]
                })

        # Analyze trends
        trend_analysis = self._analyze_trends(keyword_frequency, scam_type_counts)

        # Identify emerging patterns
        emerging = self._identify_emerging_patterns(keyword_frequency)

        # Generate alerts
        alerts = self._generate_alerts(keyword_frequency, trend_analysis, emerging)

        return {
            'total_analyzed': len(descriptions),
            'unique_keywords': len(keyword_frequency),
            'top_keywords': keyword_frequency.most_common(20),
            'scam_type_distribution': dict(scam_type_counts),
            'trend_analysis': trend_analysis,
            'emerging_patterns': emerging,
            'alerts': alerts,
            'timestamp': datetime.now().isoformat()
        }

    def _analyze_trends(
        self,
        keyword_frequency: Counter,
        scam_type_counts: Counter
    ) -> Dict:
        """
        Analyze temporal trends in scam patterns.

        Args:
            keyword_frequency: Keyword occurrence counter
            scam_type_counts: Scam type counter

        Returns:
            Trend analysis results
        """
        trends = {}

        # Keyword velocity (frequency increase rate)
        for keyword, count in keyword_frequency.most_common(10):
            if keyword in self.keyword_history:
                history = self.keyword_history[keyword]
                if len(history) >= 2:
                    # Calculate growth rate
                    recent = len([h for h in history if datetime.fromisoformat(h['timestamp']) > datetime.now() - timedelta(days=7)])
                    old = len(history) - recent
                    velocity = (recent - old) / max(old, 1)
                    trends[keyword] = {
                        'count': count,
                        'velocity': velocity,
                        'trend': 'rising' if velocity > 0.5 else 'declining' if velocity < -0.5 else 'stable'
                    }

        return {
            'keyword_trends': trends,
            'dominant_scam_types': dict(scam_type_counts.most_common(5)),
            'scam_type_velocity': {
                st: len([k for k, c in keyword_frequency.items() if self._is_type_keyword(k, st)])
                for st in scam_type_counts.keys()
            }
        }

    def _identify_emerging_patterns(self, keyword_frequency: Counter) -> List[Dict]:
        """
        Identify new or emerging scam patterns.

        Patterns are keywords/phrases with:
        - Rapid recent increase
        - Low historical frequency
        - High co-occurrence
        """
        emerging = []

        # New keywords (appeared recently but low total count)
        for keyword, count in keyword_frequency.items():
            if keyword in self.keyword_history:
                history = self.keyword_history[keyword]
                recent_count = len([
                    h for h in history
                    if datetime.fromisoformat(h['timestamp']) > datetime.now() - timedelta(days=3)
                ])

                # Score: high recent count + low total count = emerging
                if recent_count >= 2 and count <= 10:
                    emerging_score = recent_count / max(count, 1)
                    if emerging_score > 0.3:
                        emerging.append({
                            'keyword': keyword,
                            'recent_count': recent_count,
                            'total_count': count,
                            'emerging_score': emerging_score,
                            'scam_types': list(set([
                                h['scam_type'] for h in history[-recent_count:]
                            ])),
                            'first_seen': min([h['timestamp'] for h in history]),
                            'last_seen': max([h['timestamp'] for h in history])
                        })

        # Sort by emerging score
        emerging.sort(key=lambda x: x['emerging_score'], reverse=True)
        return emerging[:20]  # Top 20 emerging patterns

    def _generate_alerts(
        self,
        keyword_frequency: Counter,
        trend_analysis: Dict,
        emerging_patterns: List[Dict]
    ) -> List[Dict]:
        """
        Generate alerts for detected patterns.

        Args:
            keyword_frequency: Keyword frequencies
            trend_analysis: Trend analysis results
            emerging_patterns: Identified emerging patterns

        Returns:
            List of alerts
        """
        alerts = []

        # Alert for high-risk trending keywords
        high_risk_keywords = [
            'urgent', 'emergency', 'immediate', 'wire', 'payment',
            'verify', 'confirm', 'account', 'bank', 'crypto'
        ]

        for keyword in high_risk_keywords:
            if keyword in keyword_frequency:
                count = keyword_frequency[keyword]
                if count >= 3:
                    alerts.append({
                        'type': 'high_risk_keyword',
                        'keyword': keyword,
                        'count': count,
                        'severity': 'HIGH' if count >= 10 else 'MEDIUM',
                        'message': f'High-risk keyword "{keyword}" detected {count} times',
                        'recommendation': 'Monitor for financial coercion scams',
                        'timestamp': datetime.now().isoformat()
                    })

        # Alert for emerging patterns
        for pattern in emerging_patterns[:5]:
            alerts.append({
                'type': 'emerging_pattern',
                'pattern': pattern['keyword'],
                'emerging_score': pattern['emerging_score'],
                'severity': 'HIGH' if pattern['emerging_score'] > 0.5 else 'MEDIUM',
                'scam_types_affected': pattern['scam_types'],
                'message': f'Emerging scam pattern detected: "{pattern["keyword"]}"',
                'recommendation': 'Review automated knowledge base update',
                'first_seen': pattern['first_seen'],
                'timestamp': datetime.now().isoformat()
            })

        # Alert for scam type surge
        for scam_type, count in trend_analysis['dominant_scam_types'].items():
            if count >= 5:
                alerts.append({
                    'type': 'scam_type_surge',
                    'scam_type': scam_type,
                    'count': count,
                    'severity': 'HIGH' if count >= 15 else 'MEDIUM',
                    'message': f'Surge detected: {count} {scam_type} scams reported',
                    'recommendation': 'Update threat intelligence feed',
                    'timestamp': datetime.now().isoformat()
                })

        # Store alerts in log
        self.alert_log.extend(alerts)
        return alerts

    def extract_pattern_rules(self, descriptions: List[str]) -> Dict:
        """
        Extract potential pattern-based detection rules from descriptions.

        Args:
            descriptions: List of scam description texts

        Returns:
            Extracted rules for knowledge base
        """
        # High-risk phrase patterns
        phrase_patterns = {
            'money_request': {
                'patterns': ['send money', 'wire', 'payment', 'transfer', 'cash'],
                'count': 0
            },
            'urgency': {
                'patterns': ['urgent', 'immediate', 'asap', 'right now', 'emergency'],
                'count': 0
            },
            'trust_building': {
                'patterns': ['trust me', 'believe me', 'promise', 'guarantee', 'i love you'],
                'count': 0
            },
            'identity_mimicry': {
                'patterns': ['official', 'government', 'bank', 'revenue', 'police'],
                'count': 0
            },
            'prize_offering': {
                'patterns': ['won', 'prize', 'reward', 'million', 'free', 'congratulations'],
                'count': 0
            }
        }

        # Count pattern matches
        for desc in descriptions:
            desc_lower = desc.lower()
            for category, data in phrase_patterns.items():
                if any(pattern in desc_lower for pattern in data['patterns']):
                    data['count'] += 1

        # Calculate pattern metrics
        for category, data in phrase_patterns.items():
            data['frequency'] = data['count'] / len(descriptions) if descriptions else 0
            data['reliability'] = 'high' if data['frequency'] > 0.7 else 'medium' if data['frequency'] > 0.3 else 'low'

        return {
            'total_analyzed': len(descriptions),
            'pattern_rules': phrase_patterns,
            'timestamp': datetime.now().isoformat()
        }

    def cluster_similar_descriptions(
        self,
        descriptions: List[str],
        n_clusters: int = 5
    ) -> Dict:
        """
        Group similar descriptions to identify scam pattern clusters.

        Args:
            descriptions: List of scam descriptions
            n_clusters: Number of clusters to form

        Returns:
            Clustering results
        """
        if len(descriptions) < n_clusters:
            return {'status': 'insufficient_data', 'message': 'Need more descriptions'}

        try:
            # Vectorize descriptions
            tfidf_vectors = self.vectorizer.fit_transform(descriptions)
            self.fitted_vectorizer = self.vectorizer

            # Simple clustering: find top terms per description
            # (more sophisticated clustering would use KMeans)
            clusters = defaultdict(list)

            # Group by dominant terms
            for idx, desc in enumerate(descriptions):
                # Find top keyword
                keywords = [word for word in desc.lower().split() if len(word) > 3]
                if keywords:
                    top_keyword = Counter(keywords).most_common(1)[0][0]
                    clusters[top_keyword].append({
                        'index': idx,
                        'description': desc[:100]
                    })

            return {
                'n_clusters': len(clusters),
                'cluster_sizes': {k: len(v) for k, v in clusters.items()},
                'clusters': dict(clusters),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Clustering error: {e}")
            return {'status': 'error', 'message': str(e)}

    def get_alert_summary(self, hours: int = 24) -> Dict:
        """
        Get summary of recent alerts.

        Args:
            hours: Hours to look back

        Returns:
            Alert summary
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent_alerts = [
            a for a in self.alert_log
            if datetime.fromisoformat(a['timestamp']) > cutoff_time
        ]

        # Categorize alerts
        by_type = defaultdict(list)
        by_severity = defaultdict(list)

        for alert in recent_alerts:
            by_type[alert['type']].append(alert)
            by_severity[alert['severity']].append(alert)

        return {
            'period_hours': hours,
            'total_alerts': len(recent_alerts),
            'by_type': {k: len(v) for k, v in by_type.items()},
            'by_severity': {k: len(v) for k, v in by_severity.items()},
            'critical_alerts': [a for a in recent_alerts if a['severity'] == 'HIGH'],
            'timestamp': datetime.now().isoformat()
        }

    def export_pattern_database(self) -> Dict:
        """Export pattern database for knowledge base update."""
        return {
            'total_keywords_tracked': len(self.keyword_history),
            'total_alerts_generated': len(self.alert_log),
            'emerging_threat_count': len(self.emerging_threats),
            'keyword_history_size': sum(len(v) for v in self.keyword_history.values()),
            'timestamp': datetime.now().isoformat()
        }


if __name__ == '__main__':
    print("Threat Pattern Analyzer Module")
    print("=" * 50)
    print("Detects emerging scam patterns and generates alerts.")
    print("Integrates with anomaly_detector.py for complete analysis.")
