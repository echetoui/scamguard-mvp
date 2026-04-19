"""
ScamGuard MVP - CDK Application
Instantiates and configures all infrastructure stacks
"""
import os
from aws_cdk import App
from stacks.scamguard_stack import ScamGuardStack
from stacks.agents_stack import AgentsStack

# Phase 2 (Week 2): Aurora Serverless v2 stack
# Import from top-level aurora_stack.py (not stacks/aurora_stack.py which is the old v1 file)
import sys
sys.path.insert(0, os.path.dirname(__file__))
from aurora_stack import AuroraStack


def main():
    app = App()

    # Environment config — use CDK_DEFAULT_ACCOUNT if set, else resolve from STS at synth time
    env_config = {
        'region': os.environ.get('CDK_DEFAULT_REGION', 'us-east-1'),
        'account': os.environ.get('CDK_DEFAULT_ACCOUNT'),
    }

    # Main infrastructure stack
    scamguard_stack = ScamGuardStack(
        app,
        "ScamGuardStack",
        env=env_config,
        description="ScamGuard MVP - Main Infrastructure Stack"
    )

    # Agent orchestration stack
    agents_stack = AgentsStack(
        app,
        "AgentsStack",
        data_table=scamguard_stack.data_table,
        env=env_config,
        description="ScamGuard Agent Orchestration - Step Functions + Lambda Agents"
    )

    # Phase 2: Aurora Serverless v2 — DEV ONLY
    # Deploy: cdk deploy AuroraStack --profile scamguard-dev
    # Outputs: ClusterEndpoint, SecretArn, VpcId (used by Lambda stack in Phase 3)
    aurora_stack = AuroraStack(  # noqa: F841
        app,
        "AuroraStack",
        env=env_config,
        description="ScamGuard MVP - Aurora Serverless v2 (Phase 2, DEV ONLY)"
    )

    # Add dependencies
    agents_stack.add_dependency(scamguard_stack)

    app.synth()


if __name__ == "__main__":
    main()
