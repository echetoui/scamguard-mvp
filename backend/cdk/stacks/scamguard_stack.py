from aws_cdk import Stack, aws_dynamodb as ddb, aws_s3 as s3, aws_lambda as lambda_, aws_apigateway as apigw, aws_iam as iam, Duration, RemovalPolicy, CfnOutput
from constructs import Construct

class ScamGuardStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # DynamoDB Table
        self.data_table = ddb.Table(
            self, "DataTable",
            partition_key=ddb.Attribute(name="pk", type=ddb.AttributeType.STRING),
            sort_key=ddb.Attribute(name="sk", type=ddb.AttributeType.STRING),
            billing_mode=ddb.BillingMode.PAY_PER_REQUEST
        )
        
        # OTP Table
        self.otp_table = ddb.Table(
            self, "ScamGuardOTPTable",
            table_name="ScamGuardOTP",
            partition_key=ddb.Attribute(name="PK", type=ddb.AttributeType.STRING),
            sort_key=ddb.Attribute(name="SK", type=ddb.AttributeType.STRING),
            billing_mode=ddb.BillingMode.PAY_PER_REQUEST,
            time_to_live_attribute="expiresAt",
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # S3 Buckets
        uploads_bucket = s3.Bucket(self, "UploadsBucket")
        frontend_bucket = s3.Bucket(self, "FrontendBucket")
        
        # Lambda Handler
        handler_lambda = lambda_.Function(
            self, "Handler",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=lambda_.Code.from_asset("../lambda_"),
            timeout=Duration.seconds(60),
            memory_size=256,
            environment={
                "TABLE_NAME": self.data_table.table_name,
                "UPLOADS_BUCKET": uploads_bucket.bucket_name,
                # Firebase SMS Configuration
                "FIREBASE_API_KEY": "BJ7nqu0Hg7XuR-6riO06tCfzy7JjSpmmjqhjHEgzeGv1Elryv_Gqg6z_1EMQuW0wtQPRMlOE7bBR4JYeXiVCt_k",
                "FIREBASE_PROJECT_ID": "scamguard-c3e04"
            }
        )
        
        self.data_table.grant_read_write_data(handler_lambda)
        uploads_bucket.grant_read_write(handler_lambda)

        # OTP Lambdas
        request_otp_lambda = lambda_.Function(
            self, "RequestOTPLambda",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="sms_otp_handler.request_otp",
            code=lambda_.Code.from_asset("../lambda_"),
            timeout=Duration.seconds(10),
            environment={
                "DYNAMODB_TABLE_OTP": self.otp_table.table_name,
                "PINPOINT_PROJECT_ID": "7422bf6714644482b8100da38abcd4ae"
            }
        )

        verify_otp_lambda = lambda_.Function(
            self, "VerifyOTPLambda",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="verify_otp_handler.verify_otp",
            code=lambda_.Code.from_asset("../lambda_"),
            timeout=Duration.seconds(10),
            environment={
                "DYNAMODB_TABLE_OTP": self.otp_table.table_name
            }
        )

        # Permissions OTP
        self.otp_table.grant_read_write_data(request_otp_lambda)
        self.otp_table.grant_read_write_data(verify_otp_lambda)
        request_otp_lambda.add_to_role_policy(iam.PolicyStatement(
            actions=["mobiletargeting:SendMessages"],
            resources=["*"]
        ))
        
        # API Gateway
        api = apigw.RestApi(self, "API", rest_api_name="scamguard-api")
        api.root.add_method("ANY", apigw.LambdaIntegration(handler_lambda))
        api.root.add_resource("{proxy+}").add_method("ANY", apigw.LambdaIntegration(handler_lambda))
        
        # Auth routes
        auth_resource = api.root.add_resource("auth")
        
        request_otp_resource = auth_resource.add_resource("request-sms-otp")
        request_otp_resource.add_method("POST", apigw.LambdaIntegration(request_otp_lambda))
        request_otp_resource.add_cors_preflight(allow_origins=apigw.Cors.ALL_ORIGINS, allow_methods=["POST", "OPTIONS"])
        
        verify_otp_resource = auth_resource.add_resource("verify-sms-otp")
        verify_otp_resource.add_method("POST", apigw.LambdaIntegration(verify_otp_lambda))
        verify_otp_resource.add_cors_preflight(allow_origins=apigw.Cors.ALL_ORIGINS, allow_methods=["POST", "OPTIONS"])
        
        CfnOutput(self, "TableName", value=self.data_table.table_name)
        CfnOutput(self, "APIEndpoint", value=api.url)
