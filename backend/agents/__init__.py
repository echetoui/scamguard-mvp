"""
ScamGuard MVP Agent Framework

Unit 1: Project Unit (The Factory) - Development workflow
- @ProjectOwner: Feature validation & Quebec market compliance
- @Architect: Infrastructure design & DynamoDB schema
- @Developer: Code implementation
- @QA_Engineer: Testing & security validation

Unit 2: Product Unit (The Shield) - Runtime threat detection
- @Triage_Agent: Data cleaning & anonymization (Loi 25)
- @Threat_Analyst: Risk scoring & threat intelligence
- @Critic_Agent: False positive reduction & logic audit
- @Family_Notifier: Family alert management

Orchestration: AWS Step Functions
Communication: JSON payloads (DynamoDB-compatible)
Audit Trail: All workflow states logged to DynamoDB
"""

from .project_owner import handler as project_owner_handler
from .architect import handler as architect_handler
from .developer import handler as developer_handler
from .qa_engineer import handler as qa_engineer_handler
from .triage_agent import handler as triage_handler
from .threat_analyst import handler as threat_analyst_handler
from .critic_agent import handler as critic_handler
from .family_notifier import handler as family_notifier_handler

__all__ = [
    'project_owner_handler',
    'architect_handler',
    'developer_handler',
    'qa_engineer_handler',
    'triage_handler',
    'threat_analyst_handler',
    'critic_handler',
    'family_notifier_handler'
]

AGENT_REGISTRY = {
    'ProjectOwner': project_owner_handler,
    'Architect': architect_handler,
    'Developer': developer_handler,
    'QA_Engineer': qa_engineer_handler,
    'Triage_Agent': triage_handler,
    'Threat_Analyst': threat_analyst_handler,
    'Critic_Agent': critic_handler,
    'Family_Notifier': family_notifier_handler
}
