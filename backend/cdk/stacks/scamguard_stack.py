from aws_cdk import (
    Stack, Duration, RemovalPolicy, CfnOutput,
    aws_lambda as lambda_, aws_apigateway as apigw,
    aws_dynamodb as ddb, aws_s3 as s3,
    aws_cloudfront as cloudfront, aws_cloudfront_origins as origins,
    aws_cognito as cognito, aws_secretsmanager as secretsmanager,
    aws_iam as iam, aws_logs as logs,
    aws_cloudwatch as cw, aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
)
from constructs import Construct

class ScamGuardStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        gemini_secret = secretsmanager.Secret.from_secret_name_v2(
            self, "GeminiSecret", "scamguard/gemini-key"
        )
        
        openai_secret = secretsmanager.Secret.from_secret_name_v2(
            self, "OpenAISecret", "scamguard/openai-key"
        )

        table = ddb.Table(
            self, "DataTable",
            partition_key=ddb.Attribute(name="PK", type=ddb.AttributeType.STRING),
            sort_key=ddb.Attribute(name="SK", type=ddb.AttributeType.STRING),
            billing_mode=ddb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.RETAIN,
            time_to_live_attribute="TTL"
        )

        uploads_bucket = s3.Bucket(
            self, "UploadsBucket",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )

        frontend_bucket = s3.Bucket(
            self, "FrontendBucket",
            website_index_document="index.html",
            website_error_document="index.html",
            public_read_access=True,
            block_public_access=s3.BlockPublicAccess(
                block_public_acls=False, block_public_policy=False,
                ignore_public_acls=False, restrict_public_buckets=False
            ),
            removal_policy=RemovalPolicy.RETAIN
        )

        distribution = cloudfront.Distribution(
            self, "CDN",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(frontend_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED
            ),
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404, response_http_status=200,
                    response_page_path="/index.html"
                )
            ]
        )

        user_pool = cognito.UserPool(
            self, "UserPool",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=8, require_lowercase=True,
                require_uppercase=True, require_digits=True
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.RETAIN
        )

        user_pool_client = user_pool.add_client(
            "WebClient",
            auth_flows=cognito.AuthFlow(user_password=True, user_srp=True),
            generate_secret=False
        )

        api_lambda = lambda_.Function(
            self, "APILambda",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=lambda_.Code.from_asset("../lambda"),
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "TABLE_NAME": table.table_name,
                "UPLOADS_BUCKET": uploads_bucket.bucket_name,
                "GEMINI_SECRET_ARN": gemini_secret.secret_arn,
                "OPENAI_SECRET_ARN": openai_secret.secret_arn,
                "POWERTOOLS_SERVICE_NAME": "scamguard-api",
                "LOG_LEVEL": "INFO"
            },
            tracing=lambda_.Tracing.ACTIVE,
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        table.grant_read_write_data(api_lambda)
        uploads_bucket.grant_read_write(api_lambda)
        gemini_secret.grant_read(api_lambda)
        openai_secret.grant_read(api_lambda)

        api = apigw.RestApi(
            self, "API",
            rest_api_name="ScamGuard API",
            description="ScamGuard AI v5.0 API",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"]
            ),
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=10,
                throttling_burst_limit=20,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                tracing_enabled=True
            )
        )

        authorizer = apigw.CognitoUserPoolsAuthorizer(
            self, "CognitoAuthorizer",
            cognito_user_pools=[user_pool]
        )

        lambda_integration = apigw.LambdaIntegration(api_lambda)

        scenario = api.root.add_resource("scenario")
        scenario.add_method("POST", lambda_integration, authorizer=authorizer)

        analyze = api.root.add_resource("analyze")
        analyze.add_method("POST", lambda_integration, authorizer=authorizer)

        profile = api.root.add_resource("profile")
        profile.add_method("GET", lambda_integration, authorizer=authorizer)
        profile.add_method("PUT", lambda_integration, authorizer=authorizer)
        profile.add_method("DELETE", lambda_integration, authorizer=authorizer)

        analytics = api.root.add_resource("analytics")
        analytics.add_method("GET", lambda_integration, authorizer=authorizer)

        alarm_topic = sns.Topic(self, "AlarmTopic", display_name="ScamGuard Alarms")

        lambda_errors = cw.Alarm(
            self, "LambdaErrorsAlarm",
            metric=api_lambda.metric_errors(statistic="Sum", period=Duration.minutes(5)),
            threshold=5, evaluation_periods=1,
            alarm_description="Lambda errors > 5 in 5 minutes"
        )
        lambda_errors.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        lambda_duration = cw.Alarm(
            self, "LambdaDurationAlarm",
            metric=api_lambda.metric_duration(statistic="Average", period=Duration.minutes(5)),
            threshold=10000, evaluation_periods=2,
            alarm_description="Lambda duration > 10s average"
        )
        lambda_duration.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        table_throttle = cw.Alarm(
            self, "DynamoDBThrottleAlarm",
            metric=table.metric_user_errors(statistic="Sum", period=Duration.minutes(5)),
            threshold=10, evaluation_periods=1,
            alarm_description="DynamoDB throttling detected"
        )
        table_throttle.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        CfnOutput(self, "APIEndpoint", value=api.url)
        CfnOutput(self, "UserPoolId", value=user_pool.user_pool_id)
        CfnOutput(self, "UserPoolClientId", value=user_pool_client.user_pool_client_id)
        CfnOutput(self, "CloudFrontURL", value=f"https://{distribution.distribution_domain_name}")
        CfnOutput(self, "FrontendBucket", value=frontend_bucket.bucket_name)
        CfnOutput(self, "TableName", value=table.table_name)
        CfnOutput(self, "AlarmTopicArn", value=alarm_topic.topic_arn)
