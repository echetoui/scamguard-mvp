"""
ScamGuard MVP Orchestrator
Coordinates agent workflows via AWS Step Functions
"""
import json
import boto3
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

sfn = boto3.client('stepfunctions')
dynamodb = boto3.resource('dynamodb')

# Environment variables (set by CDK)
PROJECT_UNIT_WORKFLOW_ARN = None  # Will be injected by CDK
PRODUCT_UNIT_WORKFLOW_ARN = None  # Will be injected by CDK
AUDIT_TABLE_NAME = 'ScamGuardAudit-staging'


class AgentOrchestrator:
    """Manages Project Unit and Product Unit workflow execution"""

    @staticmethod
    def start_project_workflow(feature_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Start Project Unit workflow (PO → Architect → Developer → QA)

        Args:
            feature_spec: Feature specification {title, description, requirements}

        Returns:
            {workflow_id, status, estimated_duration}
        """
        try:
            workflow_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()

            input_payload = {
                'feature_spec': feature_spec,
                'workflow_id': workflow_id,
                'timestamp': timestamp
            }

            response = sfn.start_execution(
                stateMachineArn=PROJECT_UNIT_WORKFLOW_ARN,
                name=f"feature-{workflow_id}",
                input=json.dumps(input_payload)
            )

            # Log to audit table
            audit_table = dynamodb.Table(AUDIT_TABLE_NAME)
            audit_table.put_item(Item={
                'PK': f"WORKFLOW#{workflow_id}",
                'SK': f"PROJECT_UNIT#{timestamp}",
                'feature_spec': feature_spec,
                'execution_arn': response['executionArn'],
                'status': 'STARTED',
                'timestamp': timestamp
            })

            return {
                'workflow_id': workflow_id,
                'execution_arn': response['executionArn'],
                'status': 'RUNNING',
                'estimated_duration_minutes': 15,
                'timestamp': timestamp
            }

        except Exception as e:
            return {
                'error': str(e),
                'status': 'FAILED'
            }

    @staticmethod
    def start_product_workflow(scam_report: Dict[str, Any], user_id: str,
                              family_members: list = None) -> Dict[str, Any]:
        """
        Start Product Unit workflow (Triage → Analyst → Critic → Notifier)

        Args:
            scam_report: {scam_type, description, amount, platform, image_hash}
            user_id: USER#<id>
            family_members: List of family member IDs

        Returns:
            {workflow_id, status, threat_level}
        """
        try:
            workflow_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()

            input_payload = {
                'scam_report': scam_report,
                'user_id': user_id,
                'family_members': family_members or [],
                'workflow_id': workflow_id,
                'timestamp': timestamp
            }

            response = sfn.start_execution(
                stateMachineArn=PRODUCT_UNIT_WORKFLOW_ARN,
                name=f"threat-{workflow_id}",
                input=json.dumps(input_payload)
            )

            # Log to audit table
            audit_table = dynamodb.Table(AUDIT_TABLE_NAME)
            audit_table.put_item(Item={
                'PK': user_id,
                'SK': f"THREAT#{timestamp}",
                'scam_report': scam_report,
                'execution_arn': response['executionArn'],
                'status': 'STARTED',
                'timestamp': timestamp
            })

            return {
                'workflow_id': workflow_id,
                'execution_arn': response['executionArn'],
                'status': 'RUNNING',
                'estimated_duration_seconds': 30,
                'timestamp': timestamp
            }

        except Exception as e:
            return {
                'error': str(e),
                'status': 'FAILED'
            }

    @staticmethod
    def get_workflow_status(execution_arn: str) -> Dict[str, Any]:
        """Get status of a running or completed workflow"""
        try:
            response = sfn.describe_execution(executionArn=execution_arn)

            return {
                'status': response['status'],
                'start_date': response['startDate'].isoformat(),
                'stop_date': response.get('stopDate', '').isoformat() if response.get('stopDate') else None,
                'output': json.loads(response.get('output', '{}')) if response.get('output') else None,
                'error': response.get('cause')
            }

        except Exception as e:
            return {'error': str(e)}

    @staticmethod
    def list_executions(workflow_type: str = 'PROJECT') -> Dict[str, Any]:
        """List recent workflow executions"""
        try:
            # Would list executions from Step Functions
            # Filtered by status machine ARN

            return {
                'executions': [],
                'count': 0
            }

        except Exception as e:
            return {'error': str(e)}


# Lambda handler for API endpoint
def orchestrator_handler(event, context):
    """
    Entry point for orchestration API calls

    Events:
    - POST /orchestrate/project - Start project workflow
    - POST /orchestrate/product - Start product workflow
    - GET /orchestrate/{execution_id} - Get workflow status
    """
    try:
        http_method = event.get('requestContext', {}).get('http', {}).get('method')
        path = event.get('rawPath', '')

        if 'project' in path and http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            result = AgentOrchestrator.start_project_workflow(body.get('feature_spec', {}))
        elif 'product' in path and http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            result = AgentOrchestrator.start_product_workflow(
                body.get('scam_report', {}),
                body.get('user_id', ''),
                body.get('family_members', [])
            )
        elif 'orchestrate' in path and http_method == 'GET':
            execution_arn = event.get('pathParameters', {}).get('execution_id')
            result = AgentOrchestrator.get_workflow_status(execution_arn)
        else:
            result = {'error': 'Invalid request'}

        return {
            'statusCode': 200 if 'error' not in result else 400,
            'body': json.dumps(result)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


if __name__ == '__main__':
    # Test Project Unit
    test_feature = {
        'title': 'Phase 5B - Scam Reporting System',
        'description': 'Image-based scam detection'
    }
    print("Project Workflow:", json.dumps(
        AgentOrchestrator.start_project_workflow(test_feature),
        indent=2
    ))

    # Test Product Unit
    test_report = {
        'scam_type': 'PHISHING',
        'description': '[PHONE_REDACTED] claiming to be from bank',
        'amount': 5000,
        'platform': 'PHONE'
    }
    print("\nProduct Workflow:", json.dumps(
        AgentOrchestrator.start_product_workflow(test_report, 'USER#12345', ['FAMILY#67890']),
        indent=2
    ))
