"""
Machine Learning Threat Scorer for ScamGuard

Trains and manages ML models for improved scam threat detection.
Supports multiple algorithms and confidence scoring.

Author: ScamGuard ML Team
Date: February 18, 2026
Version: 1.0
"""

import json
import pickle
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ThreatScorerML:
    """
    Machine Learning based threat scorer for scam analysis.

    Features:
    - Supports multiple scam types (romance, tech support, prize, etc.)
    - Confidence scoring for predictions
    - Model persistence (save/load)
    - Performance metrics tracking
    - Retraining capability
    """

    # Scam type classifications
    SCAM_TYPES = {
        'romance': 'Romance Scam',
        'tech_support': 'Tech Support Scam',
        'prize': 'Prize/Lottery Scam',
        'phishing': 'Phishing Scam',
        'employment': 'Employment Scam',
        'investment': 'Investment Scam',
        'impersonation': 'Impersonation Scam',
        'money_flip': 'Money Flip Scam',
        'grandparent': 'Grandparent Scam',
        'other': 'Other/Suspicious'
    }

    # Risk score multipliers by scam type
    RISK_MULTIPLIERS = {
        'romance': 1.2,
        'tech_support': 1.1,
        'prize': 0.9,
        'phishing': 1.3,
        'employment': 0.8,
        'investment': 1.2,
        'impersonation': 1.1,
        'money_flip': 1.0,
        'grandparent': 1.3,
        'other': 0.7
    }

    def __init__(self, model_type: str = 'random_forest'):
        """
        Initialize the threat scorer.

        Args:
            model_type: Type of model to use ('random_forest' or 'gradient_boosting')
        """
        self.model_type = model_type
        self.model = None
        self.vectorizer = None
        self.is_trained = False
        self.performance_metrics = None
        self.training_date = None
        self.training_samples = 0

        logger.info(f"Initialized ThreatScorerML with model type: {model_type}")

    def _build_pipeline(self) -> Pipeline:
        """Build ML pipeline with vectorizer and classifier."""

        if self.model_type == 'random_forest':
            classifier = RandomForestClassifier(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1,
                class_weight='balanced'
            )
        else:  # gradient_boosting
            classifier = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42,
                verbose=0
            )

        # TF-IDF vectorizer for text feature extraction
        vectorizer = TfidfVectorizer(
            max_features=500,
            min_df=2,
            max_df=0.8,
            ngram_range=(1, 2),
            lowercase=True,
            strip_accents='unicode'
        )

        # Pipeline: vectorize → classify
        pipeline = Pipeline([
            ('tfidf', vectorizer),
            ('classifier', classifier)
        ])

        return pipeline

    def train(
        self,
        texts: List[str],
        labels: List[str],
        test_size: float = 0.2,
        cv_folds: int = 5
    ) -> Dict:
        """
        Train the ML model on labeled scam descriptions.

        Args:
            texts: List of scam description texts
            labels: List of scam type labels (should match SCAM_TYPES keys)
            test_size: Proportion of data to use for testing
            cv_folds: Number of cross-validation folds

        Returns:
            Dictionary with training metrics
        """
        logger.info(f"Starting training with {len(texts)} samples, {len(set(labels))} classes")

        # Validate inputs
        if len(texts) != len(labels):
            raise ValueError("Number of texts and labels must match")

        if not texts:
            raise ValueError("Training data cannot be empty")

        # Convert labels to indices
        unique_labels = sorted(set(labels))
        label_to_idx = {label: idx for idx, label in enumerate(unique_labels)}
        label_indices = [label_to_idx[label] for label in labels]

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            texts,
            label_indices,
            test_size=test_size,
            random_state=42,
            stratify=label_indices
        )

        # Build and train pipeline
        self.model = self._build_pipeline()
        self.model.fit(X_train, y_train)

        # Store vectorizer for later use
        self.vectorizer = self.model.named_steps['tfidf']

        # Evaluate on test set
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

        # Cross-validation score
        cv_scores = cross_val_score(self.model, X_train, y_train, cv=cv_folds)

        # Store metrics
        self.performance_metrics = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'test_samples': len(X_test),
            'train_samples': len(X_train),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
            'classification_report': classification_report(
                y_test,
                y_pred,
                target_names=unique_labels,
                output_dict=True
            )
        }

        self.is_trained = True
        self.training_date = datetime.now().isoformat()
        self.training_samples = len(texts)

        logger.info(f"Training complete. Accuracy: {accuracy:.4f}, F1: {f1:.4f}")
        logger.info(f"Cross-validation score: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

        return {
            'status': 'success',
            'metrics': self.performance_metrics,
            'training_date': self.training_date,
            'model_type': self.model_type
        }

    def predict_with_confidence(
        self,
        text: str,
        include_probabilities: bool = True
    ) -> Dict:
        """
        Predict scam type with confidence scores.

        Args:
            text: Scam description text to analyze
            include_probabilities: Whether to include per-class probabilities

        Returns:
            Dictionary with prediction and confidence scores
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained before making predictions")

        # Get prediction and probabilities
        label_idx = self.model.predict([text])[0]
        probabilities = self.model.predict_proba([text])[0]

        # Get predicted label
        unique_labels = sorted(set(self.SCAM_TYPES.keys()))
        predicted_label = unique_labels[label_idx]
        predicted_confidence = float(probabilities[label_idx])

        # Calculate threat score (0-100)
        # Base confidence * risk multiplier
        risk_multiplier = self.RISK_MULTIPLIERS.get(predicted_label, 1.0)
        threat_score = min(100, int(predicted_confidence * 100 * risk_multiplier))

        # Build response
        result = {
            'scam_type': predicted_label,
            'scam_type_display': self.SCAM_TYPES[predicted_label],
            'confidence': predicted_confidence,
            'threat_score': threat_score,
            'model_type': self.model_type,
            'timestamp': datetime.now().isoformat()
        }

        # Include per-class probabilities if requested
        if include_probabilities:
            proba_dict = {}
            for idx, label in enumerate(unique_labels):
                if probabilities[idx] > 0.05:  # Only include >5% probability
                    proba_dict[label] = {
                        'probability': float(probabilities[idx]),
                        'threat_score': min(
                            100,
                            int(probabilities[idx] * 100 * self.RISK_MULTIPLIERS.get(label, 1.0))
                        )
                    }
            result['top_probabilities'] = proba_dict

        return result

    def predict_batch(
        self,
        texts: List[str],
        include_probabilities: bool = False
    ) -> List[Dict]:
        """
        Predict scam types for multiple texts.

        Args:
            texts: List of scam descriptions
            include_probabilities: Whether to include probability details

        Returns:
            List of prediction dictionaries
        """
        results = []
        for text in texts:
            result = self.predict_with_confidence(text, include_probabilities)
            results.append(result)
        return results

    def save_model(self, filepath: str) -> bool:
        """
        Save trained model to disk.

        Args:
            filepath: Path to save model file

        Returns:
            True if successful
        """
        if not self.is_trained:
            raise RuntimeError("Cannot save untrained model")

        try:
            model_data = {
                'model': self.model,
                'is_trained': self.is_trained,
                'training_date': self.training_date,
                'training_samples': self.training_samples,
                'performance_metrics': self.performance_metrics,
                'model_type': self.model_type,
                'scam_types': self.SCAM_TYPES,
                'risk_multipliers': self.RISK_MULTIPLIERS
            }

            with open(filepath, 'wb') as f:
                pickle.dump(model_data, f)

            logger.info(f"Model saved to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            return False

    def load_model(self, filepath: str) -> bool:
        """
        Load trained model from disk.

        Args:
            filepath: Path to model file

        Returns:
            True if successful
        """
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)

            self.model = model_data['model']
            self.is_trained = model_data['is_trained']
            self.training_date = model_data['training_date']
            self.training_samples = model_data['training_samples']
            self.performance_metrics = model_data['performance_metrics']
            self.model_type = model_data['model_type']
            self.vectorizer = self.model.named_steps['tfidf']

            logger.info(f"Model loaded from {filepath}")
            logger.info(f"Training date: {self.training_date}, Accuracy: {self.performance_metrics['accuracy']:.4f}")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False

    def get_feature_importance(self, top_n: int = 20) -> Dict:
        """
        Get most important features (keywords) for predictions.

        Args:
            top_n: Number of top features to return

        Returns:
            Dictionary with feature importance
        """
        if not self.is_trained:
            raise RuntimeError("Model must be trained first")

        # Get feature importances from classifier
        classifier = self.model.named_steps['classifier']
        importances = classifier.feature_importances_

        # Get feature names from vectorizer
        feature_names = self.vectorizer.get_feature_names_out()

        # Sort by importance
        indices = np.argsort(importances)[-top_n:][::-1]

        features = {}
        for idx in indices:
            features[feature_names[idx]] = float(importances[idx])

        return features

    def get_metrics_summary(self) -> Dict:
        """Get summary of model performance metrics."""
        if not self.performance_metrics:
            return {'status': 'not_trained'}

        return {
            'status': 'trained',
            'model_type': self.model_type,
            'training_date': self.training_date,
            'training_samples': self.training_samples,
            'accuracy': self.performance_metrics['accuracy'],
            'precision': self.performance_metrics['precision'],
            'recall': self.performance_metrics['recall'],
            'f1_score': self.performance_metrics['f1_score'],
            'cv_score': f"{self.performance_metrics['cv_mean']:.4f} (+/- {self.performance_metrics['cv_std']:.4f})"
        }


if __name__ == '__main__':
    # Example usage
    print("ML Threat Scorer Module")
    print("=" * 50)
    print("This module provides ML-based threat scoring.")
    print("See threat_scorer_predict.py for prediction pipeline.")
