"""
User Researcher Agent
Specializes in user research analysis, pain point identification, and qualitative insight synthesis.
"""

import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('TABLE_NAME', 'ScamGuardData'))

def handler(event, context):
    """
    Analyze user research data and provide insights.

    Input:
    {
        "research_type": "feedback|interviews|support_tickets|survey",
        "data": [...],
        "focus_area": "authentication|family|security|general"
    }

    Output:
    {
        "pain_points": [...],
        "patterns": [...],
        "user_segments": [...],
        "jobs_to_be_done": [...],
        "recommendations": [...],
        "research_gaps": [...]
    }
    """

    try:
        print(f"👤 UserResearcher analyzing: {json.dumps(event)}")

        research_type = event.get('research_type', 'feedback')
        data = event.get('data', [])
        focus_area = event.get('focus_area', 'general')

        # Analyze based on research type
        if research_type == 'feedback':
            insights = analyze_feedback(data, focus_area)
        elif research_type == 'interviews':
            insights = analyze_interviews(data, focus_area)
        elif research_type == 'support_tickets':
            insights = analyze_support_tickets(data, focus_area)
        elif research_type == 'survey':
            insights = analyze_survey(data, focus_area)
        else:
            insights = analyze_general(data, focus_area)

        # Store research findings
        store_research_insights(focus_area, insights)

        return {
            'statusCode': 200,
            'body': {
                'status': 'analysis_complete',
                'focus_area': focus_area,
                'research_type': research_type,
                'insights': insights,
                'timestamp': datetime.utcnow().isoformat()
            }
        }

    except Exception as e:
        print(f"❌ UserResearcher error: {str(e)}")
        return {
            'statusCode': 500,
            'body': {
                'status': 'error',
                'error': str(e)
            }
        }

def analyze_feedback(feedback_data, focus_area):
    """Analyze user feedback and extract pain points."""

    pain_points = []
    patterns = {}

    for item in feedback_data:
        text = item.get('text', '').lower()

        # Pain point keywords
        if any(word in text for word in ['slow', 'lag', 'crash', 'error', 'confusing', 'hard']):
            pain_points.append({
                'type': 'usability',
                'description': item.get('text', ''),
                'frequency': item.get('count', 1),
                'severity': 'high' if any(word in text for word in ['crash', 'error']) else 'medium'
            })

        if any(word in text for word in ['scary', 'worried', 'unsafe', 'security']):
            pain_points.append({
                'type': 'security',
                'description': item.get('text', ''),
                'frequency': item.get('count', 1),
                'severity': 'high'
            })

        if any(word in text for word in ['complicated', 'confusing', 'unclear']):
            pain_points.append({
                'type': 'clarity',
                'description': item.get('text', ''),
                'frequency': item.get('count', 1),
                'severity': 'medium'
            })

        # Pattern recognition
        for pattern_key in ['authentication', 'family', 'scams']:
            if pattern_key in text:
                patterns[pattern_key] = patterns.get(pattern_key, 0) + item.get('count', 1)

    # Sort by severity and frequency
    pain_points.sort(key=lambda x: (x['severity'] == 'high', x['frequency']), reverse=True)

    return {
        'pain_points': pain_points[:5],  # Top 5
        'patterns': patterns,
        'user_segments': segment_by_pain_point(pain_points),
        'jobs_to_be_done': extract_jtbd(feedback_data),
        'recommendations': generate_recommendations(pain_points, focus_area),
        'research_gaps': identify_gaps(feedback_data, focus_area)
    }

def analyze_interviews(interview_data, focus_area):
    """Analyze user interviews for deep insights."""

    insights = {
        'pain_points': [],
        'quotes': [],
        'themes': [],
        'behaviors': [],
        'jobs_to_be_done': [],
        'recommendations': []
    }

    for interview in interview_data:
        # Extract quotes
        for quote in interview.get('quotes', []):
            if 'problem' in quote.lower() or 'issue' in quote.lower():
                insights['quotes'].append({
                    'text': quote,
                    'user_id': interview.get('user_id'),
                    'type': 'pain_point'
                })

        # Identify behaviors
        for behavior in interview.get('behaviors', []):
            insights['behaviors'].append(behavior)

        # Extract needs
        for need in interview.get('needs', []):
            insights['jobs_to_be_done'].append(need)

    insights['recommendations'] = generate_recommendations_from_interviews(interview_data, focus_area)

    return insights

def analyze_support_tickets(tickets, focus_area):
    """Analyze support tickets for common issues."""

    issue_counts = {}
    critical_issues = []

    for ticket in tickets:
        issue_type = ticket.get('category', 'general')
        issue_counts[issue_type] = issue_counts.get(issue_type, 0) + 1

        # Flag critical issues
        if ticket.get('severity') == 'critical' or ticket.get('resolution_time', float('inf')) > 86400:
            critical_issues.append(ticket)

    return {
        'pain_points': [
            {
                'type': issue_type,
                'frequency': count,
                'severity': 'high' if count > 10 else 'medium'
            }
            for issue_type, count in sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ],
        'critical_issues': critical_issues,
        'resolution_time_analysis': analyze_resolution_times(tickets),
        'recommendations': generate_support_recommendations(issue_counts, focus_area),
        'research_gaps': ['Root cause analysis needed for top 3 issues']
    }

def analyze_survey(survey_data, focus_area):
    """Analyze survey responses for quantitative insights."""

    responses = {}
    for response in survey_data:
        for answer in response.get('answers', []):
            question = answer.get('question')
            value = answer.get('value')
            responses[question] = responses.get(question, [])
            responses[question].append(value)

    return {
        'pain_points': aggregate_pain_points(responses),
        'satisfaction_scores': calculate_satisfaction(responses),
        'user_segments': segment_survey_respondents(survey_data),
        'recommendations': generate_survey_recommendations(responses, focus_area),
        'research_gaps': ['Qualitative follow-up needed on low satisfaction areas']
    }

def analyze_general(data, focus_area):
    """Generic analysis for mixed data types."""

    return {
        'pain_points': extract_pain_points(data),
        'patterns': identify_patterns(data),
        'user_segments': segment_users(data),
        'jobs_to_be_done': extract_jtbd(data),
        'recommendations': generate_recommendations(data, focus_area),
        'research_gaps': ['More structured data collection needed']
    }

def segment_by_pain_point(pain_points):
    """Segment users by their primary pain points."""
    segments = {}
    for pain in pain_points:
        pain_type = pain['type']
        segments[pain_type] = segments.get(pain_type, 0) + 1
    return segments

def segment_survey_respondents(survey_data):
    """Segment survey respondents by demographics or behavior."""
    segments = {}
    for response in survey_data:
        age_group = response.get('age_group', 'unknown')
        segments[age_group] = segments.get(age_group, 0) + 1
    return segments

def segment_users(data):
    """Segment users based on characteristics."""
    return {
        'seniors_65_plus': len([d for d in data if d.get('age', 0) >= 65]),
        'family_members': len([d for d in data if d.get('role') == 'family_member']),
        'individual_users': len([d for d in data if d.get('role') == 'individual'])
    }

def extract_jtbd(data):
    """Extract Jobs-to-be-Done from user feedback."""
    jtbd = []
    for item in data:
        if 'goal' in item or 'want' in item:
            jtbd.append({
                'job': item.get('goal', item.get('want', '')),
                'context': item.get('context', '')
            })
    return jtbd

def extract_pain_points(data):
    """Extract pain points from data."""
    return [
        {
            'description': item.get('issue', item.get('problem', '')),
            'frequency': item.get('count', 1),
            'severity': item.get('severity', 'medium')
        }
        for item in data if 'issue' in item or 'problem' in item
    ]

def identify_patterns(data):
    """Identify recurring patterns in data."""
    patterns = {}
    for item in data:
        for key in ['theme', 'category', 'type']:
            if key in item:
                patterns[item[key]] = patterns.get(item[key], 0) + 1
    return patterns

def generate_recommendations(pain_points, focus_area):
    """Generate product recommendations based on pain points."""
    recs = []

    for pain in pain_points[:3]:  # Top 3 pain points
        if pain['type'] == 'usability':
            recs.append(f"Improve {focus_area} usability - users report slowness/crashes")
        elif pain['type'] == 'security':
            recs.append(f"Enhance security perception in {focus_area} - users feel unsafe")
        elif pain['type'] == 'clarity':
            recs.append(f"Simplify {focus_area} - users find it confusing")

    return recs

def generate_recommendations_from_interviews(interviews, focus_area):
    """Generate recommendations from interview findings."""
    return [
        f"Address top pain points from interviews: {focus_area} needs improvement",
        "Validate behavior findings with larger user sample",
        "Implement job-to-be-done framework for product roadmap"
    ]

def generate_support_recommendations(issue_counts, focus_area):
    """Generate recommendations from support ticket analysis."""
    top_issue = max(issue_counts.items(), key=lambda x: x[1])[0]
    return [
        f"Priority: Fix {top_issue} (highest support volume)",
        "Create self-help resources for common issues",
        f"Improve {focus_area} to reduce support tickets"
    ]

def generate_survey_recommendations(responses, focus_area):
    """Generate recommendations from survey data."""
    return [
        f"Address low-satisfaction areas in {focus_area}",
        "Validate survey findings with qualitative research",
        "Segment product roadmap by user segment needs"
    ]

def analyze_resolution_times(tickets):
    """Analyze how long it takes to resolve support tickets."""
    times = [t.get('resolution_time', 0) for t in tickets]
    return {
        'avg_hours': sum(times) / len(times) / 3600 if times else 0,
        'critical_tickets_avg': sum([t.get('resolution_time', 0) for t in tickets if t.get('severity') == 'critical']) / len([t for t in tickets if t.get('severity') == 'critical']) / 3600 if any(t.get('severity') == 'critical' for t in tickets) else 0
    }

def calculate_satisfaction(responses):
    """Calculate user satisfaction from survey responses."""
    satisfaction_scores = [float(v) for v in responses.get('satisfaction', []) if isinstance(v, (int, float))]
    return {
        'avg_score': sum(satisfaction_scores) / len(satisfaction_scores) if satisfaction_scores else 0,
        'median_score': sorted(satisfaction_scores)[len(satisfaction_scores)//2] if satisfaction_scores else 0
    }

def aggregate_pain_points(responses):
    """Aggregate pain points from survey responses."""
    return [
        {
            'type': 'survey_finding',
            'description': question,
            'frequency': len(values)
        }
        for question, values in responses.items() if 'problem' in question.lower()
    ]

def identify_gaps(data, focus_area):
    """Identify research gaps that need follow-up."""
    gaps = []

    if not any('qualitative' in str(d) for d in data):
        gaps.append('Need qualitative interviews to understand "why" behind feedback')

    if len(data) < 10:
        gaps.append('Sample size too small - need more respondents for statistical validity')

    if focus_area not in str(data):
        gaps.append(f'Limited data on {focus_area} - recommend targeted research')

    return gaps

def store_research_insights(focus_area, insights):
    """Store research findings in DynamoDB for future reference."""
    try:
        table.put_item(
            Item={
                'pk': f'RESEARCH#{focus_area}',
                'sk': f'INSIGHTS#{datetime.utcnow().isoformat()}',
                'pain_points': json.dumps(insights.get('pain_points', [])),
                'recommendations': json.dumps(insights.get('recommendations', [])),
                'ttl': int(datetime.utcnow().timestamp()) + 7776000  # 90 days
            }
        )
        print(f"✅ Stored research insights for {focus_area}")
    except Exception as e:
        print(f"⚠️  Could not store research insights: {str(e)}")
