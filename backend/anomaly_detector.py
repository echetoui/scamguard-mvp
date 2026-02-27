"""
Anomaly Detection for Emerging Scam Patterns

Detects novel and emerging scam patterns using unsupervised learning techniques.
Identifies scams that deviate from known patterns to catch evolving threats.

Author: ScamGuard ML Team
Date: February 18, 2026
Version: 1.0
"""

import numpy as np
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Detect anomalous/emerging scam patterns using multiple techniques.

    Features:
    - Isolation Forest for novelty detection
    - Statistical anomaly detection
    - Clustering-based outlier identification
    - Temporal pattern analysis
    - Confidence scoring for anomaly severity
    """

    def __init__(self, contamination: float = 0.05):
        """
        Initialize the anomaly detector.

        Args:
            contamination: Expected proportion of anomalies (0.01-0.1)
        """
        self.contamination = contamination
        self.isolation_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.scaler = StandardScaler()
        self.pca = None
        self.dbscan = DBSCAN(eps=0.3, min_samples=2)
        self.is_trained = False
        self.feature_history = []
        self.anomaly_history = []
        self.baseline_stats = None

        logger.info(f"Initialized AnomalyDetector with contamination={contamination}")

    def train(self, feature_vectors: np.ndarray) -> Dict:
        """
        Train anomaly detection models on baseline data.

        Args:
            feature_vectors: 2D array of TF-IDF or embedding features

        Returns:
            Training metrics dictionary
        """
        logger.info(f"Training anomaly detector on {feature_vectors.shape[0]} samples")

        # Scale features
        scaled_features = self.scaler.fit_transform(feature_vectors)

        # Train Isolation Forest
        self.isolation_forest.fit(scaled_features)

        # Store baseline statistics
        self.baseline_stats = {
            'mean': np.mean(scaled_features, axis=0),
            'std': np.std(scaled_features, axis=0),
            'min': np.min(scaled_features, axis=0),
            'max': np.max(scaled_features, axis=0),
            'n_features': scaled_features.shape[1]
        }

        # Optional: Apply PCA for visualization
        if scaled_features.shape[1] > 2:
            self.pca = PCA(n_components=2)
            self.pca.fit(scaled_features)

        self.is_trained = True

        return {
            'status': 'success',
            'samples_trained': feature_vectors.shape[0],
            'features': feature_vectors.shape[1],
            'contamination': self.contamination,
            'training_date': datetime.now().isoformat()
        }

    def detect_anomalies(
        self,
        feature_vectors: np.ndarray,
        threshold: float = 0.7
    ) -> Dict:
        """
        Detect anomalies in new feature vectors.

        Args:
            feature_vectors: 2D array of new features to analyze
            threshold: Anomaly score threshold (0-1)

        Returns:
            Dictionary with anomaly detection results
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained before detection")

        # Scale features
        scaled_features = self.scaler.transform(feature_vectors)

        # Get anomaly scores (-1 for anomalies, 1 for inliers)
        predictions = self.isolation_forest.predict(scaled_features)
        anomaly_scores = -self.isolation_forest.score_samples(scaled_features)

        # Normalize scores to 0-1
        anomaly_scores_normalized = 1 / (1 + np.exp(-anomaly_scores))

        # Identify anomalies
        anomalies = anomaly_scores_normalized >= threshold

        # Cluster-based detection
        cluster_labels = self.dbscan.fit_predict(scaled_features)
        noise_points = cluster_labels == -1  # Points not in any cluster

        # Combine detections
        combined_anomalies = anomalies | noise_points

        result = {
            'total_samples': len(feature_vectors),
            'anomalies_detected': int(np.sum(combined_anomalies)),
            'anomaly_rate': float(np.mean(combined_anomalies)),
            'anomaly_scores': anomaly_scores_normalized.tolist(),
            'anomaly_indices': np.where(combined_anomalies)[0].tolist(),
            'high_confidence_anomalies': np.where(anomaly_scores_normalized >= threshold)[0].tolist(),
            'cluster_analysis': {
                'n_clusters': len(set(cluster_labels)) - (1 if -1 in cluster_labels else 0),
                'n_noise_points': int(np.sum(noise_points))
            },
            'detection_method': 'isolation_forest + clustering',
            'timestamp': datetime.now().isoformat()
        }

        # Store in history
        self.anomaly_history.append({
            'timestamp': datetime.now().isoformat(),
            'detection_result': result
        })

        return result

    def get_anomaly_scores(
        self,
        feature_vectors: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Get raw anomaly scores without classification.

        Args:
            feature_vectors: Feature vectors to score

        Returns:
            Tuple of (anomaly_scores, normalized_scores)
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained first")

        scaled_features = self.scaler.transform(feature_vectors)
        raw_scores = -self.isolation_forest.score_samples(scaled_features)
        normalized_scores = 1 / (1 + np.exp(-raw_scores))

        return raw_scores, normalized_scores

    def detect_statistical_anomalies(
        self,
        threat_scores: List[float],
        window_size: int = 30,
        z_threshold: float = 3.0
    ) -> Dict:
        """
        Detect statistical anomalies in threat scores over time.

        Args:
            threat_scores: List of threat scores (0-100)
            window_size: Time window for moving average
            z_threshold: Z-score threshold for anomaly

        Returns:
            Statistical anomaly results
        """
        scores = np.array(threat_scores)

        # Calculate moving average and std
        moving_avg = np.convolve(scores, np.ones(window_size)/window_size, mode='valid')
        moving_std = np.array([
            np.std(scores[max(0, i-window_size+1):i+1])
            for i in range(len(scores))
        ])

        # Z-score calculation
        z_scores = np.abs((scores - np.mean(scores)) / (np.std(scores) + 1e-6))

        # Identify anomalies
        anomalous_indices = np.where(z_scores > z_threshold)[0]

        # Trend analysis
        recent_scores = scores[-window_size:] if len(scores) >= window_size else scores
        trend = 'increasing' if np.mean(recent_scores[-10:]) > np.mean(recent_scores[:10]) else 'decreasing'

        return {
            'anomalous_count': len(anomalous_indices),
            'anomalous_indices': anomalous_indices.tolist(),
            'anomalous_scores': scores[anomalous_indices].tolist() if len(anomalous_indices) > 0 else [],
            'z_scores': z_scores.tolist(),
            'mean_score': float(np.mean(scores)),
            'std_score': float(np.std(scores)),
            'recent_trend': trend,
            'recent_mean': float(np.mean(recent_scores)),
            'timestamp': datetime.now().isoformat()
        }

    def find_similar_anomalies(
        self,
        anomaly_features: np.ndarray,
        historical_data: np.ndarray,
        similarity_threshold: float = 0.8
    ) -> Dict:
        """
        Find similar patterns to detected anomalies in historical data.

        Args:
            anomaly_features: Features of detected anomaly
            historical_data: Historical feature vectors
            similarity_threshold: Cosine similarity threshold

        Returns:
            Similar patterns found
        """
        # Calculate cosine similarity
        similarities = cosine_similarity(
            anomaly_features.reshape(1, -1),
            historical_data
        )[0]

        # Find similar patterns
        similar_indices = np.where(similarities >= similarity_threshold)[0]

        return {
            'anomaly_count': len(anomaly_features),
            'similar_patterns_found': len(similar_indices),
            'similar_indices': similar_indices.tolist(),
            'similarity_scores': similarities[similar_indices].tolist() if len(similar_indices) > 0 else [],
            'max_similarity': float(np.max(similarities)) if len(similarities) > 0 else 0.0,
            'threshold': similarity_threshold,
            'timestamp': datetime.now().isoformat()
        }

    def get_detection_history(self, hours: int = 24) -> List[Dict]:
        """
        Get anomaly detection history for specified time period.

        Args:
            hours: Number of hours to look back

        Returns:
            List of recent detections
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent = [
            item for item in self.anomaly_history
            if datetime.fromisoformat(item['timestamp']) > cutoff_time
        ]
        return recent

    def export_baseline_stats(self) -> Dict:
        """Export baseline statistics for monitoring."""
        if not self.baseline_stats:
            return {'status': 'not_trained'}

        return {
            'status': 'trained',
            'is_trained': self.is_trained,
            'baseline_stats': {
                'n_features': self.baseline_stats['n_features'],
                'feature_means': self.baseline_stats['mean'].tolist(),
                'feature_stds': self.baseline_stats['std'].tolist(),
                'contamination': self.contamination
            },
            'training_date': self.anomaly_history[0]['timestamp'] if self.anomaly_history else None
        }


if __name__ == '__main__':
    print("Anomaly Detection Module")
    print("=" * 50)
    print("Detects emerging scam patterns using unsupervised learning.")
    print("See threat_pattern_analyzer.py for pattern analysis integration.")
