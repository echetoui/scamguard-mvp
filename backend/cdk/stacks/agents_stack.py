from aws_cdk import Stack, Duration, aws_lambda as lambda_, aws_stepfunctions as sfn, aws_stepfunctions_tasks as sfn_tasks, aws_dynamodb as ddb, aws_iam as iam, aws_logs as logs, aws_apigateway as apigw, CfnOutput
from constructs import Construct

class AgentsStack(Stack):
    def __init__(self, scope: Construct, id: str, data_table: ddb.Table, **kwargs):
        super().__init__(scope, id, **kwargs)

        self.data_table = data_table
        agents = self._create_agents()
        project_wf = self._create_project_workflow(agents)
        product_wf = self._create_product_workflow(agents)
        orchestrator = self._create_orchestrator(project_wf, product_wf)

        # GitHub automation - auto-trigger UserResearcher on feature PRs
        github_trigger = self._create_github_trigger(agents['UserResearcher'])
        webhook_api = self._create_webhook_api(github_trigger)

        CfnOutput(self, "ProjectWorkflowArn", value=project_wf.state_machine_arn)
        CfnOutput(self, "ProductWorkflowArn", value=product_wf.state_machine_arn)
        CfnOutput(self, "OrchestratorArn", value=orchestrator.function_arn)
        CfnOutput(self, "WebhookEndpoint", value=webhook_api.url + "webhook/github")
    
    def _create_agents(self):
        agents = {}
        # Original 8 agents + 3 new agents (UserResearcher, Engineer, Executive)
        agent_names = [
            'ProjectOwner', 'Architect', 'Developer', 'QA_Engineer',
            'TriageAgent', 'ThreatAnalyst', 'CriticAgent', 'FamilyNotifier',
            'UserResearcher', 'Engineer', 'Executive'  # New agents
        ]

        for name in agent_names:
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
        """
        Enhanced Project Unit Workflow:
        ProjectOwner → UserResearcher → Architect → Engineer → Developer → QA → Executive
        """
        po = sfn_tasks.LambdaInvoke(self, "POTask", lambda_function=agents['ProjectOwner'], output_path="$.Payload")
        researcher = sfn_tasks.LambdaInvoke(self, "ResearcherTask", lambda_function=agents['UserResearcher'], output_path="$.Payload")
        architect = sfn_tasks.LambdaInvoke(self, "ArchitectTask", lambda_function=agents['Architect'], output_path="$.Payload")
        engineer = sfn_tasks.LambdaInvoke(self, "EngineerTask", lambda_function=agents['Engineer'], output_path="$.Payload")
        dev = sfn_tasks.LambdaInvoke(self, "DevTask", lambda_function=agents['Developer'], output_path="$.Payload")
        qa = sfn_tasks.LambdaInvoke(self, "QATask", lambda_function=agents['QA_Engineer'], output_path="$.Payload")
        exec_agent = sfn_tasks.LambdaInvoke(self, "ExecTask", lambda_function=agents['Executive'], output_path="$.Payload")

        definition = po.next(researcher).next(architect).next(engineer).next(dev).next(qa).next(exec_agent)

        return sfn.StateMachine(
            self, "ProjectWorkflow",
            definition=definition,
            state_machine_name="project-unit-workflow",
            timeout=Duration.minutes(60)  # Increased timeout for more agents
        )
    
    def _create_product_workflow(self, agents):
        """
        Enhanced Product Unit Workflow:
        TriageAgent → UserResearcher → ThreatAnalyst → CriticAgent
        """
        triage = sfn_tasks.LambdaInvoke(self, "TriageTask", lambda_function=agents['TriageAgent'], output_path="$.Payload")
        researcher = sfn_tasks.LambdaInvoke(self, "ProdResearcherTask", lambda_function=agents['UserResearcher'], output_path="$.Payload")
        analyst = sfn_tasks.LambdaInvoke(self, "AnalystTask", lambda_function=agents['ThreatAnalyst'], output_path="$.Payload")
        critic = sfn_tasks.LambdaInvoke(self, "CriticTask", lambda_function=agents['CriticAgent'], output_path="$.Payload")

        definition = triage.next(researcher).next(analyst).next(critic)

        return sfn.StateMachine(
            self, "ProductWorkflow",
            definition=definition,
            state_machine_name="product-unit-workflow",
            timeout=Duration.minutes(15)  # Increased timeout
        )
    
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

    def _create_github_trigger(self, user_researcher_agent):
        """Create Lambda function to handle GitHub webhooks."""
        github_trigger = lambda_.Function(
            self, "GitHubTriggerLambda",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="github_trigger.handler",
            code=lambda_.Code.from_asset("../agents"),
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                'TABLE_NAME': self.data_table.table_name,
                'GITHUB_WEBHOOK_SECRET': 'changeme',  # Set via console
                'RESEARCHER_FUNCTION': user_researcher_agent.function_name
            },
            tracing=lambda_.Tracing.ACTIVE
        )

        # Grant permissions
        self.data_table.grant_read_write_data(github_trigger)
        user_researcher_agent.grant_invoke(github_trigger)

        return github_trigger

    def _create_webhook_api(self, github_trigger_lambda):
        """Create API Gateway for GitHub webhooks."""
        api = apigw.RestApi(
            self, "WebhookAPI",
            rest_api_name="scamguard-webhook-api",
            description="Webhooks for GitHub automation"
        )

        # Create webhook resource
        webhook_resource = api.root.add_resource("webhook")
        github_resource = webhook_resource.add_resource("github")

        # Add POST method
        github_resource.add_method(
            "POST",
            apigw.LambdaIntegration(github_trigger_lambda),
            api_key_required=False,  # GitHub doesn't need API key
            request_templates={
                "application/json": "$input.json('$')"
            }
        )

        return api
