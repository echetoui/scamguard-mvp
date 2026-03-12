"""
Engineer Agent
Specializes in technical feasibility assessment, architecture review, and implementation complexity analysis.
"""

import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('TABLE_NAME', 'ScamGuardData'))

def handler(event, context):
    """
    Review technical specs and provide feasibility assessment.

    Input:
    {
        "review_type": "feature_spec|architecture|prd|implementation",
        "component": "auth|family|tools|general",
        "spec": {...},
        "constraints": {...}
    }

    Output:
    {
        "feasible": true/false,
        "complexity": "low|medium|high",
        "effort_estimate": {...},
        "risks": [...],
        "challenges": [...],
        "recommendations": [...],
        "questions": [...]
    }
    """

    try:
        print(f"🔧 Engineer reviewing: {json.dumps(event)}")

        review_type = event.get('review_type', 'feature_spec')
        component = event.get('component', 'general')
        spec = event.get('spec', {})
        constraints = event.get('constraints', {})

        # Perform review
        if review_type == 'feature_spec':
            assessment = review_feature_spec(spec, component, constraints)
        elif review_type == 'architecture':
            assessment = review_architecture(spec, constraints)
        elif review_type == 'prd':
            assessment = review_prd(spec, component, constraints)
        elif review_type == 'implementation':
            assessment = review_implementation(spec, constraints)
        else:
            assessment = generic_review(spec, constraints)

        # Store assessment
        store_technical_assessment(component, assessment)

        return {
            'statusCode': 200,
            'body': {
                'status': 'review_complete',
                'component': component,
                'review_type': review_type,
                'assessment': assessment,
                'timestamp': datetime.utcnow().isoformat()
            }
        }

    except Exception as e:
        print(f"❌ Engineer error: {str(e)}")
        return {
            'statusCode': 500,
            'body': {
                'status': 'error',
                'error': str(e)
            }
        }

def review_feature_spec(spec, component, constraints):
    """Review a feature specification for technical feasibility."""

    assessment = {
        'feasible': True,
        'complexity': 'medium',
        'effort_estimate': {},
        'risks': [],
        'challenges': [],
        'recommendations': [],
        'questions': []
    }

    # Check completeness
    required_fields = ['description', 'acceptance_criteria', 'dependencies']
    missing = [f for f in required_fields if f not in spec]
    if missing:
        assessment['questions'].append(f"Missing spec fields: {', '.join(missing)}")

    # Assess complexity based on component
    if component == 'auth':
        assessment = assess_auth_complexity(spec, assessment, constraints)
    elif component == 'family':
        assessment = assess_family_complexity(spec, assessment, constraints)
    elif component == 'tools':
        assessment = assess_tools_complexity(spec, assessment, constraints)

    # Common technical risks
    if 'external_api' in str(spec).lower():
        assessment['risks'].append({
            'type': 'external_dependency',
            'severity': 'high',
            'description': 'Feature depends on external API - verify SLA and fallback strategy'
        })

    if 'real_time' in str(spec).lower() or 'websocket' in str(spec).lower():
        assessment['challenges'].append('Real-time requirements add complexity - WebSocket/polling strategy needed')
        assessment['complexity'] = 'high'

    if 'security' in str(spec).lower():
        assessment['risks'].append({
            'type': 'security',
            'severity': 'high',
            'description': 'Security-critical feature - requires threat modeling and code review'
        })

    # Estimate effort
    assessment['effort_estimate'] = {
        'design_days': 1 if assessment['complexity'] == 'low' else (2 if assessment['complexity'] == 'medium' else 3),
        'development_days': 2 if assessment['complexity'] == 'low' else (5 if assessment['complexity'] == 'medium' else 10),
        'testing_days': 1 if assessment['complexity'] == 'low' else (2 if assessment['complexity'] == 'medium' else 4),
        'total_days': 4 if assessment['complexity'] == 'low' else (9 if assessment['complexity'] == 'medium' else 17)
    }

    # Generate recommendations
    assessment['recommendations'] = generate_tech_recommendations(spec, component)

    return assessment

def assess_auth_complexity(spec, assessment, constraints):
    """Assess complexity of authentication features."""

    auth_type = spec.get('type', '').lower()

    if 'jwt' in auth_type or 'token' in auth_type:
        assessment['questions'].append('JWT implementation: using RS256 or HS256? How will key rotation be handled?')
        assessment['challenges'].append('Token signing must use production-grade cryptography')
        assessment['recommendations'].append('Use industry-standard JWT library, never implement crypto yourself')

    if 'sms' in auth_type or 'otp' in auth_type:
        assessment['risks'].append({
            'type': 'rate_limiting',
            'severity': 'high',
            'description': 'OTP endpoint must have strict rate limiting to prevent brute force'
        })
        assessment['challenges'].append('Rate limiting configuration: 5 attempts / 10 min sufficient?')
        assessment['questions'].append('How will you handle SMS delivery failures? Fallback mechanism?')
        assessment['recommendations'].append('Test OTP UX with target demographic (seniors)')

    if 'firebase' in auth_type:
        assessment['questions'].append('Firebase credentials rotation strategy?')
        assessment['challenges'].append('Firebase API dependency - verify error handling')

    assessment['complexity'] = 'high'  # Auth is always complex

    return assessment

def assess_family_complexity(spec, assessment, constraints):
    """Assess complexity of family features."""

    feature = spec.get('feature', '').lower()

    if 'dashboard' in feature:
        assessment['questions'].append('Dashboard refresh rate? Real-time or cached?')
        assessment['challenges'].append('Family dashboard needs to support multiple user roles')

    if 'notifications' in feature or 'notify' in feature:
        assessment['risks'].append({
            'type': 'notification_delivery',
            'severity': 'medium',
            'description': 'Ensure notification channels are reliable'
        })

    assessment['complexity'] = 'medium'

    return assessment

def assess_tools_complexity(spec, assessment, constraints):
    """Assess complexity of tools features."""

    tool_type = spec.get('type', '').lower()

    if 'llm' in tool_type or 'ai' in tool_type:
        assessment['risks'].append({
            'type': 'llm_hallucination',
            'severity': 'high',
            'description': 'LLM responses must be validated/sanitized before showing to users'
        })
        assessment['challenges'].append('LLM response variability - implement confidence scoring')
        assessment['recommendations'].append('Always sanitize LLM output for prompt injection')

    if 'external_verification' in tool_type:
        assessment['risks'].append({
            'type': 'external_api_dependency',
            'severity': 'high',
            'description': 'Verify external service SLA and implement timeout/retry logic'
        })

    assessment['complexity'] = 'high'

    return assessment

def review_architecture(spec, constraints):
    """Review system architecture design."""

    assessment = {
        'feasible': True,
        'complexity': 'high',
        'scalability': check_scalability(spec),
        'security': check_security_posture(spec),
        'performance': assess_performance(spec),
        'risks': [],
        'recommendations': [],
        'questions': []
    }

    # Check for single points of failure
    if 'database' in str(spec):
        assessment['questions'].append('Database failover strategy? Read replicas configured?')

    if 'cache' not in str(spec).lower():
        assessment['risks'].append({
            'type': 'performance',
            'severity': 'medium',
            'description': 'No caching strategy - consider Redis/DynamoDB caching'
        })

    assessment['recommendations'].append('Document architecture decisions with ADRs')

    return assessment

def review_prd(spec, component, constraints):
    """Review PRD for technical feasibility."""

    assessment = {
        'feasible': True,
        'complexity': 'medium',
        'gaps': [],
        'risks': [],
        'recommendations': [],
        'questions': []
    }

    # Check for technical ambiguities
    requirements = spec.get('requirements', [])
    for req in requirements:
        if 'real-time' in req.lower() and 'within' not in req.lower():
            assessment['questions'].append(f'Latency requirement for: "{req}"')

        if 'scale' in req.lower() or 'users' in req.lower():
            assessment['questions'].append(f'Clarify scale requirement: "{req}" - how many concurrent users?')

    # Flag non-functional requirements
    nfr = spec.get('non_functional_requirements', {})
    if not nfr.get('availability'):
        assessment['gaps'].append('Missing availability requirement (target 99.9%?)')

    if not nfr.get('latency'):
        assessment['gaps'].append('Missing latency requirement')

    assessment['recommendations'].append('Add acceptance criteria around performance metrics')
    assessment['recommendations'].append('Define "done" with specific metrics (latency, error rates)')

    return assessment

def review_implementation(spec, constraints):
    """Review implementation plan for risks."""

    assessment = {
        'feasible': True,
        'complexity': 'medium',
        'risks': [],
        'challenges': [],
        'recommendations': [],
        'testing_strategy': {},
        'rollout_plan': {}
    }

    # Check for testing gaps
    testing = spec.get('testing', {})
    if not testing.get('unit_tests'):
        assessment['challenges'].append('No unit tests planned - recommend 80%+ coverage')

    if not testing.get('integration_tests'):
        assessment['risks'].append({
            'type': 'integration',
            'severity': 'high',
            'description': 'Missing integration testing - components may not work together'
        })

    if not testing.get('load_tests'):
        assessment['challenges'].append('No load testing planned - verify performance under load')

    # Check rollout strategy
    rollout = spec.get('rollout', {})
    if not rollout.get('gradual_rollout'):
        assessment['risks'].append({
            'type': 'rollout',
            'severity': 'medium',
            'description': 'Consider gradual rollout (canary/blue-green) instead of big bang'
        })

    assessment['testing_strategy'] = {
        'unit_test_coverage': '80%+',
        'integration_tests': 'required',
        'load_tests': 'recommended',
        'user_acceptance_tests': 'required'
    }

    assessment['rollout_plan'] = {
        'strategy': 'canary',
        'initial_percentage': 10,
        'increase_per_day': 25,
        'rollback_criteria': 'error_rate > 0.1% or latency > 500ms'
    }

    return assessment

def generic_review(spec, constraints):
    """Generic technical review."""

    return {
        'feasible': True,
        'complexity': 'medium',
        'risks': extract_technical_risks(spec),
        'challenges': identify_technical_challenges(spec),
        'recommendations': generate_tech_recommendations(spec, 'general'),
        'questions': generate_clarification_questions(spec)
    }

def check_scalability(spec):
    """Check scalability considerations."""

    return {
        'horizontal_scaling': 'yes' if 'stateless' in str(spec).lower() else 'needs_review',
        'database_scaling': 'yes' if 'partitioned' in str(spec).lower() or 'sharded' in str(spec).lower() else 'needs_review',
        'load_balancing': 'yes' if 'lb' in str(spec).lower() else 'needs_review',
        'recommendation': 'Design services to be stateless and horizontally scalable'
    }

def check_security_posture(spec):
    """Check security design."""

    security_checks = {
        'authentication': 'yes' if 'auth' in str(spec).lower() else 'missing',
        'authorization': 'yes' if 'role' in str(spec).lower() or 'permission' in str(spec).lower() else 'missing',
        'encryption_in_transit': 'yes' if 'tls' in str(spec).lower() or 'https' in str(spec).lower() else 'assume_yes',
        'encryption_at_rest': 'yes' if 'encrypt' in str(spec).lower() else 'needs_review',
        'secret_management': 'yes' if 'vault' in str(spec).lower() or 'env' in str(spec).lower() else 'needs_review'
    }

    return security_checks

def assess_performance(spec):
    """Assess performance expectations."""

    return {
        'target_latency_ms': 200,
        'acceptable_latency_ms': 500,
        'error_rate_threshold': '0.1%',
        'recommendation': 'Establish baseline metrics and monitor continuously'
    }

def extract_technical_risks(spec):
    """Extract risks from specification."""

    risks = []

    if 'external' in str(spec).lower():
        risks.append({'type': 'external_dependency', 'severity': 'high'})

    if 'migration' in str(spec).lower():
        risks.append({'type': 'data_migration', 'severity': 'high'})

    return risks

def identify_technical_challenges(spec):
    """Identify technical challenges."""

    challenges = []

    if 'performance' in str(spec).lower():
        challenges.append('Performance optimization will require monitoring and tuning')

    if 'scale' in str(spec).lower():
        challenges.append('Scalability testing needed to verify capacity')

    return challenges

def generate_tech_recommendations(spec, component):
    """Generate technical recommendations."""

    recs = [
        'Use established libraries/frameworks, avoid custom implementations',
        'Implement comprehensive logging and monitoring from day one',
        'Plan for rollback strategy before deployment',
        'Document technical decisions (ADRs)',
        'Code review by 2+ engineers before merge'
    ]

    if component == 'auth':
        recs.extend([
            'Never store passwords/tokens in logs',
            'Use proven crypto libraries only',
            'Implement rate limiting on auth endpoints'
        ])

    if component == 'tools':
        recs.append('Sanitize all external inputs (especially LLM outputs)')

    return recs

def generate_clarification_questions(spec):
    """Generate clarification questions."""

    return [
        'What are the latency/throughput requirements?',
        'How will you monitor this in production?',
        'What is the rollback plan?',
        'Have you considered failure modes?',
        'What are your testing/staging environments?'
    ]

def store_technical_assessment(component, assessment):
    """Store technical assessment in DynamoDB."""

    try:
        table.put_item(
            Item={
                'pk': f'TECH_REVIEW#{component}',
                'sk': f'ASSESSMENT#{datetime.utcnow().isoformat()}',
                'feasible': str(assessment.get('feasible', True)),
                'complexity': assessment.get('complexity', 'unknown'),
                'risks': json.dumps(assessment.get('risks', [])),
                'effort_estimate': json.dumps(assessment.get('effort_estimate', {})),
                'ttl': int(datetime.utcnow().timestamp()) + 7776000  # 90 days
            }
        )
        print(f"✅ Stored technical assessment for {component}")
    except Exception as e:
        print(f"⚠️  Could not store technical assessment: {str(e)}")
