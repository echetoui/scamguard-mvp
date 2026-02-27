"""
Personalized Recommendation Engine

Provides personalized scam prevention tips and educational content
based on user history, behavior, and engagement patterns.

Features:
- Content-based recommendation algorithm
- Collaborative filtering approach
- User profile analysis
- Relevance scoring
- A/B testing support

Author: ScamGuard Recommendations Team
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
class Tip:
    """Educational tip or recommendation."""
    id: str
    title: str
    description: str
    category: str  # romance, phishing, tech_support, investment, etc.
    difficulty: str  # beginner, intermediate, advanced
    tags: List[str]
    content: str
    length_minutes: int
    created_date: str
    views_count: int = 0
    engagement_rate: float = 0.0


@dataclass
class UserRecommendation:
    """Recommendation sent to user."""
    recommendation_id: str
    user_id: str
    tip_id: str
    sent_at: str
    channel: str  # push, email, in_app
    clicked: bool = False
    clicked_at: Optional[str] = None
    rating: Optional[int] = None  # 1-5 stars


class RecommendationEngine:
    """
    Personalized content recommendation system.

    Features:
    - Content-based filtering
    - Collaborative filtering
    - User behavior analysis
    - Relevance scoring (0-1.0)
    - A/B testing support
    """

    # Tip categories matching scam types
    CATEGORIES = {
        'romance': 'Romance Scam Prevention',
        'phishing': 'Phishing & Email Safety',
        'tech_support': 'Tech Support Scam Protection',
        'investment': 'Investment Fraud Prevention',
        'employment': 'Employment Scam Awareness',
        'prize': 'Prize & Lottery Scam Awareness',
        'impersonation': 'Impersonation Prevention',
        'money_flip': 'Money Flip Scam Recognition',
        'grandparent': 'Grandparent Scam Prevention',
        'general': 'General Cybersecurity'
    }

    def __init__(self):
        """Initialize recommendation engine."""
        self.tips_database: Dict[str, Tip] = {}
        self.user_preferences: Dict[str, Dict] = defaultdict(dict)
        self.recommendation_history: List[UserRecommendation] = []
        self.user_interests: Dict[str, List[str]] = defaultdict(list)

        logger.info("Initialized RecommendationEngine")

    def add_tip(
        self,
        tip_id: str,
        title: str,
        description: str,
        category: str,
        difficulty: str,
        tags: List[str],
        content: str,
        length_minutes: int
    ) -> Dict:
        """
        Add educational tip to database.

        Args:
            tip_id: Unique tip identifier
            title: Tip title
            description: Short description
            category: Scam category
            difficulty: Beginner/intermediate/advanced
            tags: Searchable tags
            content: Full tip content
            length_minutes: Estimated reading time

        Returns:
            Tip creation result
        """
        tip = Tip(
            id=tip_id,
            title=title,
            description=description,
            category=category,
            difficulty=difficulty,
            tags=tags,
            content=content,
            length_minutes=length_minutes,
            created_date=datetime.now().isoformat()
        )

        self.tips_database[tip_id] = tip

        logger.info(f"Added tip: {title} ({category})")

        return {
            'tip_id': tip_id,
            'title': title,
            'status': 'created'
        }

    def get_personalized_recommendations(
        self,
        user_id: str,
        limit: int = 5,
        include_reasons: bool = True
    ) -> List[Dict]:
        """
        Get personalized recommendations for user.

        Args:
            user_id: User ID
            limit: Max recommendations to return
            include_reasons: Include explanation for each recommendation

        Returns:
            List of recommended tips with scores
        """
        if not self.tips_database:
            return []

        # Build user profile from history
        user_profile = self._build_user_profile(user_id)

        # Score all tips
        scored_tips = []
        for tip_id, tip in self.tips_database.items():
            # Skip already recommended
            if self._is_recently_recommended(user_id, tip_id):
                continue

            score = self._calculate_relevance_score(user_profile, tip)

            if score > 0.0:  # Only include relevant tips
                scored_tips.append({
                    'tip_id': tip_id,
                    'tip': tip,
                    'score': score,
                    'reason': self._get_recommendation_reason(user_profile, tip, score)
                })

        # Sort by relevance score (descending)
        scored_tips.sort(key=lambda x: x['score'], reverse=True)

        # Format results
        recommendations = []
        for item in scored_tips[:limit]:
            tip = item['tip']
            recommendation = {
                'tip_id': item['tip_id'],
                'title': tip.title,
                'description': tip.description,
                'category': tip.category,
                'difficulty': tip.difficulty,
                'length_minutes': tip.length_minutes,
                'relevance_score': round(item['score'], 3)
            }

            if include_reasons:
                recommendation['reason'] = item['reason']

            recommendations.append(recommendation)

        logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")

        return recommendations

    def _build_user_profile(self, user_id: str) -> Dict:
        """
        Build user profile from history and behavior.

        Args:
            user_id: User ID

        Returns:
            User profile dictionary
        """
        # Get user's report history
        user_reports = self._get_user_report_history(user_id)

        # Get user's learning history
        learning_history = self._get_user_learning_history(user_id)

        # Build interests from history
        interests = defaultdict(float)
        for report in user_reports:
            scam_type = report.get('scam_type', 'general')
            interests[scam_type] += 1.0

        # Normalize interests
        total_interest = sum(interests.values())
        if total_interest > 0:
            for key in interests:
                interests[key] /= total_interest

        return {
            'user_id': user_id,
            'interests': dict(interests),
            'learning_history': learning_history,
            'engagement_level': self._calculate_engagement_level(user_id),
            'experience_level': self._estimate_experience_level(user_id)
        }

    def _calculate_relevance_score(self, user_profile: Dict, tip: Tip) -> float:
        """
        Calculate relevance score for tip given user profile (0-1.0).

        Args:
            user_profile: User profile dictionary
            tip: Tip object

        Returns:
            Relevance score (0-1.0)
        """
        score = 0.0

        # Category match (0.5)
        interests = user_profile['interests']
        if tip.category in interests:
            score += 0.5 * interests[tip.category]

        # Difficulty match (0.2)
        experience = user_profile['experience_level']
        if tip.difficulty == experience:
            score += 0.2
        elif experience == 'advanced' and tip.difficulty in ['intermediate', 'advanced']:
            score += 0.1
        elif experience == 'beginner' and tip.difficulty == 'beginner':
            score += 0.2

        # Engagement bonus (0.2)
        engagement = user_profile['engagement_level']
        if engagement == 'high' and tip.length_minutes <= 10:
            score += 0.1
        elif engagement == 'low' and tip.length_minutes >= 5:
            score += 0.05

        # Popularity bonus (0.1)
        popularity = min(tip.views_count / 1000, 1.0)  # Normalize by 1000 views
        score += 0.1 * popularity

        return min(score, 1.0)  # Cap at 1.0

    def _get_recommendation_reason(
        self,
        user_profile: Dict,
        tip: Tip,
        score: float
    ) -> str:
        """Generate human-readable reason for recommendation."""
        reasons = []

        interests = user_profile['interests']
        if tip.category in interests and interests[tip.category] > 0.3:
            reasons.append(f"Based on your interest in {tip.category} prevention")

        experience = user_profile['experience_level']
        if tip.difficulty == experience:
            reasons.append(f"Matched to your {experience} level")

        if tip.engagement_rate > 0.7:
            reasons.append("Highly rated by other users")

        return reasons[0] if reasons else "Recommended for you"

    def _is_recently_recommended(self, user_id: str, tip_id: str, days: int = 30) -> bool:
        """Check if tip was recently recommended to user."""
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

        for rec in self.recommendation_history:
            if rec.user_id == user_id and rec.tip_id == tip_id:
                if rec.sent_at > cutoff_date:
                    return True

        return False

    def _get_user_report_history(self, user_id: str) -> List[Dict]:
        """Get user's scam report history (would come from analytics/DB)."""
        # In production, this would query the reports database
        return self.user_interests.get(user_id, [])

    def _get_user_learning_history(self, user_id: str) -> List[str]:
        """Get user's learning history (would come from learning DB)."""
        # In production, this would query the learning database
        return []

    def _calculate_engagement_level(self, user_id: str) -> str:
        """Estimate user's engagement level (would come from analytics)."""
        # In production, this would use engagement score from analytics
        return 'medium'

    def _estimate_experience_level(self, user_id: str) -> str:
        """Estimate user's experience level (beginner/intermediate/advanced)."""
        # Based on number of reports, achievements, etc.
        report_count = len(self._get_user_report_history(user_id))

        if report_count < 5:
            return 'beginner'
        elif report_count < 20:
            return 'intermediate'
        else:
            return 'advanced'

    def track_recommendation(
        self,
        user_id: str,
        tip_id: str,
        channel: str
    ) -> Dict:
        """
        Track that a recommendation was sent.

        Args:
            user_id: User ID
            tip_id: Tip ID
            channel: Delivery channel (push, email, in_app)

        Returns:
            Tracking result
        """
        recommendation = UserRecommendation(
            recommendation_id=f"rec_{user_id}_{tip_id}_{datetime.now().timestamp()}",
            user_id=user_id,
            tip_id=tip_id,
            sent_at=datetime.now().isoformat(),
            channel=channel
        )

        self.recommendation_history.append(recommendation)

        logger.debug(f"Tracked recommendation: {user_id} → {tip_id} ({channel})")

        return {
            'recommendation_id': recommendation.recommendation_id,
            'user_id': user_id,
            'tip_id': tip_id,
            'channel': channel
        }

    def track_engagement(
        self,
        recommendation_id: str,
        clicked: bool = False,
        rating: Optional[int] = None
    ) -> Dict:
        """
        Track user engagement with recommendation.

        Args:
            recommendation_id: Recommendation ID
            clicked: Whether user clicked/opened
            rating: User rating (1-5 stars)

        Returns:
            Engagement tracking result
        """
        for rec in self.recommendation_history:
            if rec.recommendation_id == recommendation_id:
                if clicked:
                    rec.clicked = True
                    rec.clicked_at = datetime.now().isoformat()

                if rating:
                    rec.rating = rating

                logger.debug(f"Tracked engagement: {recommendation_id} (click={clicked}, rating={rating})")

                return {'status': 'tracked'}

        return {'status': 'error', 'message': 'Recommendation not found'}

    def get_recommendation_metrics(self) -> Dict:
        """Get metrics on recommendation performance."""
        if not self.recommendation_history:
            return {
                'total_recommendations': 0,
                'click_through_rate': 0.0,
                'average_rating': 0.0
            }

        total = len(self.recommendation_history)
        clicked = sum(1 for r in self.recommendation_history if r.clicked)
        rated = [r.rating for r in self.recommendation_history if r.rating]

        return {
            'total_recommendations': total,
            'total_clicked': clicked,
            'click_through_rate': round(clicked / total * 100, 2) if total > 0 else 0.0,
            'average_rating': round(sum(rated) / len(rated), 2) if rated else 0.0,
            'total_rated': len(rated)
        }

    def get_top_tips(self, category: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """Get top tips by engagement/popularity."""
        tips = list(self.tips_database.values())

        if category:
            tips = [t for t in tips if t.category == category]

        tips.sort(key=lambda t: (t.engagement_rate, t.views_count), reverse=True)

        return [
            {
                'tip_id': t.id,
                'title': t.title,
                'category': t.category,
                'views': t.views_count,
                'engagement_rate': round(t.engagement_rate, 3)
            }
            for t in tips[:limit]
        ]


if __name__ == '__main__':
    print("Personalized Recommendation Engine")
    print("=" * 50)
    print("Provides personalized tips based on user behavior.")
    print("See content_database.py for tip management.")
