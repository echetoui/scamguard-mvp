#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.scamguard_stack import ScamGuardStack
from stacks.agents_stack import AgentsStack

app = cdk.App()

env = cdk.Environment(
    account=app.node.try_get_context("account"),
    region=app.node.try_get_context("region") or "us-east-1"
)

# Main infrastructure stack
main_stack = ScamGuardStack(
    app,
    "ScamGuardStack",
    env=env,
    description="ScamGuard AI v5.0 - MVP Production-Ready"
)

# Agent orchestration stack (depends on main stack)
AgentsStack(
    app,
    "ScamGuardAgentsStack",
    data_table=main_stack.table if hasattr(main_stack, 'table') else None,
    env=env,
    description="ScamGuard Agent Orchestration - Step Functions + Lambda Agents"
)

app.synth()
