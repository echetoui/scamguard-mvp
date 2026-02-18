"""
Advanced Gamification System

Provides comprehensive gamification features to increase user engagement:
- Achievement/badge system (20+ badges with tiers)
- Leaderboards (privacy-preserving, community-safe)
- User experience points (XP) and levels
- Rewards system (non-monetary)
- Progress tracking and streaks

Author: ScamGuard Gamification Team
Date: February 18, 2026
Version: 1.0
"""

import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AchievementTier(Enum):
    """Achievement tier levels."""
    BRONZE = 1      # 10 XP
    SILVER = 2      # 25 XP
    GOLD = 3        # 50 XP
    PLATINUM = 4    # 100 XP


class LeaderboardType(Enum):
    """Leaderboard types."""
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ALLTIME = "alltime"
    SEASONAL = "seasonal"


@dataclass
class Achievement:
    """Achievement/Badge definition."""
    id: str
    name: str
    description: str
    icon: str  # Emoji or icon identifier
    tier: AchievementTier
    xp_reward: int
    unlock_condition: Dict  # Condition to unlock
    category: str  # scam_prevention, learning, community, etc.
    rarity: str  # common, uncommon, rare, epic, legendary
    unlock_count: int = 0  # How many users unlocked


@dataclass
class UserAchievement:
    """User's unlocked achievement."""
    achievement_id: str
    user_id: str
    unlocked_at: str
    progress: float = 0.0  # 0-1.0 for in-progress achievements


@dataclass
class UserProfile:
    """Gamification profile for a user."""
    user_id: str
    total_xp: int = 0
    level: int = 1
    achievements: List[UserAchievement] = field(default_factory=list)
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: str = field(default_factory=lambda: datetime.now().isoformat())
    total_reports: int = 0
    total_correct_reports: int = 0
    accuracy_rate: float = 0.0
    joined_date: str = field(default_factory=lambda: datetime.now().isoformat())


class GamificationSystem:
    """
    Advanced gamification system for user engagement.

    Features:
    - Achievement/badge system (20+ badges)
    - Leaderboards (multiple types)
    - XP and leveling system
    - Streak tracking
    - Reward tracking
    - Progress analytics
    """

    # XP thresholds for levels
    LEVEL_THRESHOLDS = {
        1: 0,
        2: 100,
        3: 250,
        4: 450,
        5: 700,
        6: 1000,
        7: 1350,
        8: 1750,
        9: 2200,
        10: 2700,
        # Continuing pattern (each level ~500 more XP)
    }

    # Achievement definitions (20+ badges)
    ACHIEVEMENTS = {
        # Scam Prevention Achievements (5)
        'first_report': Achievement(
            id='first_report',
            name='First Report',
            description='Submit your first scam report',
            icon='🎯',
            tier=AchievementTier.BRONZE,
            xp_reward=10,
            unlock_condition={'scam_reports': 1},
            category='scam_prevention',
            rarity='common'
        ),
        'report_master': Achievement(
            id='report_master',
            name='Report Master',
            description='Submit 50 scam reports',
            icon='🏆',
            tier=AchievementTier.GOLD,
            xp_reward=50,
            unlock_condition={'scam_reports': 50},
            category='scam_prevention',
            rarity='rare'
        ),
        'accuracy_expert': Achievement(
            id='accuracy_expert',
            name='Accuracy Expert',
            description='Maintain 95%+ accuracy on reports',
            icon='🎯',
            tier=AchievementTier.PLATINUM,
            xp_reward=100,
            unlock_condition={'accuracy_rate': 0.95},
            category='scam_prevention',
            rarity='epic'
        ),
        'fraud_fighter': Achievement(
            id='fraud_fighter',
            name='Fraud Fighter',
            description='Identify 5 different scam types',
            icon='⚔️',
            tier=AchievementTier.SILVER,
            xp_reward=25,
            unlock_condition={'scam_types_identified': 5},
            category='scam_prevention',
            rarity='uncommon'
        ),
        'pattern_spotter': Achievement(
            id='pattern_spotter',
            name='Pattern Spotter',
            description='Identify an emerging scam pattern',
            icon='🔍',
            tier=AchievementTier.GOLD,
            xp_reward=50,
            unlock_condition={'emerging_patterns_found': 1},
            category='scam_prevention',
            rarity='rare'
        ),

        # Learning Achievements (5)
        'knowledge_seeker': Achievement(
            id='knowledge_seeker',
            name='Knowledge Seeker',
            description='Complete your first educational module',
            icon='📚',
            tier=AchievementTier.BRONZE,
            xp_reward=10,
            unlock_condition={'modules_completed': 1},
            category='learning',
            rarity='common'
        ),
        'education_zealot': Achievement(
            id='education_zealot',
            name='Education Zealot',
            description='Complete all 10 educational modules',
            icon='🎓',
            tier=AchievementTier.PLATINUM,
            xp_reward=100,
            unlock_condition={'modules_completed': 10},
            category='learning',
            rarity='legendary'
        ),
        'quiz_master': Achievement(
            id='quiz_master',
            name='Quiz Master',
            description='Score 100% on 5 scam identification quizzes',
            icon='💡',
            tier=AchievementTier.GOLD,
            xp_reward=50,
            unlock_condition={'perfect_quiz_scores': 5},
            category='learning',
            rarity='epic'
        ),
        'critical_thinker': Achievement(
            id='critical_thinker',
            name='Critical Thinker',
            description='Correctly identify 10 red flags in scam messages',
            icon='🧠',
            tier=AchievementTier.SILVER,
            xp_reward=25,
            unlock_condition={'red_flags_identified': 10},
            category='learning',
            rarity='uncommon'
        ),
        'scam_expert': Achievement(
            id='scam_expert',
            name='Scam Expert',
            description='Score 90%+ on all available quizzes',
            icon='🔬',
            tier=AchievementTier.PLATINUM,
            xp_reward=100,
            unlock_condition={'quiz_average_score': 0.90},
            category='learning',
            rarity='epic'
        ),

        # Community Achievements (5)
        'social_butterfly': Achievement(
            id='social_butterfly',
            name='Social Butterfly',
            description='Share a report with friends',
            icon='🦋',
            tier=AchievementTier.BRONZE,
            xp_reward=10,
            unlock_condition={'shares': 1},
            category='community',
            rarity='common'
        ),
        'community_contributor': Achievement(
            id='community_contributor',
            name='Community Contributor',
            description='Help 10 other users identify scams',
            icon='🤝',
            tier=AchievementTier.SILVER,
            xp_reward=25,
            unlock_condition={'helped_users': 10},
            category='community',
            rarity='uncommon'
        ),
        'influencer': Achievement(
            id='influencer',
            name='Influencer',
            description='Earn 500 followers in community',
            icon='⭐',
            tier=AchievementTier.GOLD,
            xp_reward=50,
            unlock_condition={'followers': 500},
            category='community',
            rarity='rare'
        ),
        'leaderboard_champion': Achievement(
            id='leaderboard_champion',
            name='Leaderboard Champion',
            description='Reach #1 on weekly leaderboard',
            icon='👑',
            tier=AchievementTier.PLATINUM,
            xp_reward=100,
            unlock_condition={'leaderboard_rank': 1},
            category='community',
            rarity='legendary'
        ),
        'mentor': Achievement(
            id='mentor',
            name='Mentor',
            description='Help 50 other users (comments, shares, etc.)',
            icon='🧑‍🏫',
            tier=AchievementTier.PLATINUM,
            xp_reward=100,
            unlock_condition={'helped_users': 50},
            category='community',
            rarity='epic'
        ),

        # Engagement Achievements (5)
        'daily_sentinel': Achievement(
            id='daily_sentinel',
            name='Daily Sentinel',
            description='Log in for 7 consecutive days',
            icon='📅',
            tier=AchievementTier.BRONZE,
            xp_reward=10,
            unlock_condition={'consecutive_days': 7},
            category='engagement',
            rarity='common'
        ),
        'unstoppable': Achievement(
            id='unstoppable',
            name='Unstoppable',
            description='Maintain 30-day activity streak',
            icon='🔥',
            tier=AchievementTier.GOLD,
            xp_reward=50,
            unlock_condition={'consecutive_days': 30},
            category='engagement',
            rarity='epic'
        ),
        'milestone_100': Achievement(
            id='milestone_100',
            name='Century',
            description='Reach 100 total XP',
            icon='💯',
            tier=AchievementTier.BRONZE,
            xp_reward=10,
            unlock_condition={'total_xp': 100},
            category='engagement',
            rarity='common'
        ),
        'milestone_1000': Achievement(
            id='milestone_1000',
            name='Kiloguard',
            description='Reach 1000 total XP',
            icon='⚡',
            tier=AchievementTier.GOLD,
            xp_reward=50,
            unlock_condition={'total_xp': 1000},
            category='engagement',
            rarity='rare'
        ),
        'level_10': Achievement(
            id='level_10',
            name='Max Guardian',
            description='Reach level 10',
            icon='🏅',
            tier=AchievementTier.PLATINUM,
            xp_reward=100,
            unlock_condition={'level': 10},
            category='engagement',
            rarity='legendary'
        ),
    }

    def __init__(self):
        """Initialize gamification system."""
        self.user_profiles = {}
        self.leaderboards = {
            LeaderboardType.WEEKLY.value: [],
            LeaderboardType.MONTHLY.value: [],
            LeaderboardType.ALLTIME.value: [],
            LeaderboardType.SEASONAL.value: []
        }
        self.reward_log = []

        logger.info("Initialized GamificationSystem with 20+ achievements")

    def get_or_create_profile(self, user_id: str) -> UserProfile:
        """Get or create user gamification profile."""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = UserProfile(user_id=user_id)
            logger.info(f"Created gamification profile for user {user_id}")
        return self.user_profiles[user_id]

    def award_xp(self, user_id: str, xp_amount: int, reason: str = "") -> Dict:
        """
        Award XP to user and handle level-ups.

        Args:
            user_id: User ID
            xp_amount: XP to award
            reason: Reason for award (activity, achievement, etc.)

        Returns:
            Update result with new level/XP
        """
        profile = self.get_or_create_profile(user_id)
        old_level = profile.level
        old_xp = profile.total_xp

        # Award XP
        profile.total_xp += xp_amount

        # Check for level up
        new_level = self._calculate_level(profile.total_xp)
        profile.level = new_level

        # Log reward
        self.reward_log.append({
            'user_id': user_id,
            'xp_awarded': xp_amount,
            'total_xp': profile.total_xp,
            'level': new_level,
            'reason': reason,
            'timestamp': datetime.now().isoformat()
        })

        logger.info(f"Awarded {xp_amount} XP to user {user_id} (total: {profile.total_xp})")

        return {
            'xp_awarded': xp_amount,
            'total_xp': profile.total_xp,
            'old_level': old_level,
            'new_level': new_level,
            'level_up': new_level > old_level,
            'reason': reason
        }

    def unlock_achievement(self, user_id: str, achievement_id: str) -> Dict:
        """
        Unlock an achievement for a user.

        Args:
            user_id: User ID
            achievement_id: Achievement ID

        Returns:
            Unlock result
        """
        profile = self.get_or_create_profile(user_id)
        achievement = self.ACHIEVEMENTS.get(achievement_id)

        if not achievement:
            logger.warning(f"Achievement {achievement_id} not found")
            return {'status': 'error', 'message': 'Achievement not found'}

        # Check if already unlocked
        if any(ua.achievement_id == achievement_id for ua in profile.achievements):
            return {'status': 'already_unlocked'}

        # Unlock achievement
        user_achievement = UserAchievement(
            achievement_id=achievement_id,
            user_id=user_id,
            unlocked_at=datetime.now().isoformat()
        )
        profile.achievements.append(user_achievement)

        # Award XP
        self.award_xp(user_id, achievement.xp_reward, f"Achievement: {achievement.name}")

        # Update achievement unlock count
        achievement.unlock_count += 1

        logger.info(f"User {user_id} unlocked achievement: {achievement.name}")

        return {
            'status': 'unlocked',
            'achievement': achievement_id,
            'achievement_name': achievement.name,
            'xp_awarded': achievement.xp_reward,
            'total_xp': profile.total_xp,
            'timestamp': datetime.now().isoformat()
        }

    def update_streak(self, user_id: str, activity_date: Optional[str] = None) -> Dict:
        """
        Update user's activity streak.

        Args:
            user_id: User ID
            activity_date: Date of activity (default: today)

        Returns:
            Streak update result
        """
        profile = self.get_or_create_profile(user_id)
        activity_date = activity_date or datetime.now().date().isoformat()

        last_activity = datetime.fromisoformat(profile.last_activity_date).date()
        current_activity = datetime.fromisoformat(activity_date).date()
        days_since = (current_activity - last_activity).days

        if days_since == 0:
            # Activity today, streak continues
            result = {'streak_status': 'same_day'}
        elif days_since == 1:
            # Consecutive day, continue streak
            profile.current_streak += 1
            profile.longest_streak = max(profile.current_streak, profile.longest_streak)

            # Award XP for streak bonus
            xp_bonus = min(10 * profile.current_streak, 100)
            self.award_xp(user_id, xp_bonus, f"Streak bonus (day {profile.current_streak})")

            result = {
                'streak_status': 'continued',
                'current_streak': profile.current_streak,
                'xp_bonus': xp_bonus
            }
        else:
            # Streak broken, reset
            profile.current_streak = 1
            result = {
                'streak_status': 'reset',
                'current_streak': 1
            }

        profile.last_activity_date = datetime.now().isoformat()
        return result

    def get_leaderboard(
        self,
        leaderboard_type: str = "weekly",
        limit: int = 50
    ) -> List[Dict]:
        """
        Get leaderboard rankings.

        Args:
            leaderboard_type: Type of leaderboard (weekly, monthly, alltime, seasonal)
            limit: Max users to return

        Returns:
            Sorted leaderboard
        """
        leaderboard = []

        for user_id, profile in self.user_profiles.items():
            # Filter by time period if needed
            if leaderboard_type == "weekly":
                # Only include active users this week
                last_activity = datetime.fromisoformat(profile.last_activity_date)
                if (datetime.now() - last_activity).days > 7:
                    continue
            elif leaderboard_type == "monthly":
                # Only include active users this month
                last_activity = datetime.fromisoformat(profile.last_activity_date)
                if (datetime.now() - last_activity).days > 30:
                    continue

            leaderboard.append({
                'rank': 0,  # Set after sorting
                'user_id': user_id,
                'level': profile.level,
                'total_xp': profile.total_xp,
                'achievements_count': len(profile.achievements),
                'accuracy_rate': profile.accuracy_rate,
                'reports_count': profile.total_reports,
                'last_activity': profile.last_activity_date
            })

        # Sort by XP (primary), then level, then achievements
        leaderboard.sort(
            key=lambda x: (x['total_xp'], x['level'], x['achievements_count']),
            reverse=True
        )

        # Add ranks
        for idx, entry in enumerate(leaderboard[:limit], 1):
            entry['rank'] = idx

        return leaderboard

    def get_user_stats(self, user_id: str) -> Dict:
        """Get comprehensive user gamification stats."""
        profile = self.get_or_create_profile(user_id)

        return {
            'user_id': user_id,
            'level': profile.level,
            'total_xp': profile.total_xp,
            'xp_to_next_level': self._xp_to_next_level(profile.total_xp),
            'achievements': {
                'unlocked': len(profile.achievements),
                'total': len(self.ACHIEVEMENTS),
                'completion_rate': len(profile.achievements) / len(self.ACHIEVEMENTS)
            },
            'streaks': {
                'current': profile.current_streak,
                'longest': profile.longest_streak
            },
            'reports': {
                'total': profile.total_reports,
                'correct': profile.total_correct_reports,
                'accuracy_rate': profile.accuracy_rate
            },
            'community': {
                'followers': 0,  # Would be populated from social DB
                'helping_others': 0  # Would be populated from interactions DB
            },
            'joined_date': profile.joined_date,
            'last_activity': profile.last_activity_date
        }

    def _calculate_level(self, total_xp: int) -> int:
        """Calculate level from total XP."""
        level = 1
        for lvl, threshold in sorted(self.LEVEL_THRESHOLDS.items()):
            if total_xp >= threshold:
                level = lvl
            else:
                break
        return level

    def _xp_to_next_level(self, total_xp: int) -> int:
        """Calculate XP needed to reach next level."""
        current_level = self._calculate_level(total_xp)
        next_level = current_level + 1

        if next_level not in self.LEVEL_THRESHOLDS:
            return 0  # Already max level

        current_threshold = self.LEVEL_THRESHOLDS.get(current_level, 0)
        next_threshold = self.LEVEL_THRESHOLDS.get(next_level, total_xp)

        return next_threshold - total_xp

    def get_achievement_progress(self, user_id: str) -> Dict:
        """
        Get achievement progress for user.

        Returns unlocked achievements and progress on others.
        """
        profile = self.get_or_create_profile(user_id)
        unlocked_ids = {ua.achievement_id for ua in profile.achievements}

        achievements = {
            'unlocked': [],
            'in_progress': [],
            'locked': []
        }

        for ach_id, achievement in self.ACHIEVEMENTS.items():
            if ach_id in unlocked_ids:
                achievements['unlocked'].append({
                    'id': ach_id,
                    'name': achievement.name,
                    'icon': achievement.icon,
                    'rarity': achievement.rarity,
                    'xp_reward': achievement.xp_reward
                })
            else:
                achievements['locked'].append({
                    'id': ach_id,
                    'name': achievement.name,
                    'icon': achievement.icon,
                    'description': achievement.description,
                    'rarity': achievement.rarity,
                    'xp_reward': achievement.xp_reward
                })

        return {
            'unlocked_count': len(achievements['unlocked']),
            'locked_count': len(achievements['locked']),
            'total_count': len(self.ACHIEVEMENTS),
            'completion_rate': len(achievements['unlocked']) / len(self.ACHIEVEMENTS),
            'achievements': achievements
        }

    def export_user_profile(self, user_id: str) -> Dict:
        """Export user profile for API/dashboard."""
        profile = self.get_or_create_profile(user_id)

        return {
            'user_id': user_id,
            'gamification': {
                'level': profile.level,
                'xp': profile.total_xp,
                'achievements_unlocked': len(profile.achievements),
                'streak': profile.current_streak,
                'accuracy': profile.accuracy_rate
            },
            'timestamp': datetime.now().isoformat()
        }


if __name__ == '__main__':
    print("Advanced Gamification System")
    print("=" * 50)
    print("20+ achievements, leaderboards, XP system.")
    print("See seasonal_events.py for event management.")
