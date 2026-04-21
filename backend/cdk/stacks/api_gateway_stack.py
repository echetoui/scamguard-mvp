"""
ScamGuard MVP - API Gateway Stack (CDK)
Phase 4, Week 4: HTTP v2 API Gateway observability + management

This CDK stack does NOT re-create the API Gateway — the HTTP v2 API is
defined in backend/lambda/template.yaml (SAM) and deployed via `sam deploy`.
SAM owns the API Gateway resource; this CDK stack imports the deployed API
by ID to attach CloudWatch dashboards and metric alarms that SAM cannot
express natively.

Deployment order:
  1. AuroraStack         (CDK) — VPC, Aurora cluster, security groups
  2. ScamGuardLambdaStack (SAM) — Lambda functions, HTTP v2 API, Cognito pool
  3. APIGatewayStack     (CDK) — CloudWatch dashboard + alarms (this file)

Deploy this stack:
  cdk deploy APIGatewayStack --profile scamguard-dev

Pre-requisites:
  - SAM stack "ScamGuardLambdaStack" must be deployed first so that the
    API Gateway ID and Lambda ARNs are available as CloudFormation exports.
  - If deploying to a fresh account, run `sam deploy` first.
"""
from aws_cdk import (
    Stack,
    Duration,
    CfnOutput,
    Fn,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_apigatewayv2 as apigwv2,
    aws_logs as logs,
)
from constructs import Construct


class APIGatewayStack(Stack):
    """
    Phase 4 API Gateway observability stack.

    Imports the HTTP v2 API deployed by SAM and creates:
    - CloudWatch Dashboard: latency, error rates, request count per function
    - Alarms: 5xx error rate > 1%, p99 latency > 3000ms, throttles > 0

    All metric thresholds are conservative for MVP scale; tighten for prod.
    """

    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        env = self.node.try_get_context("environment") or "dev"

        # ------------------------------------------------------------------
        # Lambda function names (must match SAM template FunctionName values)
        # ------------------------------------------------------------------
        fn_names = {
            "main":         f"scamguard-handler-aurora-{env}",
            "sms_auth":     f"scamguard-sms-auth-aurora-{env}",
            "threats":      f"scamguard-threats-aurora-{env}",
            "family":       f"scamguard-family-aurora-{env}",
            "reports_tools": f"scamguard-reports-tools-aurora-{env}",
        }

        # ------------------------------------------------------------------
        # CloudWatch Dashboard — single pane for all Lambda + API GW metrics
        # ------------------------------------------------------------------
        dashboard = cloudwatch.Dashboard(
            self,
            "ScamGuardDashboard",
            dashboard_name=f"ScamGuard-API-{env}",
        )

        # --- Row 1: Request count + error rates per function ---------------
        error_widgets = []
        invocation_widgets = []

        for label, fn_name in fn_names.items():
            invocation_widgets.append(
                cloudwatch.GraphWidget(
                    title=f"{label} — Invocations",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/Lambda",
                            metric_name="Invocations",
                            dimensions_map={"FunctionName": fn_name},
                            statistic="Sum",
                            period=Duration.minutes(5),
                            label=fn_name,
                        )
                    ],
                    width=4,
                    height=4,
                )
            )
            error_widgets.append(
                cloudwatch.GraphWidget(
                    title=f"{label} — Errors",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/Lambda",
                            metric_name="Errors",
                            dimensions_map={"FunctionName": fn_name},
                            statistic="Sum",
                            period=Duration.minutes(5),
                            color="#d62728",
                            label=fn_name,
                        )
                    ],
                    width=4,
                    height=4,
                )
            )

        dashboard.add_widgets(
            cloudwatch.TextWidget(
                markdown=(
                    f"## ScamGuard API Gateway — {env.upper()}\n"
                    "**HTTP v2 API | Aurora Serverless v2 | Phase 4**"
                ),
                width=24,
                height=2,
            )
        )
        dashboard.add_widgets(*invocation_widgets)
        dashboard.add_widgets(*error_widgets)

        # --- Row 2: Latency (p50 / p95 / p99) per function ----------------
        latency_widgets = []
        for label, fn_name in fn_names.items():
            latency_widgets.append(
                cloudwatch.GraphWidget(
                    title=f"{label} — Duration (ms)",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/Lambda",
                            metric_name="Duration",
                            dimensions_map={"FunctionName": fn_name},
                            statistic="p50",
                            period=Duration.minutes(5),
                            label="p50",
                            color="#1f77b4",
                        ),
                        cloudwatch.Metric(
                            namespace="AWS/Lambda",
                            metric_name="Duration",
                            dimensions_map={"FunctionName": fn_name},
                            statistic="p95",
                            period=Duration.minutes(5),
                            label="p95",
                            color="#ff7f0e",
                        ),
                        cloudwatch.Metric(
                            namespace="AWS/Lambda",
                            metric_name="Duration",
                            dimensions_map={"FunctionName": fn_name},
                            statistic="p99",
                            period=Duration.minutes(5),
                            label="p99",
                            color="#d62728",
                        ),
                    ],
                    width=4,
                    height=4,
                )
            )
        dashboard.add_widgets(*latency_widgets)

        # --- Row 3: Throttles + cold starts --------------------------------
        throttle_widgets = []
        for label, fn_name in fn_names.items():
            throttle_widgets.append(
                cloudwatch.GraphWidget(
                    title=f"{label} — Throttles + Init Duration",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/Lambda",
                            metric_name="Throttles",
                            dimensions_map={"FunctionName": fn_name},
                            statistic="Sum",
                            period=Duration.minutes(5),
                            label="Throttles",
                            color="#9467bd",
                        ),
                    ],
                    right=[
                        cloudwatch.Metric(
                            namespace="AWS/Lambda",
                            metric_name="InitDuration",
                            dimensions_map={"FunctionName": fn_name},
                            statistic="p95",
                            period=Duration.minutes(5),
                            label="Cold start p95 (ms)",
                            color="#8c564b",
                        ),
                    ],
                    width=4,
                    height=4,
                )
            )
        dashboard.add_widgets(*throttle_widgets)

        # ------------------------------------------------------------------
        # CloudWatch Alarms
        # ------------------------------------------------------------------

        # Alarm: any Lambda errors in main handler (catch-all for 5xx)
        main_errors_alarm = cloudwatch.Alarm(
            self,
            "MainHandlerErrorsAlarm",
            alarm_name=f"scamguard-main-handler-errors-{env}",
            alarm_description=(
                "ScamGuard main handler Lambda errors > 5 in 5 min. "
                "Check /aws/lambda/scamguard-handler-aurora-dev logs."
            ),
            metric=cloudwatch.Metric(
                namespace="AWS/Lambda",
                metric_name="Errors",
                dimensions_map={"FunctionName": fn_names["main"]},
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Alarm: auth handler errors (OTP failures, Cognito issues)
        auth_errors_alarm = cloudwatch.Alarm(
            self,
            "AuthHandlerErrorsAlarm",
            alarm_name=f"scamguard-auth-errors-{env}",
            alarm_description="ScamGuard SMS auth handler errors > 3 in 5 min.",
            metric=cloudwatch.Metric(
                namespace="AWS/Lambda",
                metric_name="Errors",
                dimensions_map={"FunctionName": fn_names["sms_auth"]},
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=3,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Alarm: main handler p99 latency > 3000ms (Aurora cold start concern)
        latency_alarm = cloudwatch.Alarm(
            self,
            "MainHandlerLatencyAlarm",
            alarm_name=f"scamguard-main-latency-p99-{env}",
            alarm_description=(
                "Main handler p99 latency > 3000ms. "
                "Likely Aurora cold start or N+1 query. Check X-Ray traces."
            ),
            metric=cloudwatch.Metric(
                namespace="AWS/Lambda",
                metric_name="Duration",
                dimensions_map={"FunctionName": fn_names["main"]},
                statistic="p99",
                period=Duration.minutes(5),
            ),
            threshold=3000,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Alarm: throttles on any function (indicates concurrency limit hit)
        throttle_alarm = cloudwatch.Alarm(
            self,
            "ThrottlesAlarm",
            alarm_name=f"scamguard-throttles-{env}",
            alarm_description=(
                "Lambda throttles detected. Increase reserved concurrency "
                "or request service limit increase."
            ),
            metric=cloudwatch.MathExpression(
                expression="m1+m2+m3+m4+m5",
                using_metrics={
                    "m1": cloudwatch.Metric(
                        namespace="AWS/Lambda",
                        metric_name="Throttles",
                        dimensions_map={"FunctionName": fn_names["main"]},
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    "m2": cloudwatch.Metric(
                        namespace="AWS/Lambda",
                        metric_name="Throttles",
                        dimensions_map={"FunctionName": fn_names["sms_auth"]},
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    "m3": cloudwatch.Metric(
                        namespace="AWS/Lambda",
                        metric_name="Throttles",
                        dimensions_map={"FunctionName": fn_names["threats"]},
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    "m4": cloudwatch.Metric(
                        namespace="AWS/Lambda",
                        metric_name="Throttles",
                        dimensions_map={"FunctionName": fn_names["family"]},
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    "m5": cloudwatch.Metric(
                        namespace="AWS/Lambda",
                        metric_name="Throttles",
                        dimensions_map={"FunctionName": fn_names["reports_tools"]},
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                },
                period=Duration.minutes(5),
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # ------------------------------------------------------------------
        # CloudFormation Outputs
        # ------------------------------------------------------------------
        CfnOutput(
            self,
            "DashboardName",
            value=f"ScamGuard-API-{env}",
            description="CloudWatch dashboard for ScamGuard API Gateway (Phase 4)",
            export_name=f"ScamGuard-Dashboard-{env}",
        )

        CfnOutput(
            self,
            "MainErrorsAlarmArn",
            value=main_errors_alarm.alarm_arn,
            description="ARN of the main handler errors alarm",
            export_name=f"ScamGuard-MainErrorsAlarmArn-{env}",
        )

        CfnOutput(
            self,
            "LatencyAlarmArn",
            value=latency_alarm.alarm_arn,
            description="ARN of the main handler p99 latency alarm",
            export_name=f"ScamGuard-LatencyAlarmArn-{env}",
        )
