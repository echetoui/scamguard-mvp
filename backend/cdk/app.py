"""
ScamGuard MVP - CDK Application
Instantiates and configures all infrastructure stacks
"""
import os
from aws_cdk import App
from stacks.scamguard_stack import ScamGuardStack
from stacks.agents_stack import AgentsStack


def main():
    app = App()

    # Environment config
    env_config = {
        'region': 'us-east-1',
        'account': os.environ.get('CDK_DEFAULT_ACCOUNT')
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

    # Add dependency
    agents_stack.add_dependency(scamguard_stack)

    app.synth()


if __name__ == "__main__":
    main()
