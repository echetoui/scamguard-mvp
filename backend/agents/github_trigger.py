"""
GitHub Webhook Trigger Handler
Automatically invokes UserResearcher when a new feature PR is created
"""

import json
import os
import boto3
import hmac
import hashlib
from datetime import datetime

lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('TABLE_NAME', 'ScamGuardData'))

GITHUB_SECRET = os.environ.get('GITHUB_WEBHOOK_SECRET', '')
RESEARCHER_FUNCTION = 'UserResearcherLambda'

def handler(event, context):
    """
    GitHub webhook handler - triggers UserResearcher on new feature PRs
    """

    try:
        print(f"🔔 GitHub webhook received: {json.dumps(event)}")

        # Verify webhook signature
        body = event.get('body', '{}')
        signature = event.get('headers', {}).get('X-Hub-Signature-256', '')

        if not verify_github_signature(body, signature):
            print("❌ Invalid GitHub signature")
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid signature'})
            }

        # Parse webhook payload
        payload = json.loads(body) if isinstance(body, str) else body

        # Handle different webhook events
        action = payload.get('action', '')
        pr = payload.get('pull_request', {})
        issue = payload.get('issue', {})
        repository = payload.get('repository', {})

        # Check if this is a feature PR
        if pr and action in ['opened', 'synchronize', 'labeled']:
            result = handle_feature_pr(pr, repository)
        elif issue and action in ['opened', 'labeled']:
            result = handle_feature_issue(issue, repository)
        else:
            result = {
                'status': 'ignored',
                'reason': f'Event not relevant: {action}'
            }

        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"❌ Error processing webhook: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def verify_github_signature(body, signature):
    """Verify GitHub webhook signature."""

    if not GITHUB_SECRET:
        print("⚠️  No GitHub secret configured - skipping signature verification")
        return True

    try:
        expected = 'sha256=' + hmac.new(
            GITHUB_SECRET.encode(),
            body.encode() if isinstance(body, str) else body,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(signature, expected)
    except Exception as e:
        print(f"Signature verification error: {str(e)}")
        return False

def handle_feature_pr(pr, repository):
    """Handle feature PR - trigger UserResearcher."""

    pr_number = pr.get('number')
    title = (pr.get('title') or '').lower()
    labels = [label.get('name', '').lower() for label in pr.get('labels', [])]
    body = (pr.get('body') or '').lower()

    # Check if this is a feature PR
    is_feature = (
        'feature' in labels or
        'enhancement' in labels or
        'feature' in title or
        'enhancement' in title
    )

    if not is_feature:
        return {
            'status': 'ignored',
            'pr_number': pr_number,
            'reason': 'Not a feature PR'
        }

    print(f"✅ Feature PR detected: #{pr_number} - {pr.get('title')}")

    # Extract feature info
    feature_info = {
        'pr_number': pr_number,
        'title': pr.get('title', ''),
        'description': pr.get('body', ''),
        'url': pr.get('html_url', ''),
        'author': pr.get('user', {}).get('login', ''),
        'repository': repository.get('full_name', ''),
        'branch': pr.get('head', {}).get('ref', '')
    }

    # Trigger UserResearcher
    invoke_result = invoke_user_researcher(feature_info)

    # Store trigger info
    store_trigger_info(feature_info, invoke_result)

    return {
        'status': 'triggered',
        'pr_number': pr_number,
        'agent': 'UserResearcher',
        'invocation_id': invoke_result.get('invocation_id'),
        'next_step': 'Researcher analyzing feature requirements...'
    }

def handle_feature_issue(issue, repository):
    """Handle feature request issue - trigger UserResearcher."""

    issue_number = issue.get('number')
    title = (issue.get('title') or '').lower()
    labels = [label.get('name', '').lower() for label in issue.get('labels', [])]

    # Check if this is a feature request
    is_feature = (
        'feature request' in labels or
        'enhancement' in labels or
        'feature' in title
    )

    if not is_feature:
        return {
            'status': 'ignored',
            'issue_number': issue_number,
            'reason': 'Not a feature request'
        }

    print(f"✅ Feature request detected: #{issue_number} - {issue.get('title')}")

    # Extract feature info
    feature_info = {
        'issue_number': issue_number,
        'title': issue.get('title', ''),
        'description': issue.get('body', ''),
        'url': issue.get('html_url', ''),
        'author': issue.get('user', {}).get('login', ''),
        'repository': repository.get('full_name', ''),
        'type': 'feature_request'
    }

    # Trigger UserResearcher
    invoke_result = invoke_user_researcher(feature_info)

    # Store trigger info
    store_trigger_info(feature_info, invoke_result)

    return {
        'status': 'triggered',
        'issue_number': issue_number,
        'agent': 'UserResearcher',
        'invocation_id': invoke_result.get('invocation_id'),
        'next_step': 'Researcher analyzing feature request...'
    }

def invoke_user_researcher(feature_info):
    """Invoke UserResearcher Lambda with feature info."""

    try:
        payload = {
            'research_type': 'feedback',
            'focus_area': extract_focus_area(feature_info),
            'data': [
                {
                    'text': feature_info.get('description', ''),
                    'source': 'github_pr' if 'pr_number' in feature_info else 'github_issue',
                    'author': feature_info.get('author', 'unknown')
                }
            ],
            'feature_info': feature_info
        }

        print(f"📞 Invoking UserResearcher with payload: {json.dumps(payload)}")

        # Invoke async (don't wait for response)
        response = lambda_client.invoke(
            FunctionName=RESEARCHER_FUNCTION,
            InvocationType='Event',  # Async invocation
            Payload=json.dumps(payload)
        )

        invocation_id = response.get('RequestId', 'unknown')

        print(f"✅ UserResearcher invoked (RequestId: {invocation_id})")

        return {
            'invocation_id': invocation_id,
            'status_code': response.get('StatusCode')
        }

    except Exception as e:
        print(f"❌ Failed to invoke UserResearcher: {str(e)}")
        return {
            'invocation_id': None,
            'error': str(e)
        }

def extract_focus_area(feature_info):
    """Extract focus area from feature info."""

    title = feature_info.get('title', '').lower()
    description = feature_info.get('description', '').lower()
    full_text = f"{title} {description}"

    if 'auth' in full_text or 'login' in full_text or 'otp' in full_text:
        return 'authentication'
    elif 'family' in full_text:
        return 'family'
    elif 'tool' in full_text or 'check' in full_text:
        return 'tools'
    elif 'security' in full_text or 'scam' in full_text:
        return 'security'
    else:
        return 'general'

def store_trigger_info(feature_info, invoke_result):
    """Store trigger information in DynamoDB."""

    try:
        item_id = feature_info.get('pr_number') or feature_info.get('issue_number')
        source = 'pr' if 'pr_number' in feature_info else 'issue'

        table.put_item(
            Item={
                'pk': f'RESEARCH_TRIGGER#{source}#{item_id}',
                'sk': f'TIMESTAMP#{datetime.utcnow().isoformat()}',
                'feature_title': feature_info.get('title', ''),
                'invocation_id': invoke_result.get('invocation_id', ''),
                'github_url': feature_info.get('url', ''),
                'author': feature_info.get('author', ''),
                'focus_area': extract_focus_area(feature_info),
                'status': 'triggered',
                'ttl': int(datetime.utcnow().timestamp()) + 7776000  # 90 days
            }
        )

        print(f"✅ Stored trigger info for {source}#{item_id}")

    except Exception as e:
        print(f"⚠️  Could not store trigger info: {str(e)}")

def post_github_comment(pr_url, comment_text):
    """Post comment to GitHub PR with research findings (future enhancement)."""

    # This will be implemented when we have GitHub token
    # For now, we just log it
    print(f"📝 Would post to {pr_url}: {comment_text}")
