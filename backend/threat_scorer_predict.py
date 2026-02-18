"""
Threat Scorer Prediction Pipeline

Production-ready inference pipeline for real-time threat scoring.
Integrates ML model with existing analysis system.

Author: ScamGuard ML Team
Date: February 18, 2026
Version: 1.0
"""

import json
import logging
from typing import Dict, Optional
from datetime import datetime
from threat_scorer_ml import ThreatScorerML

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ThreatScorerPredictor:
    """
    Production prediction pipeline for threat scoring.

    Features:
    - Real-time inference from trained model
    - Confidence thresholding
    - Fallback to rule-based scoring
    - Performance monitoring
    - Integration with existing analysis pipeline
    """

    # Confidence thresholds for different decision levels
    CONFIDENCE_THRESHOLDS = {
        'high_confidence': 0.75,    # >75% confidence in prediction
        'medium_confidence': 0.50,  # 50-75% confidence
        'low_confidence': 0.30      # <50% confidence
    }

    # Keywords for rule-based fallback
    HIGH_RISK_KEYWORDS = {
        'romantic': ['love', 'sweetheart', 'dear', 'affection', 'boyfriend', 'girlfriend'],
        'urgent': ['urgent', 'emergency', 'immediate', 'right now', 'asap', 'hurry'],
        'financial': ['money', 'payment', 'transfer', 'account', 'bank', 'cash', 'wire'],
        'trust': ['trust me', 'believe me', 'promise', 'guarantee', 'secret'],
        'suspicious': ['widow', 'inheritance', 'lottery', 'million', 'prize', 'won']
    }

    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the prediction pipeline.

        Args:
            model_path: Path to saved ML model (optional)
        """
        self.ml_model = ThreatScorerML()
        self.model_loaded = False
        self.prediction_count = 0
        self.ml_fallback_count = 0

        if model_path:
            if self.ml_model.load_model(model_path):
                self.model_loaded = True
                logger.info("ML model loaded successfully")
            else:
                logger.warning("Failed to load ML model, will use rule-based fallback")

    def predict(self, text: str, use_ml: bool = True) -> Dict:
        """
        Predict threat score for scam description.

        Args:
            text: Scam description text
            use_ml: Whether to use ML model (fallback to rules if False)

        Returns:
            Dictionary with threat assessment
        """
        self.prediction_count += 1

        if use_ml and self.model_loaded:
            return self._predict_ml(text)
        else:
            return self._predict_rule_based(text)

    def _predict_ml(self, text: str) -> Dict:
        """
        Predict using trained ML model.

        Args:
            text: Scam description

        Returns:
            ML-based prediction
        """
        try:
            prediction = self.ml_model.predict_with_confidence(
                text,
                include_probabilities=True
            )

            # Add assessment
            confidence = prediction['confidence']
            if confidence >= self.CONFIDENCE_THRESHOLDS['high_confidence']:
                assessment = 'High Confidence'
                recommendation = 'Block/Warn'
            elif confidence >= self.CONFIDENCE_THRESHOLDS['medium_confidence']:
                assessment = 'Medium Confidence'
                recommendation = 'Caution'
            else:
                assessment = 'Low Confidence'
                recommendation = 'Monitor'

            prediction.update({
                'assessment': assessment,
                'recommendation': recommendation,
                'method': 'machine_learning'
            })

            return prediction

        except Exception as e:
            logger.error(f"ML prediction error: {e}")
            self.ml_fallback_count += 1
            # Fallback to rule-based
            return self._predict_rule_based(text)

    def _predict_rule_based(self, text: str) -> Dict:
        """
        Fallback rule-based threat scoring.

        Uses keyword matching and heuristics when ML model unavailable.

        Args:
            text: Scam description

        Returns:
            Rule-based prediction
        """
        text_lower = text.lower()
        threat_score = 0
        matched_patterns = []

        # Score keywords
        for category, keywords in self.HIGH_RISK_KEYWORDS.items():
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    threat_score += 10
                    matched_patterns.append({
                        'category': category,
                        'keyword': keyword
                    })

        # Cap at 100
        threat_score = min(100, threat_score)

        # Determine scam type from keywords
        scam_type = 'other'
        if any(k in text_lower for k in self.HIGH_RISK_KEYWORDS['romantic']):
            if any(k in text_lower for k in self.HIGH_RISK_KEYWORDS['financial']):
                scam_type = 'romance'
        elif any(k in text_lower for k in self.HIGH_RISK_KEYWORDS['urgent']):
            scam_type = 'tech_support'
        elif any(k in text_lower for k in ['grandparent', 'grandson', 'granddaughter']):
            scam_type = 'grandparent'

        # Confidence is lower for rule-based
        confidence = min(0.6, threat_score / 100)

        return {
            'scam_type': scam_type,
            'scam_type_display': self.ml_model.SCAM_TYPES.get(scam_type, 'Unknown'),
            'confidence': confidence,
            'threat_score': threat_score,
            'assessment': f"Risk Score: {threat_score}/100",
            'recommendation': 'Caution' if threat_score > 50 else 'Monitor',
            'method': 'rule_based',
            'matched_patterns': matched_patterns,
            'timestamp': datetime.now().isoformat()
        }

    def predict_batch(self, texts: list, use_ml: bool = True) -> list:
        """
        Predict threat scores for multiple texts.

        Args:
            texts: List of scam descriptions
            use_ml: Whether to use ML model

        Returns:
            List of predictions
        """
        predictions = []
        for text in texts:
            prediction = self.predict(text, use_ml=use_ml)
            predictions.append(prediction)
        return predictions

    def get_statistics(self) -> Dict:
        """Get prediction pipeline statistics."""
        fallback_rate = (
            self.ml_fallback_count / self.prediction_count * 100
            if self.prediction_count > 0
            else 0
        )

        return {
            'total_predictions': self.prediction_count,
            'ml_fallbacks': self.ml_fallback_count,
            'fallback_rate': f"{fallback_rate:.2f}%",
            'model_loaded': self.model_loaded,
            'model_status': self.ml_model.get_metrics_summary()
        }

    def export_prediction(self, prediction: Dict, include_debug: bool = False) -> Dict:
        """
        Export prediction in standard format for API/database.

        Args:
            prediction: Raw prediction dictionary
            include_debug: Whether to include debug information

        Returns:
            Formatted prediction for export
        """
        exported = {
            'scam_type': prediction.get('scam_type', 'unknown'),
            'scam_type_display': prediction.get('scam_type_display', 'Unknown'),
            'threat_score': prediction.get('threat_score', 0),
            'confidence': round(prediction.get('confidence', 0), 3),
            'assessment': prediction.get('assessment', 'Unknown'),
            'recommendation': prediction.get('recommendation', 'Monitor'),
            'timestamp': prediction.get('timestamp', datetime.now().isoformat())
        }

        if include_debug:
            exported['debug'] = {
                'method': prediction.get('method', 'unknown'),
                'ml_probabilities': prediction.get('top_probabilities', {})
            }

        return exported


class ThreatScorerAPI:
    """
    API interface for threat scoring integration.

    Provides REST-like interface for integration with Lambda/API Gateway.
    """

    def __init__(self, model_path: Optional[str] = None):
        """Initialize the API interface."""
        self.predictor = ThreatScorerPredictor(model_path)

    def analyze_scam(self, request_body: Dict) -> Dict:
        """
        Handle scam analysis request.

        Request format:
        {
            "description": "scam text here",
            "user_id": "optional_user_id",
            "include_debug": false
        }

        Args:
            request_body: API request body

        Returns:
            API response with analysis
        """
        try:
            description = request_body.get('description', '').strip()
            user_id = request_body.get('user_id')
            include_debug = request_body.get('include_debug', False)

            if not description:
                return {
                    'status': 'error',
                    'message': 'Description is required',
                    'code': 'INVALID_REQUEST'
                }

            if len(description) < 10:
                return {
                    'status': 'error',
                    'message': 'Description must be at least 10 characters',
                    'code': 'INVALID_REQUEST'
                }

            # Get prediction
            prediction = self.predictor.predict(description, use_ml=True)

            # Export in standard format
            response = {
                'status': 'success',
                'analysis': self.predictor.export_prediction(prediction, include_debug),
                'timestamp': datetime.now().isoformat()
            }

            if user_id:
                response['user_id'] = user_id

            return response

        except Exception as e:
            logger.error(f"Error in scam analysis: {e}")
            return {
                'status': 'error',
                'message': str(e),
                'code': 'ANALYSIS_ERROR'
            }

    def batch_analyze(self, request_body: Dict) -> Dict:
        """
        Handle batch scam analysis request.

        Request format:
        {
            "descriptions": ["scam1", "scam2", ...],
            "user_id": "optional"
        }
        """
        try:
            descriptions = request_body.get('descriptions', [])

            if not descriptions or not isinstance(descriptions, list):
                return {
                    'status': 'error',
                    'message': 'descriptions must be a non-empty list',
                    'code': 'INVALID_REQUEST'
                }

            # Limit to 100 per request
            if len(descriptions) > 100:
                descriptions = descriptions[:100]

            predictions = self.predictor.predict_batch(descriptions)

            return {
                'status': 'success',
                'count': len(predictions),
                'analyses': [
                    self.predictor.export_prediction(p) for p in predictions
                ],
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error in batch analysis: {e}")
            return {
                'status': 'error',
                'message': str(e),
                'code': 'BATCH_ERROR'
            }


# Lambda handler integration example
def lambda_handler(event, context):
    """
    AWS Lambda handler for threat scoring API.

    Example event:
    {
        "body": {
            "description": "I met someone online...",
            "user_id": "user123"
        },
        "path": "/analyze",
        "method": "POST"
    }
    """
    api = ThreatScorerAPI(model_path='/opt/models/threat_scorer.pkl')

    try:
        body = json.loads(event.get('body', '{}'))
        path = event.get('path', '')

        if path == '/analyze':
            result = api.analyze_scam(body)
        elif path == '/batch-analyze':
            result = api.batch_analyze(body)
        else:
            result = {'status': 'error', 'message': 'Unknown endpoint'}

        return {
            'statusCode': 200 if result.get('status') == 'success' else 400,
            'body': json.dumps(result)
        }

    except Exception as e:
        logger.error(f"Lambda error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'status': 'error', 'message': str(e)})
        }


if __name__ == '__main__':
    print("Threat Scorer Prediction Pipeline")
    print("=" * 50)
    print("This module provides production inference.")
    print("See threat_scorer_ml.py for model training.")
