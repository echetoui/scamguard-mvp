#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.scamguard_stack import ScamGuardStack

app = cdk.App()

ScamGuardStack(
    app, 
    "ScamGuardStack",
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region=app.node.try_get_context("region") or "us-east-1"
    ),
    description="ScamGuard AI v5.0 - MVP Production-Ready"
)

app.synth()
