"""
Seasonal Events Management

Manages seasonal events, challenges, and limited-time rewards to maintain
user engagement and participation throughout the year.

Features:
- Seasonal events (4 per year)
- Weekly challenges
- Limited-time rewards
- Event progression tracking
- Leaderboard for event participants

Author: ScamGuard Gamification Team
Date: February 18, 2026
Version: 1.0
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EventType(Enum):
    """Types of events."""
    SEASONAL = "seasonal"
    WEEKLY_CHALLENGE = "weekly_challenge"
    SPECIAL_EVENT = "special_event"
    LIMITED_TIME = "limited_time"


class Season(Enum):
    """Seasonal events."""
    SPRING = "spring"          # March-May
    SUMMER = "summer"          # June-August
    FALL = "fall"              # September-November
    WINTER = "winter"          # December-February


@dataclass
class Challenge:
    """A challenge within an event."""
    id: str
    title: str
    description: str
    objective: str  # What users need to do
    xp_reward: int
    difficulty: str  # easy, medium, hard, extreme
    duration_days: int
    completion_count: int = 0  # How many users completed


@dataclass
class SeasonalEvent:
    """A seasonal event."""
    id: str
    season: Season
    title: str
    description: str
    theme: str  # visual theme/icon
    start_date: str
    end_date: str
    challenges: List[Challenge]
    total_xp_available: int
    participants: int = 0
    completion_rate: float = 0.0


class SeasonalEventsManager:
    """
    Manages seasonal events and challenges.

    Features:
    - 4 seasonal events per year
    - Weekly challenges
    - Special limited-time events
    - Event leaderboards
    - Reward tracking
    """

    def __init__(self):
        """Initialize events manager."""
        self.events = {}
        self.user_progress = {}  # user_id -> {event_id -> progress}
        self.weekly_challenges = []
        self.initialize_seasonal_events()

        logger.info("Initialized SeasonalEventsManager")

    def initialize_seasonal_events(self):
        """Initialize seasonal events for the year."""
        # Spring Event (March-May)
        spring_challenges = [
            Challenge(
                id='spring_guardian',
                title='Spring Guardian',
                description='Identify 10 spring-themed romance scams',
                objective='scams_identified',
                xp_reward=50,
                difficulty='medium',
                duration_days=92
            ),
            Challenge(
                id='spring_survivor',
                title='Spring Survivor',
                description='Report 5 phishing attempts in spring',
                objective='phishing_reports',
                xp_reward=40,
                difficulty='easy',
                duration_days=92
            ),
            Challenge(
                id='spring_master',
                title='Spring Master',
                description='Achieve 95%+ accuracy on all reports',
                objective='accuracy_achievement',
                xp_reward=100,
                difficulty='hard',
                duration_days=92
            ),
        ]

        self.events['spring_2026'] = SeasonalEvent(
            id='spring_2026',
            season=Season.SPRING,
            title='Spring Guardian Challenge',
            description='Protect your community from spring scams',
            theme='🌸',
            start_date='2026-03-01T00:00:00Z',
            end_date='2026-05-31T23:59:59Z',
            challenges=spring_challenges,
            total_xp_available=190
        )

        # Summer Event (June-August)
        summer_challenges = [
            Challenge(
                id='summer_detective',
                title='Summer Detective',
                description='Solve 15 summer vacation-themed scams',
                objective='scams_identified',
                xp_reward=60,
                difficulty='medium',
                duration_days=92
            ),
            Challenge(
                id='summer_expert',
                title='Summer Expert',
                description='Complete all summer educational modules',
                objective='modules_completed',
                xp_reward=70,
                difficulty='medium',
                duration_days=92
            ),
            Challenge(
                id='summer_legend',
                title='Summer Legend',
                description='Reach top 10 on summer leaderboard',
                objective='leaderboard_rank',
                xp_reward=100,
                difficulty='extreme',
                duration_days=92
            ),
        ]

        self.events['summer_2026'] = SeasonalEvent(
            id='summer_2026',
            season=Season.SUMMER,
            title='Summer Protector Challenge',
            description='Keep travelers and vacationers safe',
            theme='☀️',
            start_date='2026-06-01T00:00:00Z',
            end_date='2026-08-31T23:59:59Z',
            challenges=summer_challenges,
            total_xp_available=230
        )

        # Fall Event (September-November)
        fall_challenges = [
            Challenge(
                id='fall_sentinel',
                title='Fall Sentinel',
                description='Identify 10 employment scams',
                objective='scams_identified',
                xp_reward=50,
                difficulty='medium',
                duration_days=92
            ),
            Challenge(
                id='fall_warrior',
                title='Fall Warrior',
                description='Maintain 30-day activity streak',
                objective='streak_achievement',
                xp_reward=80,
                difficulty='hard',
                duration_days=92
            ),
            Challenge(
                id='fall_champion',
                title='Fall Champion',
                description='Help 20 community members',
                objective='community_help',
                xp_reward=100,
                difficulty='hard',
                duration_days=92
            ),
        ]

        self.events['fall_2026'] = SeasonalEvent(
            id='fall_2026',
            season=Season.FALL,
            title='Fall Guardian Challenge',
            description='Protect against autumn scams',
            theme='🍂',
            start_date='2026-09-01T00:00:00Z',
            end_date='2026-11-30T23:59:59Z',
            challenges=fall_challenges,
            total_xp_available=230
        )

        # Winter Event (December-February)
        winter_challenges = [
            Challenge(
                id='winter_protector',
                title='Winter Protector',
                description='Identify 15 holiday-themed scams',
                objective='scams_identified',
                xp_reward=75,
                difficulty='hard',
                duration_days=92
            ),
            Challenge(
                id='winter_scholar',
                title='Winter Scholar',
                description='Score 100% on 5 holiday scam quizzes',
                objective='quiz_scores',
                xp_reward=100,
                difficulty='hard',
                duration_days=92
            ),
            Challenge(
                id='winter_legend',
                title='Winter Legend',
                description='Reach level 10 before year end',
                objective='level_achievement',
                xp_reward=150,
                difficulty='extreme',
                duration_days=92
            ),
        ]

        self.events['winter_2026'] = SeasonalEvent(
            id='winter_2026',
            season=Season.WINTER,
            title='Winter Guardian Challenge',
            description='Protect your loved ones during holidays',
            theme='❄️',
            start_date='2025-12-01T00:00:00Z',
            end_date='2026-02-28T23:59:59Z',
            challenges=winter_challenges,
            total_xp_available=325
        )

        logger.info(f"Initialized {len(self.events)} seasonal events")

    def get_active_events(self) -> List[SeasonalEvent]:
        """Get currently active events."""
        now = datetime.now()
        active = []

        for event in self.events.values():
            start = datetime.fromisoformat(event.start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(event.end_date.replace('Z', '+00:00'))

            if start <= now <= end:
                active.append(event)

        return active

    def create_weekly_challenge(
        self,
        title: str,
        description: str,
        objective: str,
        xp_reward: int,
        difficulty: str = "medium"
    ) -> Challenge:
        """
        Create a new weekly challenge.

        Args:
            title: Challenge title
            description: Challenge description
            objective: What users need to do
            xp_reward: XP reward for completion
            difficulty: Difficulty level

        Returns:
            Created challenge
        """
        challenge_id = f"weekly_{datetime.now().strftime('%Y%W_%H%M%S')}"

        challenge = Challenge(
            id=challenge_id,
            title=title,
            description=description,
            objective=objective,
            xp_reward=xp_reward,
            difficulty=difficulty,
            duration_days=7
        )

        self.weekly_challenges.append(challenge)
        logger.info(f"Created weekly challenge: {title}")

        return challenge

    def get_current_weekly_challenge(self) -> Optional[Challenge]:
        """Get the current week's challenge."""
        if not self.weekly_challenges:
            return None

        return self.weekly_challenges[-1]  # Most recent

    def track_event_progress(
        self,
        user_id: str,
        event_id: str,
        challenge_id: str,
        progress: float,
        completed: bool = False
    ) -> Dict:
        """
        Track user progress on an event challenge.

        Args:
            user_id: User ID
            event_id: Event ID
            challenge_id: Challenge ID within event
            progress: Progress value (0-1.0)
            completed: Whether challenge is completed

        Returns:
            Progress update result
        """
        if user_id not in self.user_progress:
            self.user_progress[user_id] = {}

        if event_id not in self.user_progress[user_id]:
            self.user_progress[user_id][event_id] = {}

        # Store progress
        self.user_progress[user_id][event_id][challenge_id] = {
            'progress': progress,
            'completed': completed,
            'last_updated': datetime.now().isoformat()
        }

        # Update event statistics
        event = self.events.get(event_id)
        if event:
            challenge = next((c for c in event.challenges if c.id == challenge_id), None)
            if challenge and completed:
                challenge.completion_count += 1

        logger.info(
            f"Updated progress for {user_id} on {challenge_id}: {progress*100:.0f}%"
        )

        return {
            'user_id': user_id,
            'event_id': event_id,
            'challenge_id': challenge_id,
            'progress': progress,
            'completed': completed,
            'timestamp': datetime.now().isoformat()
        }

    def get_event_progress(self, user_id: str, event_id: str) -> Dict:
        """Get user's progress on a specific event."""
        if user_id not in self.user_progress or event_id not in self.user_progress[user_id]:
            return {
                'user_id': user_id,
                'event_id': event_id,
                'challenges': {},
                'overall_progress': 0.0
            }

        event = self.events.get(event_id)
        challenges = self.user_progress[user_id][event_id]

        challenge_progress = []
        for challenge_id, progress_data in challenges.items():
            challenge = next((c for c in event.challenges if c.id == challenge_id), None)
            if challenge:
                challenge_progress.append({
                    'challenge_id': challenge_id,
                    'challenge_title': challenge.title,
                    'progress': progress_data['progress'],
                    'completed': progress_data['completed'],
                    'xp_reward': challenge.xp_reward if progress_data['completed'] else 0
                })

        overall_progress = sum(c['progress'] for c in challenge_progress) / len(event.challenges)

        return {
            'user_id': user_id,
            'event_id': event_id,
            'event_title': event.title,
            'challenges': challenge_progress,
            'overall_progress': overall_progress,
            'total_xp_earned': sum(c['xp_reward'] for c in challenge_progress)
        }

    def get_event_leaderboard(self, event_id: str, limit: int = 50) -> List[Dict]:
        """
        Get leaderboard for a specific event.

        Args:
            event_id: Event ID
            limit: Max users to return

        Returns:
            Sorted leaderboard for event
        """
        event = self.events.get(event_id)
        if not event:
            return []

        leaderboard = []

        for user_id, events in self.user_progress.items():
            if event_id in events:
                progress_data = events[event_id]

                # Calculate total progress and XP
                total_xp = 0
                total_progress = 0
                challenges_completed = 0

                for challenge_id, progress_info in progress_data.items():
                    challenge = next((c for c in event.challenges if c.id == challenge_id), None)
                    if challenge:
                        total_progress += progress_info['progress']
                        if progress_info['completed']:
                            total_xp += challenge.xp_reward
                            challenges_completed += 1

                avg_progress = total_progress / len(event.challenges)

                leaderboard.append({
                    'rank': 0,
                    'user_id': user_id,
                    'challenges_completed': challenges_completed,
                    'overall_progress': avg_progress,
                    'xp_earned': total_xp,
                    'last_updated': max(
                        p['last_updated'] for p in progress_data.values()
                    ) if progress_data else datetime.now().isoformat()
                })

        # Sort by XP earned (primary), then by progress
        leaderboard.sort(
            key=lambda x: (x['xp_earned'], x['overall_progress']),
            reverse=True
        )

        # Add ranks
        for idx, entry in enumerate(leaderboard[:limit], 1):
            entry['rank'] = idx

        return leaderboard

    def get_reward_for_completion(
        self,
        event_id: str,
        challenge_id: str
    ) -> Dict:
        """
        Get reward details for completing a challenge.

        Args:
            event_id: Event ID
            challenge_id: Challenge ID

        Returns:
            Reward details
        """
        event = self.events.get(event_id)
        if not event:
            return {}

        challenge = next((c for c in event.challenges if c.id == challenge_id), None)
        if not challenge:
            return {}

        return {
            'challenge_id': challenge.id,
            'challenge_title': challenge.title,
            'xp_reward': challenge.xp_reward,
            'rarity': 'rare' if challenge.difficulty == 'extreme' else
                     'uncommon' if challenge.difficulty == 'hard' else 'common',
            'badge_earned': f"{event.theme}_{challenge.id}",
            'timestamp': datetime.now().isoformat()
        }

    def export_event_summary(self) -> Dict:
        """Export summary of all events."""
        return {
            'total_events': len(self.events),
            'active_events': len(self.get_active_events()),
            'events': [
                {
                    'id': event.id,
                    'season': event.season.value,
                    'title': event.title,
                    'theme': event.theme,
                    'start_date': event.start_date,
                    'end_date': event.end_date,
                    'challenges_count': len(event.challenges),
                    'total_xp_available': event.total_xp_available,
                    'participants': event.participants,
                    'completion_rate': event.completion_rate
                }
                for event in self.events.values()
            ],
            'weekly_challenges': len(self.weekly_challenges),
            'timestamp': datetime.now().isoformat()
        }

    def get_user_event_summary(self, user_id: str) -> Dict:
        """Get user's event participation summary."""
        user_events = self.user_progress.get(user_id, {})

        events_summary = []
        for event_id, challenges in user_events.items():
            event = self.events.get(event_id)
            if event:
                total_xp = sum(
                    next((c.xp_reward for c in event.challenges if c.id == cid), 0)
                    for cid in challenges
                    if challenges[cid]['completed']
                )

                events_summary.append({
                    'event_id': event_id,
                    'event_title': event.title,
                    'challenges_completed': sum(
                        1 for c in challenges.values() if c['completed']
                    ),
                    'total_challenges': len(event.challenges),
                    'xp_earned': total_xp
                })

        return {
            'user_id': user_id,
            'events_participated': len(events_summary),
            'events': events_summary,
            'total_event_xp': sum(e['xp_earned'] for e in events_summary),
            'timestamp': datetime.now().isoformat()
        }


if __name__ == '__main__':
    print("Seasonal Events Manager")
    print("=" * 50)
    print("4 seasonal events + weekly challenges.")
    print("Tracks progress and manages rewards.")
