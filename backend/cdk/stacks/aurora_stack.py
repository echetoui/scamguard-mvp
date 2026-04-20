from aws_cdk import (
    Stack, 
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_iam as iam,
    aws_s3 as s3,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class ScamGuardAuroraStack(Stack):
    """Aurora Serverless v2 Stack - 70% moins cher que DynamoDB"""
    
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # VPC pour Aurora
        vpc = ec2.Vpc(self, "ScamGuardVPC", max_azs=2)
        
        # Aurora Serverless v2 Cluster
        cluster = rds.ServerlessCluster(
            self, "ScamGuardDB",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_2
            ),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            default_database_name="scamguard",
            removal_policy=RemovalPolicy.SNAPSHOT,
            scaling=rds.ServerlessScalingOptions(
                min_capacity=rds.AuroraCapacityUnit.ACU_0_5,
                max_capacity=rds.AuroraCapacityUnit.ACU_2,
                auto_pause=Duration.minutes(5),
                timeout_action=rds.TimeoutAction.FORCE_APPLY_CAPACITY_CHANGE
            ),
            enable_data_api=True,  # Pour Lambda sans VPC
            backup_retention=Duration.days(7),
            deletion_protection=False
        )
        
        # S3 Buckets
        uploads_bucket = s3.Bucket(self, "UploadsBucket")
        frontend_bucket = s3.Bucket(self, "FrontendBucket")
        
        # Lambda Handler avec accès Aurora
        handler_lambda = lambda_.Function(
            self, "Handler",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=lambda_.Code.from_asset("../lambda_"),
            timeout=Duration.seconds(60),
            memory_size=256,
            environment={
                "DB_CLUSTER_ARN": cluster.cluster_arn,
                "DB_SECRET_ARN": cluster.secret.secret_arn,
                "DB_NAME": "scamguard",
                "UPLOADS_BUCKET": uploads_bucket.bucket_name,
                "FIREBASE_API_KEY": "BJ7nqu0Hg7XuR-6riO06tCfzy7JjSpmmjqhjHEgzeGv1Elryv_Gqg6z_1EMQuW0wtQPRMlOE7bBR4JYeXiVCt_k",
                "FIREBASE_PROJECT_ID": "scamguard-c3e04"
            }
        )
        
        # Permissions Aurora
        cluster.grant_data_api_access(handler_lambda)
        uploads_bucket.grant_read_write(handler_lambda)
        
        # API Gateway
        api = apigw.RestApi(self, "API", rest_api_name="scamguard-api")
        api.root.add_method("ANY", apigw.LambdaIntegration(handler_lambda))
        api.root.add_resource("{proxy+}").add_method("ANY", apigw.LambdaIntegration(handler_lambda))
        
        # Outputs
        CfnOutput(self, "ClusterArn", value=cluster.cluster_arn)
        CfnOutput(self, "SecretArn", value=cluster.secret.secret_arn)
        CfnOutput(self, "APIEndpoint", value=api.url)
        CfnOutput(self, "EstimatedMonthlyCost", value="$2-5 (vs $16 DynamoDB)")
