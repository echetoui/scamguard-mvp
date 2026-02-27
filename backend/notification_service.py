"""
Notification Service for Recommendations

Handles delivery of personalized recommendations through multiple channels:
push notifications, email, and in-app messages. Manages notification
preferences, scheduling, and tracking.

Features:
- Push notification delivery (Firebase Cloud Messaging)
- Email notification with personalized content
- In-app notification system
- Notification preferences and opt-out management
- Delivery tracking and retry logic

Author: ScamGuard Notifications Team
Date: February 18, 2026
Version: 1.0
"""

import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class NotificationChannel(Enum):
    """Notification delivery channels."""
    PUSH = "push"
    EMAIL = "email"
    IN_APP = "in_app"


@dataclass
class NotificationPreference:
    """User notification preferences."""
    user_id: str
    push_enabled: bool = True
    email_enabled: bool = True
    in_app_enabled: bool = True
    frequency: str = "daily"  # daily, weekly, disabled
    quiet_hours_start: str = "22:00"  # 10 PM
    quiet_hours_end: str = "08:00"  # 8 AM
    max_notifications_per_day: int = 5
    preferred_send_time: str = "09:00"  # 9 AM


@dataclass
class NotificationRecord:
    """Record of sent notification."""
    notification_id: str
    user_id: str
    tip_id: str
    channel: NotificationChannel
    sent_at: str
    delivery_status: str  # pending, sent, failed, bounced
    retry_count: int = 0
    delivered_at: Optional[str] = None
    opened_at: Optional[str] = None


class PushNotificationService:
    """
    Push notification service for mobile apps.

    Manages FCM (Firebase Cloud Messaging) integration for
    delivering recommendations to mobile devices.
    """

    def __init__(self):
        """Initialize push notification service."""
        self.fcm_tokens: Dict[str, List[str]] = {}  # user_id -> [device_tokens]
        self.notification_queue: List[Dict] = []

        logger.info("Initialized PushNotificationService")

    def register_device(self, user_id: str, device_token: str) -> Dict:
        """
        Register device for push notifications.

        Args:
            user_id: User ID
            device_token: FCM device token from mobile app

        Returns:
            Registration result
        """
        if user_id not in self.fcm_tokens:
            self.fcm_tokens[user_id] = []

        if device_token not in self.fcm_tokens[user_id]:
            self.fcm_tokens[user_id].append(device_token)

            logger.info(f"Registered device for user {user_id}")

        return {
            'status': 'registered',
            'user_id': user_id,
            'token': device_token[:20] + '...'  # Truncate for logging
        }

    def unregister_device(self, user_id: str, device_token: str) -> Dict:
        """Unregister device from push notifications."""
        if user_id in self.fcm_tokens and device_token in self.fcm_tokens[user_id]:
            self.fcm_tokens[user_id].remove(device_token)

            logger.info(f"Unregistered device for user {user_id}")

        return {'status': 'unregistered'}

    def send_push_notification(
        self,
        user_id: str,
        tip_id: str,
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> Dict:
        """
        Send push notification to user's devices.

        Args:
            user_id: User ID
            tip_id: Tip ID being recommended
            title: Notification title
            body: Notification body text
            data: Additional data to include

        Returns:
            Send result with notification ID
        """
        if user_id not in self.fcm_tokens or not self.fcm_tokens[user_id]:
            logger.warning(f"No FCM tokens for user {user_id}")
            return {'status': 'no_devices', 'user_id': user_id}

        notification_id = f"push_{user_id}_{tip_id}_{datetime.now().timestamp()}"

        payload = {
            'title': title,
            'body': body,
            'data': data or {},
            'notification': {
                'title': title,
                'body': body,
                'click_action': f'scamguard://tip/{tip_id}'
            }
        }

        # Queue for sending (in production, would send to FCM)
        for device_token in self.fcm_tokens[user_id]:
            self.notification_queue.append({
                'notification_id': notification_id,
                'user_id': user_id,
                'device_token': device_token,
                'payload': payload,
                'sent_at': datetime.now().isoformat(),
                'status': 'pending'
            })

        logger.info(f"Queued push notification for user {user_id} (tip: {tip_id})")

        return {
            'notification_id': notification_id,
            'status': 'queued',
            'devices': len(self.fcm_tokens[user_id])
        }

    def get_pending_notifications(self) -> List[Dict]:
        """Get notifications pending delivery."""
        return [n for n in self.notification_queue if n['status'] == 'pending']

    def mark_sent(self, notification_id: str) -> Dict:
        """Mark notification as successfully sent."""
        for notification in self.notification_queue:
            if notification['notification_id'] == notification_id:
                notification['status'] = 'sent'
                notification['delivered_at'] = datetime.now().isoformat()
                return {'status': 'marked_sent'}

        return {'status': 'error', 'message': 'Notification not found'}

    def mark_failed(self, notification_id: str, retry: bool = True) -> Dict:
        """Mark notification as failed."""
        for notification in self.notification_queue:
            if notification['notification_id'] == notification_id:
                if retry and notification.get('retry_count', 0) < 3:
                    notification['retry_count'] = notification.get('retry_count', 0) + 1
                    notification['status'] = 'pending'
                    return {'status': 'retry_queued'}
                else:
                    notification['status'] = 'failed'
                    return {'status': 'marked_failed'}

        return {'status': 'error', 'message': 'Notification not found'}


class EmailNotificationService:
    """
    Email notification service for recommendations.

    Manages email delivery of personalized recommendations with
    tracking, templating, and preference management.
    """

    def __init__(self):
        """Initialize email notification service."""
        self.email_queue: List[Dict] = []
        self.email_templates: Dict[str, str] = self._load_email_templates()
        self.user_emails: Dict[str, str] = {}

        logger.info("Initialized EmailNotificationService")

    def register_email(self, user_id: str, email: str) -> Dict:
        """Register user's email address."""
        self.user_emails[user_id] = email
        logger.info(f"Registered email for user {user_id}")
        return {'status': 'registered', 'user_id': user_id}

    def send_recommendation_email(
        self,
        user_id: str,
        recommendations: List[Dict],
        personalized_message: str = ""
    ) -> Dict:
        """
        Send personalized recommendation email.

        Args:
            user_id: User ID
            recommendations: List of recommended tips
            personalized_message: Custom message for user

        Returns:
            Send result
        """
        if user_id not in self.user_emails:
            logger.warning(f"No email registered for user {user_id}")
            return {'status': 'error', 'message': 'Email not registered'}

        email = self.user_emails[user_id]
        email_id = f"email_{user_id}_{datetime.now().timestamp()}"

        # Build email content
        subject = "Your Personalized Scam Prevention Tips"
        body = self._build_email_body(recommendations, personalized_message)

        self.email_queue.append({
            'email_id': email_id,
            'user_id': user_id,
            'recipient': email,
            'subject': subject,
            'body': body,
            'created_at': datetime.now().isoformat(),
            'sent_at': None,
            'status': 'pending',
            'retry_count': 0
        })

        logger.info(f"Queued recommendation email for user {user_id} ({len(recommendations)} tips)")

        return {
            'email_id': email_id,
            'status': 'queued',
            'recipient': email,
            'tips_included': len(recommendations)
        }

    def send_engagement_summary_email(
        self,
        user_id: str,
        summary: Dict
    ) -> Dict:
        """Send weekly engagement summary email."""
        if user_id not in self.user_emails:
            return {'status': 'error', 'message': 'Email not registered'}

        email = self.user_emails[user_id]
        email_id = f"email_summary_{user_id}_{datetime.now().timestamp()}"

        subject = f"Your Weekly Scam Prevention Summary ({datetime.now().strftime('%b %d')})"
        body = self._build_summary_email_body(summary)

        self.email_queue.append({
            'email_id': email_id,
            'user_id': user_id,
            'recipient': email,
            'subject': subject,
            'body': body,
            'created_at': datetime.now().isoformat(),
            'sent_at': None,
            'status': 'pending',
            'type': 'summary',
            'retry_count': 0
        })

        logger.info(f"Queued summary email for user {user_id}")

        return {
            'email_id': email_id,
            'status': 'queued',
            'recipient': email
        }

    def get_pending_emails(self) -> List[Dict]:
        """Get emails pending delivery."""
        return [e for e in self.email_queue if e['status'] == 'pending']

    def mark_sent(self, email_id: str) -> Dict:
        """Mark email as successfully sent."""
        for email in self.email_queue:
            if email['email_id'] == email_id:
                email['status'] = 'sent'
                email['sent_at'] = datetime.now().isoformat()
                logger.debug(f"Marked email {email_id} as sent")
                return {'status': 'marked_sent'}

        return {'status': 'error', 'message': 'Email not found'}

    def mark_failed(self, email_id: str, retry: bool = True) -> Dict:
        """Mark email as failed."""
        for email in self.email_queue:
            if email['email_id'] == email_id:
                if retry and email.get('retry_count', 0) < 3:
                    email['retry_count'] = email.get('retry_count', 0) + 1
                    email['status'] = 'pending'
                    logger.debug(f"Retrying email {email_id} (attempt {email['retry_count']})")
                    return {'status': 'retry_queued'}
                else:
                    email['status'] = 'failed'
                    logger.warning(f"Email {email_id} failed after retries")
                    return {'status': 'marked_failed'}

        return {'status': 'error', 'message': 'Email not found'}

    def _build_email_body(self, recommendations: List[Dict], personalized_message: str) -> str:
        """Build personalized recommendation email body."""
        body = "Hello,\n\n"

        if personalized_message:
            body += f"{personalized_message}\n\n"

        body += "We've selected these scam prevention tips just for you:\n\n"

        for i, tip in enumerate(recommendations, 1):
            body += f"{i}. {tip['title']}\n"
            body += f"   {tip['description']}\n"
            body += f"   Read time: {tip['length_minutes']} minutes\n"
            body += f"   Level: {tip['difficulty']}\n\n"

        body += "Click below to explore these tips:\n"
        body += "https://scamguard.ca/learn\n\n"

        body += "Protect yourself and others from scams!\n\n"
        body += "The ScamGuard Team\n"
        body += "https://scamguard.ca"

        return body

    def _build_summary_email_body(self, summary: Dict) -> str:
        """Build engagement summary email body."""
        body = "Hello,\n\n"

        body += "Here's your weekly scam prevention summary:\n\n"

        body += f"✓ Tips reviewed: {summary.get('tips_reviewed', 0)}\n"
        body += f"✓ Reports submitted: {summary.get('reports_submitted', 0)}\n"
        body += f"✓ Achievements earned: {summary.get('achievements_earned', 0)}\n"
        body += f"✓ Learning streak: {summary.get('days_active', 0)} days\n\n"

        body += f"Your current engagement score: {summary.get('engagement_score', 0)}/100\n\n"

        if summary.get('top_category'):
            body += f"Your strongest area: {summary['top_category']}\n\n"

        body += "Keep up the great work protecting yourself and your community!\n\n"

        body += "The ScamGuard Team\n"
        body += "https://scamguard.ca"

        return body

    def _load_email_templates(self) -> Dict[str, str]:
        """Load email templates."""
        return {
            'recommendation': 'recommendation_template.html',
            'summary': 'summary_template.html',
            'engagement': 'engagement_template.html'
        }


class NotificationManager:
    """
    Central notification manager orchestrating all channels.

    Coordinates push, email, and in-app notifications with
    preference management and delivery tracking.
    """

    def __init__(self):
        """Initialize notification manager."""
        self.push_service = PushNotificationService()
        self.email_service = EmailNotificationService()
        self.preferences: Dict[str, NotificationPreference] = {}
        self.delivery_history: List[NotificationRecord] = []

        logger.info("Initialized NotificationManager")

    def set_user_preferences(self, user_id: str, preferences: NotificationPreference) -> Dict:
        """Set user notification preferences."""
        self.preferences[user_id] = preferences
        logger.info(f"Updated preferences for user {user_id}")
        return {'status': 'updated', 'user_id': user_id}

    def get_user_preferences(self, user_id: str) -> Optional[NotificationPreference]:
        """Get user notification preferences."""
        return self.preferences.get(user_id)

    def send_recommendation(
        self,
        user_id: str,
        tip_id: str,
        title: str,
        description: str,
        channels: List[NotificationChannel] = None
    ) -> Dict:
        """
        Send recommendation through preferred channels.

        Args:
            user_id: User ID
            tip_id: Tip ID
            title: Tip title
            description: Tip description
            channels: Specific channels to use (or use preferences)

        Returns:
            Result of notification send
        """
        prefs = self.get_user_preferences(user_id)

        if not prefs:
            # Create default preferences
            prefs = NotificationPreference(user_id=user_id)
            self.set_user_preferences(user_id, prefs)

        # Check quiet hours
        if self._in_quiet_hours(prefs):
            logger.debug(f"User {user_id} in quiet hours - deferring notification")
            return {'status': 'deferred', 'reason': 'quiet_hours'}

        results = {}

        # Determine channels to use
        if not channels:
            channels = []
            if prefs.push_enabled:
                channels.append(NotificationChannel.PUSH)
            if prefs.email_enabled:
                channels.append(NotificationChannel.EMAIL)
            if prefs.in_app_enabled:
                channels.append(NotificationChannel.IN_APP)

        # Send via each channel
        for channel in channels:
            if channel == NotificationChannel.PUSH:
                result = self.push_service.send_push_notification(
                    user_id, tip_id, title, description
                )
                results['push'] = result

            elif channel == NotificationChannel.EMAIL:
                result = self.email_service.send_recommendation_email(
                    user_id, [{'title': title, 'description': description, 'length_minutes': 5}]
                )
                results['email'] = result

            elif channel == NotificationChannel.IN_APP:
                # In-app notifications stored in user's feed
                results['in_app'] = {
                    'status': 'queued',
                    'type': 'recommendation',
                    'tip_id': tip_id
                }

        logger.info(f"Sent recommendation for {tip_id} to user {user_id} via {len(channels)} channels")

        return {
            'status': 'sent',
            'user_id': user_id,
            'tip_id': tip_id,
            'channels_used': [c.value for c in channels],
            'results': results
        }

    def _in_quiet_hours(self, prefs: NotificationPreference) -> bool:
        """Check if current time is within user's quiet hours."""
        current_hour = datetime.now().hour
        start = int(prefs.quiet_hours_start.split(':')[0])
        end = int(prefs.quiet_hours_end.split(':')[0])

        if start > end:  # Wraps around midnight
            return current_hour >= start or current_hour < end

        return start <= current_hour < end


if __name__ == '__main__':
    print("Notification Service")
    print("=" * 50)
    print("Manages push, email, and in-app notifications")
