"""
ScamGuard MVP Agents Stack - AWS Step Functions + Agent Lambda Functions
Deploys Project Unit and Product Unit workflows
"""
from aws_cdk import (
    Stack, Duration, RemovalPolicy, CfnOutput,
    aws_lambda as lambda_, aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as sfn_tasks,
    aws_dynamodb as ddb, aws_iam as iam, aws_logs as logs
)
from constructs import Construct
import json


class AgentsStack(Stack):
    def __init__(self, scope: Construct, id: str, data_table: ddb.Table, **kwargs):
        super().__init__(scope, id, **kwargs)

        self.data_table = data_table

        # Create agent Lambda functions
        agents = self._create_agent_lambdas()

        # Create Step Functions workflows
        project_workflow = self._create_project_unit_workflow(agents)
        product_workflow = self._create_product_unit_workflow(agents)

        # Create orchestrator Lambda
        orchestrator = self._create_orchestrator_lambda(project_workflow, product_workflow)

        # Outputs
        CfnOutput(self, "ProjectUnitWorkflowArn", value=project_workflow.state_machine_arn)
        CfnOutput(self, "ProductUnitWorkflowArn", value=product_workflow.state_machine_arn)
        CfnOutput(self, "OrchestratorLambdaArn", value=orchestrator.function_arn)

    def _create_agent_lambdas(self) -> dict:
        """Create Lambda functions for all 8 agents"""
        agents = {}

        agent_configs = {
            'ProjectOwner': ('agents/project_owner.py', 'handler'),
            'Architect': ('agents/architect.py', 'handler'),
            'Developer': ('agents/developer.py', 'handler'),
            'QA_Engineer': ('agents/qa_engineer.py', 'handler'),
            'TriageAgent': ('agents/triage_agent.py', 'handler'),
            'ThreatAnalyst': ('agents/threat_analyst.py', 'handler'),
            'CriticAgent': ('agents/critic_agent.py', 'handler'),
            'FamilyNotifier': ('agents/family_notifier.py', 'handler'),
        }

        for agent_name, (handler_path, handler_func) in agent_configs.items():
            agents[agent_name] = lambda_.Function(
                self, f"{agent_name}Lambda",
                runtime=lambda_.Runtime.PYTHON_3_12,
                handler=handler_func,
                code=lambda_.Code.from_asset(".."),
                timeout=Duration.seconds(60),
                memory_size=256,
                environment={
                    'TABLE_NAME': self.data_table.table_name,
                    'LOG_LEVEL': 'INFO'
                },
                tracing=lambda_.Tracing.ACTIVE,
                log_retention=logs.RetentionDays.ONE_WEEK
            )

            # Grant DynamoDB access
            self.data_table.grant_read_write_data(agents[agent_name])

        return agents

    def _create_project_unit_workflow(self, agents: dict) -> sfn.StateMachine:
        """Create Project Unit workflow: PO → Architect → Developer → QA"""

        # PO Validation task
        po_task = sfn_tasks.LambdaInvoke(
            self, "ProjectOwnerValidation",
            lambda_function=agents['ProjectOwner'],
            output_path="$.Payload"
        )

        # Architect Design task
        architect_task = sfn_tasks.LambdaInvoke(
            self, "ArchitectureDesign",
            lambda_function=agents['Architect'],
            output_path="$.Payload"
        ).next(
            sfn_tasks.LambdaInvoke(
                self, "DeveloperImplementation",
                lambda_function=agents['Developer'],
                output_path="$.Payload"
            )
        )

        # QA Validation task
        qa_task = sfn_tasks.LambdaInvoke(
            self, "QAValidation",
            lambda_function=agents['QA_Engineer'],
            output_path="$.Payload"
        )

        # Build chain: PO → Architect → Developer → QA
        definition = po_task.next(architect_task).next(qa_task)

        return sfn.StateMachine(
            self, "ProjectUnitWorkflow",
            definition=definition,
            state_machine_name="scamguard-project-unit-workflow",
            timeout=Duration.minutes(30)
        )

    def _create_product_unit_workflow(self, agents: dict) -> sfn.StateMachine:
        """Create Product Unit workflow: Triage → Analyst → Critic → Notifier"""

        # Triage task
        triage_task = sfn_tasks.LambdaInvoke(
            self, "DataTriage",
            lambda_function=agents['TriageAgent'],
            output_path="$.Payload"
        )

        # Threat Analysis task
        analyst_task = sfn_tasks.LambdaInvoke(
            self, "ThreatAnalysis",
            lambda_function=agents['ThreatAnalyst'],
            output_path="$.Payload"
        )

        # Critic Review task
        critic_task = sfn_tasks.LambdaInvoke(
            self, "CriticReview",
            lambda_function=agents['CriticAgent'],
            output_path="$.Payload"
        )

        # Family Notification task
        notifier_task = sfn_tasks.LambdaInvoke(
            self, "NotifyFamily",
            lambda_function=agents['FamilyNotifier'],
            output_path="$.Payload"
        )

        # Build chain: Triage → Analyst → Critic → Notifier
        definition = triage_task.next(analyst_task).next(critic_task).next(notifier_task)

        return sfn.StateMachine(
            self, "ProductUnitWorkflow",
            definition=definition,
            state_machine_name="scamguard-product-unit-workflow",
            timeout=Duration.minutes(5)
        )

    def _create_orchestrator_lambda(self, project_workflow: sfn.StateMachine,
                                   product_workflow: sfn.StateMachine) -> lambda_.Function:
        """Create orchestrator Lambda that triggers Step Functions"""

        orchestrator = lambda_.Function(
            self, "OrchestratorLambda",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="orchestrator.orchestrator_handler",
            code=lambda_.Code.from_asset(".."),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                'PROJECT_UNIT_WORKFLOW_ARN': project_workflow.state_machine_arn,
                'PRODUCT_UNIT_WORKFLOW_ARN': product_workflow.state_machine_arn,
                'AUDIT_TABLE_NAME': self.data_table.table_name,
                'LOG_LEVEL': 'INFO'
            },
            tracing=lambda_.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Grant permissions to start executions
        orchestrator.add_to_role_policy(iam.PolicyStatement(
            actions=[
                'states:StartExecution',
                'states:DescribeExecution',
                'states:ListExecutions'
            ],
            resources=[
                project_workflow.state_machine_arn,
                product_workflow.state_machine_arn
            ]
        ))

        # Grant DynamoDB access
        self.data_table.grant_read_write_data(orchestrator)

        return orchestrator
