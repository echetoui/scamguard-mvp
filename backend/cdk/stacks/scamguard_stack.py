from aws_cdk import Stack, aws_dynamodb as ddb, aws_s3 as s3, aws_lambda as lambda_, aws_apigateway as apigw, Duration, RemovalPolicy, CfnOutput
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
        
        # API Gateway
        api = apigw.RestApi(self, "API", rest_api_name="scamguard-api")
        api.root.add_method("ANY", apigw.LambdaIntegration(handler_lambda))
        api.root.add_resource("{proxy+}").add_method("ANY", apigw.LambdaIntegration(handler_lambda))
        
        CfnOutput(self, "TableName", value=self.data_table.table_name)
        CfnOutput(self, "APIEndpoint", value=api.url)
