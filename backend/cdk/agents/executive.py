"""
Executive Agent
Specializes in strategic framing, executive communication, and stakeholder alignment.
"""

import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('TABLE_NAME', 'ScamGuardData'))

def handler(event, context):
    """
    Frame technical work for executive stakeholders.

    Input:
    {
        "communication_type": "update|proposal|business_case|risk_brief",
        "work": {...},
        "audience": "investors|board|leadership|stakeholders",
        "context": {...}
    }

    Output:
    {
        "executive_summary": "...",
        "business_impact": {...},
        "strategic_alignment": {...},
        "risks_and_mitigation": [...],
        "resource_requirements": {...},
        "decision_needed": "...",
        "next_steps": [...]
    }
    """

    try:
        print(f"👔 Executive framing: {json.dumps(event)}")

        comm_type = event.get('communication_type', 'update')
        work = event.get('work', {})
        audience = event.get('audience', 'leadership')
        context = event.get('context', {})

        # Generate communication based on type
        if comm_type == 'update':
            communication = create_executive_update(work, audience, context)
        elif comm_type == 'proposal':
            communication = create_proposal(work, audience, context)
        elif comm_type == 'business_case':
            communication = create_business_case(work, audience, context)
        elif comm_type == 'risk_brief':
            communication = create_risk_brief(work, audience, context)
        else:
            communication = create_generic_communication(work, audience, context)

        # Store communication for records
        store_executive_communication(audience, communication)

        return {
            'statusCode': 200,
            'body': {
                'status': 'communication_ready',
                'audience': audience,
                'communication': communication,
                'timestamp': datetime.utcnow().isoformat()
            }
        }

    except Exception as e:
        print(f"❌ Executive error: {str(e)}")
        return {
            'statusCode': 500,
            'body': {
                'status': 'error',
                'error': str(e)
            }
        }

def create_executive_update(work, audience, context):
    """Create executive summary of technical work."""

    return {
        'type': 'status_update',
        'executive_summary': generate_summary(work),
        'business_impact': {
            'user_value': extract_user_value(work),
            'metrics': extract_metrics(work),
            'timeline': work.get('timeline', 'unknown')
        },
        'strategic_alignment': {
            ' okrs_addressed': identify_okrs(work, context),
            'company_priorities': align_to_priorities(work, context),
            'competitive_advantage': extract_competitive_value(work)
        },
        'blockers_and_risks': identify_risks(work),
        'decision_required': determine_decision_needed(work),
        'next_update': 'In 1 week'
    }

def create_proposal(work, audience, context):
    """Create proposal for executive approval."""

    return {
        'type': 'proposal',
        'executive_summary': f"Proposal: {work.get('title', 'New Initiative')}",
        'problem_statement': work.get('problem', 'Undefined'),
        'proposed_solution': work.get('solution', ''),
        'business_impact': {
            'revenue_impact': estimate_revenue_impact(work),
            'cost_impact': estimate_cost_impact(work),
            'user_impact': extract_user_value(work),
            'timeline': work.get('timeline', 'TBD'),
            'roi': calculate_roi(work)
        },
        'strategic_alignment': {
            'okrs': identify_okrs(work, context),
            'strategic_fit': align_to_strategy(work, context),
            'risk_to_strategy': assess_strategic_risk(work)
        },
        'implementation_approach': {
            'phases': extract_phases(work),
            'resource_requirements': estimate_resources(work),
            'dependencies': extract_dependencies(work),
            'timeline': work.get('timeline', '8-12 weeks')
        },
        'risks_and_mitigation': {
            'top_risks': identify_top_risks(work),
            'mitigation_strategies': generate_mitigations(work),
            'contingency_plans': generate_contingencies(work)
        },
        'resource_requirements': {
            'engineering_headcount': extract_eng_headcount(work),
            'budget': estimate_budget(work),
            'infrastructure': estimate_infra_cost(work)
        },
        'decision_needed': f"Approve proposal for {work.get('title', 'initiative')}",
        'decision_deadline': 'End of week',
        'next_steps': [
            'Executive review and alignment',
            'Approve resource allocation',
            'Schedule kickoff with teams'
        ]
    }

def create_business_case(work, audience, context):
    """Create business case for investment decision."""

    estimated_cost = estimate_budget(work)
    estimated_benefit = estimate_revenue_impact(work)
    payback_period = calculate_payback_period(estimated_cost, estimated_benefit)

    return {
        'type': 'business_case',
        'initiative': work.get('title', 'Unnamed Initiative'),
        'executive_summary': f"Business case for {work.get('title')}: {payback_period} payback period",
        'financial_analysis': {
            'estimated_investment': estimated_cost,
            'estimated_annual_benefit': estimated_benefit,
            'roi_percent': (estimated_benefit / estimated_cost * 100) if estimated_cost > 0 else 0,
            'payback_period_months': payback_period,
            'npv_3_years': calculate_npv(estimated_cost, estimated_benefit, 3)
        },
        'business_impact': {
            'revenue_increase': estimated_benefit,
            'cost_reduction': estimate_cost_savings(work),
            'user_acquisition': extract_user_growth(work),
            'retention_improvement': extract_retention_impact(work)
        },
        'strategic_fit': {
            'aligns_with_ okrs': identify_okrs(work, context),
            'competitive_positioning': extract_competitive_value(work),
            'market_opportunity': estimate_market_size(work)
        },
        'risks': {
            'execution_risk': assess_execution_risk(work),
            'market_risk': assess_market_risk(work),
            'technical_risk': assess_technical_risk(work),
            'mitigation': generate_mitigations(work)
        },
        'recommendation': f"APPROVE: {work.get('title')} ROI justifies investment",
        'approval_authority': 'CFO + Chief Product Officer'
    }

def create_risk_brief(work, audience, context):
    """Create risk assessment for leadership."""

    return {
        'type': 'risk_brief',
        'initiative': work.get('title', 'Initiative'),
        'executive_summary': 'Risk assessment: Key risks identified, mitigation plans in place',
        'key_risks': {
            'execution_risks': identify_execution_risks(work),
            'technical_risks': identify_technical_risks(work),
            'market_risks': identify_market_risks(work),
            'organizational_risks': identify_org_risks(work),
            'compliance_risks': identify_compliance_risks(work)
        },
        'risk_assessment': {
            'overall_risk_level': assess_overall_risk(work),
            'critical_path_risks': identify_critical_path_risks(work),
            'dependencies_at_risk': extract_at_risk_dependencies(work)
        },
        'mitigation_strategies': {
            'for_each_risk': generate_mitigations(work),
            'contingency_plans': generate_contingencies(work),
            'escalation_criteria': define_escalation_criteria(work)
        },
        'monitoring_and_controls': {
            'kpis_to_monitor': identify_risk_kpis(work),
            'escalation_triggers': define_triggers(work),
            'review_cadence': 'Weekly'
        },
        'recommendation': 'Proceed with mitigation plans in place',
        'escalation_contacts': ['VP Engineering', 'Chief Product Officer'],
        'next_review': 'Weekly risk review meetings'
    }

def create_generic_communication(work, audience, context):
    """Create generic executive communication."""

    return {
        'executive_summary': generate_summary(work),
        'business_context': align_to_strategy(work, context),
        'impact': extract_user_value(work),
        'risks': identify_risks(work),
        'next_steps': extract_next_steps(work)
    }

# Helper functions

def generate_summary(work):
    """Generate concise executive summary (3 bullets max)."""

    return f"• {work.get('title', 'Work Item')}: {work.get('description', '')[:100]}..." if 'description' in work else f"• Completing: {work.get('title', 'Work Item')}"

def extract_user_value(work):
    """Extract user value proposition."""

    return work.get('user_value', 'Improves user experience and/or reduces user friction')

def extract_metrics(work):
    """Extract key metrics."""

    return {
        'user_impact': work.get('user_impact', 'Positive'),
        'engagement_change': work.get('engagement_impact', 'Unknown'),
        'retention_impact': work.get('retention_impact', 'Positive')
    }

def identify_okrs(work, context):
    """Identify which OKRs this work addresses."""

    okrs = []

    if 'security' in str(work).lower():
        okrs.append('OKR: Improve user trust through enhanced security')

    if 'growth' in str(work).lower() or 'acquisition' in str(work).lower():
        okrs.append('OKR: Increase user acquisition by 25%')

    if 'retention' in str(work).lower():
        okrs.append('OKR: Improve user retention by 15%')

    if 'family' in str(work).lower():
        okrs.append('OKR: Expand family protection feature adoption')

    if not okrs:
        okrs.append('OKR: Improve product quality and user experience')

    return okrs

def align_to_priorities(work, context):
    """Align work to company priorities."""

    priorities = context.get('company_priorities', [])

    if 'security' in str(work).lower():
        return ['Security & Trust (Priority 1)', 'User Privacy (Priority 2)']

    if 'growth' in str(work).lower():
        return ['User Acquisition (Priority 1)', 'Product-Market Fit (Priority 2)']

    return ['Product Excellence (Priority 3)']

def align_to_strategy(work, context):
    """Align work to company strategy."""

    strategy = "Mission: Protect seniors and families from scams through AI-powered detection."

    return f"{strategy} This work contributes by {work.get('strategic_contribution', 'improving product quality')}"

def extract_competitive_value(work):
    """Extract competitive advantage."""

    return work.get('competitive_advantage', 'Improves product differentiation') if 'competitive_advantage' in work else 'Strengthens product positioning'

def identify_risks(work):
    """Identify risks to progress."""

    risks = []

    if 'external_dependency' in str(work).lower():
        risks.append('External API dependency - SLA risk')

    if 'migration' in str(work).lower():
        risks.append('Data migration complexity')

    if 'new_technology' in str(work).lower():
        risks.append('New technology risk - team ramp-up time')

    return risks if risks else ['Standard execution risk']

def determine_decision_needed(work):
    """Determine what decision is needed."""

    return work.get('decision_needed', f"Approve continuation of {work.get('title', 'current work')}")

def estimate_revenue_impact(work):
    """Estimate revenue impact."""

    return work.get('revenue_impact', '$0') if 'revenue_impact' in work else 'TBD'

def estimate_cost_impact(work):
    """Estimate cost impact."""

    return work.get('cost_impact', 'Cost neutral') if 'cost_impact' in work else '$50K - $150K'

def estimate_cost_savings(work):
    """Estimate cost savings."""

    return work.get('cost_savings', '$0') if 'cost_savings' in work else 'TBD'

def extract_user_growth(work):
    """Extract user growth impact."""

    return work.get('user_growth', '5-10% increase') if 'user_growth' in work else 'Unknown'

def extract_retention_impact(work):
    """Extract retention improvement."""

    return work.get('retention_impact', '3-5% improvement') if 'retention_impact' in work else 'Unknown'

def extract_phases(work):
    """Extract implementation phases."""

    return work.get('phases', ['Phase 1: Planning', 'Phase 2: Development', 'Phase 3: Testing', 'Phase 4: Launch'])

def estimate_resources(work):
    """Estimate resource requirements."""

    return {
        'engineering': work.get('engineering_headcount', '2-3'),
        'product': work.get('product_headcount', '1'),
        'design': work.get('design_headcount', '0.5'),
        'budget': estimate_budget(work)
    }

def extract_dependencies(work):
    """Extract external dependencies."""

    deps = work.get('dependencies', [])

    return deps if deps else ['Firebase API', 'DynamoDB availability']

def identify_top_risks(work):
    """Identify top 3 risks."""

    return [
        {'risk': 'Execution risk', 'probability': 'Medium', 'impact': 'High', 'mitigation': 'Clear project plan and weekly reviews'},
        {'risk': 'Resource availability', 'probability': 'Low', 'impact': 'High', 'mitigation': 'Early resource allocation'},
        {'risk': 'Technical complexity', 'probability': 'Medium', 'impact': 'Medium', 'mitigation': 'Early architectural review'}
    ]

def generate_mitigations(work):
    """Generate risk mitigations."""

    return [
        'Weekly progress tracking and risk reviews',
        'Clear acceptance criteria before development',
        'Regular stakeholder communication',
        'Contingency time buffer (20%)'
    ]

def generate_contingencies(work):
    """Generate contingency plans."""

    return [
        'Plan B if external dependency fails',
        'Reduced scope option to meet deadline',
        'Phased rollout strategy'
    ]

def extract_eng_headcount(work):
    """Extract engineering headcount needed."""

    return work.get('engineering_headcount', '2-3')

def estimate_budget(work):
    """Estimate total budget needed."""

    if 'budget' in work:
        return work['budget']

    complexity = work.get('complexity', 'medium')
    base_cost = 25000  # Base cost per engineering month

    if complexity == 'low':
        return f"${base_cost * 1.5 + 10000:,.0f}"
    elif complexity == 'high':
        return f"${base_cost * 3.5 + 30000:,.0f}"
    else:
        return f"${base_cost * 2 + 20000:,.0f}"

def estimate_infra_cost(work):
    """Estimate infrastructure cost."""

    return work.get('infra_cost', '$5K - $15K per month') if 'infra_cost' in work else '$5K - $15K per month'

def calculate_roi(work):
    """Calculate ROI."""

    benefit = estimate_revenue_impact(work)
    cost = estimate_budget(work)

    return f"ROI: {benefit} / {cost}" if benefit != '$0' and benefit != 'TBD' else 'Strategic ROI (non-financial)'

def calculate_payback_period(cost, benefit):
    """Calculate payback period in months."""

    try:
        cost_num = float(str(cost).replace('$', '').replace(',', ''))
        benefit_num = float(str(benefit).replace('$', '').replace(',', ''))

        if benefit_num > 0:
            return int(cost_num / (benefit_num / 12))
        else:
            return 'Unknown'
    except:
        return 'TBD'

def calculate_npv(cost, benefit, years):
    """Calculate Net Present Value."""

    try:
        discount_rate = 0.1
        cost_num = float(str(cost).replace('$', '').replace(',', ''))
        benefit_num = float(str(benefit).replace('$', '').replace(',', ''))

        npv = -cost_num
        for year in range(1, years + 1):
            npv += benefit_num / ((1 + discount_rate) ** year)

        return f"${npv:,.0f}"
    except:
        return 'TBD'

def estimate_market_size(work):
    """Estimate addressable market."""

    return work.get('market_size', '$500M TAM for senior safety') if 'market_size' in work else 'Large market opportunity'

def assess_execution_risk(work):
    """Assess execution risk."""

    return work.get('execution_risk', 'Medium') if 'execution_risk' in work else 'Medium'

def assess_market_risk(work):
    """Assess market risk."""

    return work.get('market_risk', 'Low') if 'market_risk' in work else 'Low'

def assess_technical_risk(work):
    """Assess technical risk."""

    return work.get('technical_risk', 'Medium') if 'technical_risk' in work else 'Medium'

def assess_strategic_risk(work):
    """Assess strategic risk."""

    return 'Low' if 'jtbd' in str(work).lower() else 'Medium'

def identify_execution_risks(work):
    """Identify execution risks."""

    return ['Resource availability', 'Timeline pressure', 'Scope creep']

def identify_technical_risks(work):
    """Identify technical risks."""

    return ['External API dependency', 'Scalability concerns', 'Integration complexity']

def identify_market_risks(work):
    """Identify market risks."""

    return ['User adoption uncertainty', 'Competitive response']

def identify_org_risks(work):
    """Identify organizational risks."""

    return ['Cross-team alignment', 'Stakeholder communication']

def identify_compliance_risks(work):
    """Identify compliance risks."""

    if 'auth' in str(work).lower():
        return ['Data privacy (PIPEDA)', 'Security standards (SOC2)']

    return ['Data handling compliance']

def assess_overall_risk(work):
    """Assess overall risk level."""

    return work.get('risk_level', 'Medium') if 'risk_level' in work else 'Medium'

def identify_critical_path_risks(work):
    """Identify critical path risks."""

    return ['External API availability', 'Team resource constraints']

def extract_at_risk_dependencies(work):
    """Extract dependencies at risk."""

    return work.get('at_risk_deps', ['Firebase', 'DynamoDB']) if 'at_risk_deps' in work else []

def define_escalation_criteria(work):
    """Define escalation criteria."""

    return {
        'timeline_slip_days': 5,
        'budget_overrun_percent': 20,
        'quality_issues': 'Any critical bugs'
    }

def identify_risk_kpis(work):
    """Identify KPIs to monitor."""

    return ['Velocity vs plan', 'Defect rate', 'Technical debt', 'User satisfaction']

def define_triggers(work):
    """Define escalation triggers."""

    return ['Velocity drops below plan', 'Defect rate > 5%', 'Schedule slip > 1 week']

def extract_next_steps(work):
    """Extract next steps."""

    return work.get('next_steps', ['Kickoff meeting', 'Detailed planning', 'Start development']) if 'next_steps' in work else []

def store_executive_communication(audience, communication):
    """Store communication for audit trail."""

    try:
        table.put_item(
            Item={
                'pk': f'EXEC_COMM#{audience}',
                'sk': f'COMMUNICATION#{datetime.utcnow().isoformat()}',
                'summary': communication.get('executive_summary', ''),
                'type': communication.get('type', 'unknown'),
                'ttl': int(datetime.utcnow().timestamp()) + 15552000  # 180 days
            }
        )
        print(f"✅ Stored executive communication for {audience}")
    except Exception as e:
        print(f"⚠️  Could not store communication: {str(e)}")
