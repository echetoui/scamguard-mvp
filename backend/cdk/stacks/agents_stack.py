from aws_cdk import Stack, Duration, aws_lambda as lambda_, aws_stepfunctions as sfn, aws_stepfunctions_tasks as sfn_tasks, aws_dynamodb as ddb, aws_iam as iam, aws_logs as logs, CfnOutput
from constructs import Construct

class AgentsStack(Stack):
    def __init__(self, scope: Construct, id: str, data_table: ddb.Table, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        self.data_table = data_table
        agents = self._create_agents()
        project_wf = self._create_project_workflow(agents)
        product_wf = self._create_product_workflow(agents)
        orchestrator = self._create_orchestrator(project_wf, product_wf)
        
        CfnOutput(self, "ProjectWorkflowArn", value=project_wf.state_machine_arn)
        CfnOutput(self, "ProductWorkflowArn", value=product_wf.state_machine_arn)
        CfnOutput(self, "OrchestratorArn", value=orchestrator.function_arn)
    
    def _create_agents(self):
        agents = {}
        for name in ['ProjectOwner', 'Architect', 'Developer', 'QA_Engineer', 'TriageAgent', 'ThreatAnalyst', 'CriticAgent', 'FamilyNotifier']:
            agents[name] = lambda_.Function(
                self, f"{name}Lambda",
                runtime=lambda_.Runtime.PYTHON_3_12,
                handler="handler",
                code=lambda_.Code.from_asset("../agents"),
                timeout=Duration.seconds(60),
                memory_size=256,
                environment={'TABLE_NAME': self.data_table.table_name},
                tracing=lambda_.Tracing.ACTIVE
            )
            self.data_table.grant_read_write_data(agents[name])
        return agents
    
    def _create_project_workflow(self, agents):
        po = sfn_tasks.LambdaInvoke(self, "POTask", lambda_function=agents['ProjectOwner'], output_path="$.Payload")
        qa = sfn_tasks.LambdaInvoke(self, "QATask", lambda_function=agents['QA_Engineer'], output_path="$.Payload")
        definition = po.next(qa)
        return sfn.StateMachine(self, "ProjectWorkflow", definition=definition, state_machine_name="project-unit-workflow", timeout=Duration.minutes(30))
    
    def _create_product_workflow(self, agents):
        triage = sfn_tasks.LambdaInvoke(self, "TriageTask", lambda_function=agents['TriageAgent'], output_path="$.Payload")
        analyst = sfn_tasks.LambdaInvoke(self, "AnalystTask", lambda_function=agents['ThreatAnalyst'], output_path="$.Payload")
        definition = triage.next(analyst)
        return sfn.StateMachine(self, "ProductWorkflow", definition=definition, state_machine_name="product-unit-workflow", timeout=Duration.minutes(5))
    
    def _create_orchestrator(self, project_wf, product_wf):
        orchestrator = lambda_.Function(
            self, "OrchestratorFunction",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="orchestrator.orchestrator_handler",
            code=lambda_.Code.from_asset("../lambda_/orchestrator"),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                'PROJECT_UNIT_WORKFLOW_ARN': project_wf.state_machine_arn,
                'PRODUCT_UNIT_WORKFLOW_ARN': product_wf.state_machine_arn,
                'AUDIT_TABLE_NAME': self.data_table.table_name
            },
            tracing=lambda_.Tracing.ACTIVE
        )
        
        orchestrator.add_to_role_policy(iam.PolicyStatement(
            actions=['states:StartExecution', 'states:DescribeExecution', 'states:ListExecutions'],
            resources=[project_wf.state_machine_arn, product_wf.state_machine_arn]
        ))
        
        self.data_table.grant_read_write_data(orchestrator)
        return orchestrator
