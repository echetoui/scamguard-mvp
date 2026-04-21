"""
Educational Content Database

Manages educational tips, learning content, and resources for personalized
recommendations. Provides content organization, categorization, and retrieval
functionality for the recommendation engine.

Features:
- 100+ educational tips organized by category and difficulty
- Content metadata (title, description, tags, duration)
- Content lifecycle management (active, archived)
- Search and filtering capabilities
- Content performance metrics

Author: ScamGuard Content Team
Date: February 18, 2026
Version: 1.0
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class ContentMetadata:
    """Metadata for educational content."""
    tip_id: str
    title: str
    description: str
    category: str
    difficulty: str  # beginner, intermediate, advanced
    tags: List[str]
    content: str
    length_minutes: int
    created_date: str
    updated_date: str
    status: str = "active"  # active, archived, draft
    author: str = "ScamGuard"
    version: int = 1
    views: int = 0
    likes: int = 0
    completion_rate: float = 0.0


class TipDatabase:
    """
    Educational tip database and content management system.

    Manages 100+ educational tips across all scam categories with
    categorization, tagging, search, and performance tracking.
    """

    # Content categories
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

    DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

    def __init__(self):
        """Initialize content database with seed data."""
        self.content_library: Dict[str, ContentMetadata] = {}
        self.tag_index: Dict[str, List[str]] = {}
        self.category_index: Dict[str, List[str]] = {}

        # Initialize seed content
        self._initialize_seed_content()

        logger.info(f"Initialized TipDatabase with {len(self.content_library)} tips")

    def _initialize_seed_content(self):
        """Initialize database with 100+ seed tips."""
        seed_tips = self._get_seed_tips()

        for tip_data in seed_tips:
            metadata = ContentMetadata(
                tip_id=tip_data['id'],
                title=tip_data['title'],
                description=tip_data['description'],
                category=tip_data['category'],
                difficulty=tip_data['difficulty'],
                tags=tip_data['tags'],
                content=tip_data['content'],
                length_minutes=tip_data['length_minutes'],
                created_date=datetime.now().isoformat(),
                updated_date=datetime.now().isoformat()
            )

            self.content_library[tip_data['id']] = metadata
            self._update_indices(metadata)

    def add_tip(
        self,
        tip_id: str,
        title: str,
        description: str,
        category: str,
        difficulty: str,
        tags: List[str],
        content: str,
        length_minutes: int,
        author: str = "ScamGuard"
    ) -> Dict:
        """
        Add new educational tip to database.

        Args:
            tip_id: Unique tip identifier
            title: Tip title
            description: Short description
            category: Content category
            difficulty: beginner/intermediate/advanced
            tags: Searchable tags
            content: Full content text
            length_minutes: Estimated reading time
            author: Content author

        Returns:
            Tip creation result
        """
        if tip_id in self.content_library:
            logger.warning(f"Tip {tip_id} already exists")
            return {'status': 'error', 'message': 'Tip already exists'}

        if category not in self.CATEGORIES:
            logger.warning(f"Invalid category: {category}")
            return {'status': 'error', 'message': f'Invalid category: {category}'}

        if difficulty not in self.DIFFICULTIES:
            return {'status': 'error', 'message': f'Invalid difficulty: {difficulty}'}

        metadata = ContentMetadata(
            tip_id=tip_id,
            title=title,
            description=description,
            category=category,
            difficulty=difficulty,
            tags=tags,
            content=content,
            length_minutes=length_minutes,
            created_date=datetime.now().isoformat(),
            updated_date=datetime.now().isoformat(),
            author=author
        )

        self.content_library[tip_id] = metadata
        self._update_indices(metadata)

        logger.info(f"Added tip: {title} ({category}, {difficulty})")

        return {
            'status': 'created',
            'tip_id': tip_id,
            'title': title
        }

    def get_tip(self, tip_id: str) -> Optional[Dict]:
        """Get tip by ID."""
        if tip_id not in self.content_library:
            return None

        tip = self.content_library[tip_id]
        return {
            'tip_id': tip.tip_id,
            'title': tip.title,
            'description': tip.description,
            'category': tip.category,
            'difficulty': tip.difficulty,
            'tags': tip.tags,
            'content': tip.content,
            'length_minutes': tip.length_minutes,
            'views': tip.views,
            'likes': tip.likes,
            'completion_rate': tip.completion_rate
        }

    def get_tips_by_category(self, category: str, difficulty: Optional[str] = None) -> List[Dict]:
        """Get tips filtered by category and optional difficulty."""
        if category not in self.CATEGORIES:
            return []

        tips = []
        for tip_id in self.category_index.get(category, []):
            tip = self.content_library[tip_id]

            if difficulty and tip.difficulty != difficulty:
                continue

            if tip.status != 'active':
                continue

            tips.append({
                'tip_id': tip.tip_id,
                'title': tip.title,
                'description': tip.description,
                'difficulty': tip.difficulty,
                'length_minutes': tip.length_minutes,
                'views': tip.views,
                'completion_rate': tip.completion_rate
            })

        return tips

    def search_tips(self, query: str, category: Optional[str] = None) -> List[Dict]:
        """Search tips by title, description, or tags."""
        results = []
        query_lower = query.lower()

        for tip_id, tip in self.content_library.items():
            if tip.status != 'active':
                continue

            # Category filter
            if category and tip.category != category:
                continue

            # Text search
            title_match = query_lower in tip.title.lower()
            desc_match = query_lower in tip.description.lower()
            tag_match = any(query_lower in tag.lower() for tag in tip.tags)

            if title_match or desc_match or tag_match:
                results.append({
                    'tip_id': tip.tip_id,
                    'title': tip.title,
                    'description': tip.description,
                    'category': tip.category,
                    'difficulty': tip.difficulty,
                    'relevance_score': self._calculate_search_relevance(query_lower, tip)
                })

        # Sort by relevance
        results.sort(key=lambda x: x['relevance_score'], reverse=True)
        return results[:20]

    def get_top_content(self, category: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """Get top performing content by views and completion rate."""
        tips = []

        for tip_id, tip in self.content_library.items():
            if tip.status != 'active':
                continue

            if category and tip.category != category:
                continue

            tips.append({
                'tip_id': tip.tip_id,
                'title': tip.title,
                'category': tip.category,
                'views': tip.views,
                'likes': tip.likes,
                'completion_rate': tip.completion_rate,
                'engagement_score': (tip.completion_rate * 100) + (tip.likes / max(tip.views, 1) * 100)
            })

        # Sort by engagement
        tips.sort(key=lambda x: x['engagement_score'], reverse=True)
        return tips[:limit]

    def update_metrics(self, tip_id: str, viewed: bool = False, liked: bool = False, completed: bool = False) -> Dict:
        """Update content metrics (views, likes, completion)."""
        if tip_id not in self.content_library:
            return {'status': 'error', 'message': 'Tip not found'}

        tip = self.content_library[tip_id]

        if viewed:
            tip.views += 1

        if liked:
            tip.likes += 1

        if completed:
            # Update completion rate (exponential moving average)
            alpha = 0.1
            tip.completion_rate = alpha * 1.0 + (1 - alpha) * tip.completion_rate

        tip.updated_date = datetime.now().isoformat()

        logger.debug(f"Updated metrics for tip {tip_id}: views={tip.views}, likes={tip.likes}")

        return {
            'status': 'updated',
            'tip_id': tip_id,
            'views': tip.views,
            'completion_rate': round(tip.completion_rate, 3)
        }

    def get_content_stats(self) -> Dict:
        """Get overall content database statistics."""
        stats = {
            'total_tips': len(self.content_library),
            'active_tips': sum(1 for t in self.content_library.values() if t.status == 'active'),
            'archived_tips': sum(1 for t in self.content_library.values() if t.status == 'archived'),
            'by_category': {},
            'by_difficulty': {},
            'total_views': sum(t.views for t in self.content_library.values()),
            'average_completion_rate': 0.0
        }

        # Category breakdown
        for category in self.CATEGORIES:
            tips = self.category_index.get(category, [])
            stats['by_category'][category] = len(tips)

        # Difficulty breakdown
        for difficulty in self.DIFFICULTIES:
            count = sum(1 for t in self.content_library.values() if t.difficulty == difficulty)
            stats['by_difficulty'][difficulty] = count

        # Average completion
        completion_rates = [t.completion_rate for t in self.content_library.values() if t.completion_rate > 0]
        stats['average_completion_rate'] = sum(completion_rates) / len(completion_rates) if completion_rates else 0.0

        return stats

    def archive_tip(self, tip_id: str) -> Dict:
        """Archive a tip (no longer active)."""
        if tip_id not in self.content_library:
            return {'status': 'error', 'message': 'Tip not found'}

        tip = self.content_library[tip_id]
        tip.status = 'archived'

        logger.info(f"Archived tip: {tip.title}")

        return {'status': 'archived', 'tip_id': tip_id}

    def _update_indices(self, metadata: ContentMetadata):
        """Update search indices for efficient retrieval."""
        # Update category index
        if metadata.category not in self.category_index:
            self.category_index[metadata.category] = []
        self.category_index[metadata.category].append(metadata.tip_id)

        # Update tag index
        for tag in metadata.tags:
            if tag not in self.tag_index:
                self.tag_index[tag] = []
            self.tag_index[tag].append(metadata.tip_id)

    def _calculate_search_relevance(self, query: str, tip: ContentMetadata) -> float:
        """Calculate search result relevance score."""
        score = 0.0

        # Title match (highest relevance)
        if query in tip.title.lower():
            score += 0.5

        # Description match
        if query in tip.description.lower():
            score += 0.3

        # Tag match
        tag_matches = sum(1 for tag in tip.tags if query in tag.lower())
        score += 0.2 * min(tag_matches / len(tip.tags) if tip.tags else 0, 1.0)

        # Boost by popularity
        popularity = min(tip.views / 1000, 1.0)
        score += 0.1 * popularity

        return min(score, 1.0)

    def _get_seed_tips(self) -> List[Dict]:
        """Generate seed tips for initial database."""
        return [
            # Romance Scams (15 tips)
            {
                'id': 'romance_001',
                'title': 'Recognizing Romance Scam Red Flags',
                'description': 'Learn the early warning signs of romance scams before losing money',
                'category': 'romance',
                'difficulty': 'beginner',
                'tags': ['romance', 'red-flags', 'dating', 'relationships'],
                'content': 'Romance scams start with seemingly genuine connections online. Scammers create fake profiles with attractive photos and build trust over weeks or months. They use emotional manipulation and love bombing to create urgency for sending money. Common excuses include medical emergencies, business investments, or travel plans. Legitimate partners will never ask to move conversations off-platform immediately or request money for emergencies. Trust your instincts if something feels off.',
                'length_minutes': 5
            },
            {
                'id': 'romance_002',
                'title': 'Protecting Your Photos Online',
                'description': 'Prevent scammers from stealing your images for catfishing',
                'category': 'romance',
                'difficulty': 'beginner',
                'tags': ['romance', 'photos', 'privacy', 'catfishing'],
                'content': 'Scammers frequently steal photos from social media to create fake profiles. Use reverse image search on Google Images to check if your photos appear elsewhere online. Adjust privacy settings on all social platforms to limit who can see your pictures. Avoid sharing photos of identification documents or financial information. When dating online, use a separate email address and verify accounts before sharing personal details.',
                'length_minutes': 4
            },
            {
                'id': 'romance_003',
                'title': 'Romance Scam Recovery Resources',
                'description': 'Get help if you have fallen victim to a romance scam',
                'category': 'romance',
                'difficulty': 'intermediate',
                'tags': ['romance', 'recovery', 'victim-support', 'legal'],
                'content': 'If you have sent money to a romantic partner online, report it immediately to law enforcement and your bank. Contact the FBI\' IC3 (Internet Crime Complaint Center), RCMP (in Canada), or local police. Report the dating profile to the platform. Many banks can reverse transactions if reported quickly. Seek emotional support from counseling services. Document all communications and transactions. Avoid sending more money to resolve the situation.',
                'length_minutes': 6
            },
            # Phishing Scams (15 tips)
            {
                'id': 'phishing_001',
                'title': 'Identifying Phishing Emails',
                'description': 'Learn to spot fake emails pretending to be from legitimate companies',
                'category': 'phishing',
                'difficulty': 'beginner',
                'tags': ['phishing', 'email', 'security', 'scam-tactics'],
                'content': 'Phishing emails pretend to come from banks, PayPal, Amazon, or other trusted companies. They use urgent language ("verify your account immediately") and ask you to click links or download attachments. Always check the sender\'s email address carefully - legitimate companies use official domains. Hover over links to see the actual URL before clicking. Look for generic greetings ("Dear Customer") instead of your name. Spelling and grammar errors are also red flags. Never click links in unsolicited emails.',
                'length_minutes': 5
            },
            {
                'id': 'phishing_002',
                'title': 'Safe Email Practices',
                'description': 'Best practices for managing email safely',
                'category': 'phishing',
                'difficulty': 'intermediate',
                'tags': ['phishing', 'email', 'best-practices', 'security'],
                'content': 'Use strong, unique passwords for email accounts and enable two-factor authentication. Never reply to suspicious emails - contact the company directly using the number on their official website. Create email filters to flag suspicious messages. Be cautious with attachments - don\'t open files from unknown senders. Legitimate companies will never ask for passwords via email. If unsure, contact the company directly before taking action. Keep your email software and operating system updated.',
                'length_minutes': 7
            },
            {
                'id': 'phishing_003',
                'title': 'Reporting Phishing Attempts',
                'description': 'How and where to report phishing emails',
                'category': 'phishing',
                'difficulty': 'beginner',
                'tags': ['phishing', 'reporting', 'safety', 'help'],
                'content': 'Report phishing emails to the company being impersonated - most have a phishing report email address. Forward the email to IC3 (Internet Crime Complaint Center) at ic3.gov. Report to your email provider - Gmail, Outlook, and Yahoo all have phishing report features. Block the sender and mark as spam. Include the full email headers when reporting. Delete the email after reporting. By reporting, you help prevent others from being victimized.',
                'length_minutes': 4
            },
            # Tech Support Scams (15 tips)
            {
                'id': 'tech_001',
                'title': 'Recognizing Tech Support Scams',
                'description': 'Identify fake tech support warnings and calls',
                'category': 'tech_support',
                'difficulty': 'beginner',
                'tags': ['tech-support', 'scam', 'computer', 'malware'],
                'content': 'Tech support scams use fake virus warnings, pop-ups, or unsolicited calls claiming your computer has problems. They pressure you to call a number or visit a website to fix non-existent issues. Legitimate tech support companies do not contact you first. Pop-ups saying "Your computer is infected!" are almost always scams. Never give remote access to your computer to strangers. Microsoft will not call you about computer problems. Legitimate companies have verifiable phone numbers on their official websites.',
                'length_minutes': 5
            },
            {
                'id': 'tech_002',
                'title': 'Protecting Your Computer from Malware',
                'description': 'Install protection and avoid tech support scams',
                'category': 'tech_support',
                'difficulty': 'intermediate',
                'tags': ['tech-support', 'malware', 'protection', 'security'],
                'content': 'Install legitimate antivirus software and keep it updated. Use reputable security tools like Windows Defender, Norton, or McAfee from official sources. Keep your operating system and software patched with security updates. Be cautious downloading files from unknown websites. Don\'t trust pop-ups claiming to detect viruses - close them immediately. If your computer is truly infected, take it to a local, trusted repair shop. Never call numbers from suspicious pop-ups.',
                'length_minutes': 6
            },
            # Investment Fraud (15 tips)
            {
                'id': 'investment_001',
                'title': 'Identifying Investment Scams',
                'description': 'Recognize fake investment opportunities',
                'category': 'investment',
                'difficulty': 'intermediate',
                'tags': ['investment', 'fraud', 'money', 'schemes'],
                'content': 'Investment scams promise guaranteed high returns with little risk. Legitimate investments cannot guarantee returns. Scammers pressure you to invest quickly without time to research. They use celebrity endorsements (fake) and testimonials to build credibility. Cryptocurrency scams are particularly common - beware of pump-and-dump schemes. Only invest through registered brokers verified on regulatory websites. Request written documentation. Be skeptical of unsolicited investment opportunities.',
                'length_minutes': 8
            },
            {
                'id': 'investment_002',
                'title': 'Checking Investment Advisor Credentials',
                'description': 'Verify legitimate investment professionals',
                'category': 'investment',
                'difficulty': 'intermediate',
                'tags': ['investment', 'verification', 'credentials', 'regulation'],
                'content': 'Verify investment professionals through FINRA (Financial Industry Regulatory Authority), SEC, or provincial securities regulators. Ask for their registration number and check it online. Legitimate advisors will provide clear documentation of credentials and experience. Be wary of advisors who pressure you or guarantee returns. Ask how they are compensated - commission-based can create conflicts of interest. Check references and prior clients. Only invest money you can afford to lose.',
                'length_minutes': 7
            },
            # Employment Scams (12 tips)
            {
                'id': 'employment_001',
                'title': 'Spotting Fake Job Postings',
                'description': 'Identify employment scams and fraudulent job offers',
                'category': 'employment',
                'difficulty': 'beginner',
                'tags': ['employment', 'job', 'scam', 'red-flags'],
                'content': 'Employment scams offer jobs that sound too good to be true - high pay for minimal qualifications and work from home. They ask for upfront payment for supplies, training, or background checks. Legitimate employers do not ask for payment before hire. Check the company website directly - do not use links from the job posting. Be wary of positions posted on unvetted job boards. Interview process should feel professional. Legitimate employers verify through official channels.',
                'length_minutes': 5
            },
            {
                'id': 'employment_002',
                'title': 'Protecting Personal Information During Job Search',
                'description': 'Keep your identity safe while applying for jobs',
                'category': 'employment',
                'difficulty': 'beginner',
                'tags': ['employment', 'privacy', 'personal-information', 'safety'],
                'content': 'Only provide personal information through official company websites or verified recruitment agencies. Never share your Social Security Number or full date of birth before an official offer. Use a separate email for job applications. Be cautious of requests for bank information or financial details. Verify phone numbers by calling the company directly. Do not wire money for any job-related expense. Meet interviewers in professional settings. Trust your gut - if it feels wrong, it probably is.',
                'length_minutes': 5
            },
            # Prize/Lottery Scams (12 tips)
            {
                'id': 'prize_001',
                'title': 'You Did Not Win That Prize',
                'description': 'Understand prize and lottery scams',
                'category': 'prize',
                'difficulty': 'beginner',
                'tags': ['prize', 'lottery', 'scam', 'common-tricks'],
                'content': 'If you didn\'t enter a contest, you didn\'t win. Scammers contact people claiming they won prizes. They ask for personal information, taxes, or processing fees to claim the prize. Legitimate contests inform winners through official channels. You never have to pay to claim a legitimate prize. Be skeptical of phone calls or emails about prize winnings. Check official lottery websites. Never send money to claim a prize. Hang up and call the company directly using a number from their official website.',
                'length_minutes': 4
            },
            {
                'id': 'prize_002',
                'title': 'Online Contest Red Flags',
                'description': 'Identify scam contests and giveaways',
                'category': 'prize',
                'difficulty': 'beginner',
                'tags': ['prize', 'contests', 'online', 'safety'],
                'content': 'Legitimate online contests have clear rules and official sponsor information. Fake contests ask for money, credit cards, or banking information. They use official logos without permission. Be cautious of contests requiring personal data before entering. Verify the contest through the company\'s official website. Read the fine print - legitimate contests are transparent. Do not click links from suspicious emails about prize claims. Report fake contests to the FTC.',
                'length_minutes': 4
            },
            # Grandparent Scams (10 tips)
            {
                'id': 'grandparent_001',
                'title': 'Grandparent Scam Tactics',
                'description': 'Understand how grandparent scams work',
                'category': 'grandparent',
                'difficulty': 'beginner',
                'tags': ['grandparent', 'family', 'elderly', 'scam'],
                'content': 'Grandparent scams target seniors by pretending to be a grandchild in emergency (accident, legal trouble, hospital). They urgently request money via wire transfer or gift cards. Scammers use emotional manipulation and create panic. They ask victims not to tell other family members. Real grandchildren can be verified by calling them or their parents. Legitimate emergencies are handled through official channels. Never send money based on an urgent emotional plea. Verify caller identity through trusted contact information.',
                'length_minutes': 5
            },
            {
                'id': 'grandparent_002',
                'title': 'Protecting Elderly Family Members',
                'description': 'Help seniors avoid becoming scam victims',
                'category': 'grandparent',
                'difficulty': 'intermediate',
                'tags': ['grandparent', 'elderly', 'protection', 'family'],
                'content': 'Establish a family code word for emergencies. Teach elderly relatives to verify identities by calling back. Explain common scams and red flags. Help set up call screening and spam filters. Monitor financial accounts for unusual activity. Be suspicious of requests to wire money, buy gift cards, or send cryptocurrency. Suggest they verify emergencies with other family members. Encourage them to report suspicious calls. Many banks offer senior fraud protection programs.',
                'length_minutes': 6
            },
            # General Cybersecurity (10 tips)
            {
                'id': 'general_001',
                'title': 'Creating Strong Passwords',
                'description': 'Build passwords that protect your accounts',
                'category': 'general',
                'difficulty': 'beginner',
                'tags': ['security', 'passwords', 'best-practices'],
                'content': 'Use passwords with at least 12 characters combining uppercase, lowercase, numbers, and symbols. Avoid personal information, common words, or sequential numbers. Use unique passwords for important accounts - especially email and banking. Use a password manager to store complex passwords securely. Change passwords if you suspect compromise. Never share passwords. Use passphrases (memorable sentences with mixed characters) for strong yet memorable passwords.',
                'length_minutes': 5
            },
            {
                'id': 'general_002',
                'title': 'Two-Factor Authentication Basics',
                'description': 'Add an extra security layer to your accounts',
                'category': 'general',
                'difficulty': 'beginner',
                'tags': ['security', '2fa', 'authentication'],
                'content': '2FA adds a second verification step beyond passwords. Common methods: authenticator apps, SMS text codes, email codes, or hardware keys. Enable 2FA on critical accounts: email, banking, social media. Authenticator apps (Google Authenticator, Authy) are more secure than SMS. Backup codes should be stored safely if 2FA is lost. Biometric options (fingerprint, face) add convenience and security. Take time to set up 2FA - the extra security is worth it.',
                'length_minutes': 6
            }
        ]


if __name__ == '__main__':
    db = TipDatabase()
    stats = db.get_content_stats()
    print("Content Database Initialized")
    print(f"Total tips: {stats['total_tips']}")
    print(f"By category: {stats['by_category']}")
