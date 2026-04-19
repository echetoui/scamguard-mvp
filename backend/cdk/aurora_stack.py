"""
ScamGuard MVP - Aurora Serverless v2 CDK Stack
Phase 1, Day 3: Development Environment Setup

Decision: Migrate from DynamoDB to Aurora Serverless v2 (PostgreSQL)
Rationale: Enables Phase 6 analytics without 4-5x cost explosion on DynamoDB.
           Aurora is cheaper after ~200 users and SQL handles complex queries natively.
           See: SERVERLESS_ARCHITECTURE_DECISION.md

Budget Impact: +$45/month (approved Q1-Q3, break-even at 200 users ~month 6)
Target environment: DEV ONLY - do not deploy this stack to production yet.
"""
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_secretsmanager as secretsmanager,
    aws_lambda as lambda_,
    aws_iam as iam,
)
from constructs import Construct


class AuroraStack(Stack):
    """
    Aurora Serverless v2 stack for ScamGuard MVP.

    Creates:
    - VPC with private subnets (Aurora must not be public-facing)
    - Aurora Serverless v2 cluster (PostgreSQL 15.4)
    - Secrets Manager secret for DB credentials
    - Security group permitting Lambda access on port 5432
    - CDK outputs for downstream stacks (Lambda, API GW)

    Scaling: 0.5 ACU min (idle ~$0.02/hr), 2 ACU max (~$0.12/hr under load)
    Storage: $0.10/GB/month, starts at ~1 GB
    Estimated cost at 0.5 ACU continuous: $43/month
    """

    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # ------------------------------------------------------------------
        # VPC - Aurora must live in private subnets.
        # 2 AZs is sufficient for dev; prod should use 3.
        # ------------------------------------------------------------------
        vpc = ec2.Vpc(
            self,
            "ScamGuardVPC",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # ------------------------------------------------------------------
        # Security group for the Aurora cluster.
        # Lambda functions in the same VPC are granted ingress below.
        # ------------------------------------------------------------------
        db_security_group = ec2.SecurityGroup(
            self,
            "DBSecurityGroup",
            vpc=vpc,
            description="ScamGuard Aurora cluster security group",
            allow_all_outbound=False,
        )

        lambda_security_group = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=vpc,
            description="ScamGuard Lambda functions security group",
            allow_all_outbound=True,
        )

        # Allow Lambda SG -> DB SG on PostgreSQL port only
        db_security_group.add_ingress_rule(
            peer=lambda_security_group,
            connection=ec2.Port.tcp(5432),
            description="Lambda functions access to Aurora",
        )

        # ------------------------------------------------------------------
        # Subnet group - isolate Aurora in private-isolated subnets
        # ------------------------------------------------------------------
        db_subnet_group = rds.SubnetGroup(
            self,
            "DBSubnetGroup",
            description="ScamGuard Aurora subnet group",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
        )

        # ------------------------------------------------------------------
        # Aurora Serverless v2 cluster
        #
        # Engine: PostgreSQL 15.4 (LTS, compatible with psycopg2/asyncpg)
        # Min: 0.5 ACU (~$0.03/hr idle) — scales to zero not supported on v2
        # Max: 2 ACU (enough for MVP load; raise to 8 at 500+ users)
        # Data API: enabled — allows Lambda to query without VPC attachment
        #           (useful for local dev; Lambda in prod uses VPC + psycopg2)
        # RemovalPolicy.SNAPSHOT: protects data on stack deletion (dev only)
        #
        # NOTE: Aurora Serverless v2 does NOT support auto-pause to 0 ACU.
        #       The 0.5 ACU minimum ($43/month) is the true floor.
        # ------------------------------------------------------------------
        self.cluster = rds.DatabaseCluster(
            self,
            "ScamGuardDB",
            cluster_identifier="scamguard-dev",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_4
            ),
            writer=rds.ClusterInstance.serverless_v2(
                "writer",
                publicly_accessible=False,
            ),
            readers=[
                rds.ClusterInstance.serverless_v2(
                    "reader",
                    scale_with_writer=True,
                    publicly_accessible=False,
                )
            ],
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=2.0,
            default_database_name="scamguard",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[db_security_group],
            subnet_group=db_subnet_group,
            credentials=rds.Credentials.from_generated_secret(
                username="scamguard_admin",
                secret_name="scamguard/dev/aurora-credentials",
            ),
            backup=rds.BackupProps(retention=Duration.days(7)),
            removal_policy=RemovalPolicy.SNAPSHOT,
            deletion_protection=False,  # Set True before production promotion
            enable_data_api=True,
            # Storage encryption uses AWS-managed key (sufficient for MVP)
            storage_encrypted=True,
            # CloudWatch logs for query auditing
            cloudwatch_logs_exports=["postgresql"],
            cloudwatch_logs_retention_days=7,
        )

        # ------------------------------------------------------------------
        # IAM policy document for Lambda functions that need Aurora access.
        # Attach this policy to any Lambda role that queries the DB.
        # ------------------------------------------------------------------
        self.lambda_db_access_policy = iam.ManagedPolicy(
            self,
            "LambdaDBAccessPolicy",
            managed_policy_name="ScamGuardLambdaAuroraAccess-dev",
            description="Allows Lambda to read Aurora credentials from Secrets Manager and use Data API",
            statements=[
                iam.PolicyStatement(
                    actions=[
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret",
                    ],
                    resources=[self.cluster.secret.secret_arn],
                ),
                iam.PolicyStatement(
                    actions=[
                        "rds-data:ExecuteStatement",
                        "rds-data:BatchExecuteStatement",
                        "rds-data:BeginTransaction",
                        "rds-data:CommitTransaction",
                        "rds-data:RollbackTransaction",
                    ],
                    resources=[self.cluster.cluster_arn],
                ),
            ],
        )

        # ------------------------------------------------------------------
        # Expose cluster attributes for downstream stacks
        # ------------------------------------------------------------------
        self.vpc = vpc
        self.lambda_security_group = lambda_security_group
        self.db_endpoint = self.cluster.clusterEndpoint.hostname

        # ------------------------------------------------------------------
        # CloudFormation outputs (consumed by Lambda stack + runbook)
        # ------------------------------------------------------------------
        CfnOutput(
            self,
            "ClusterArn",
            value=self.cluster.cluster_arn,
            description="Aurora cluster ARN (used by Lambda Data API)",
            export_name="ScamGuard-Dev-ClusterArn",
        )
        CfnOutput(
            self,
            "ClusterEndpoint",
            value=self.cluster.clusterEndpoint.hostname,
            description="Aurora writer endpoint (used by psycopg2 in Lambda)",
            export_name="ScamGuard-Dev-ClusterEndpoint",
        )
        CfnOutput(
            self,
            "SecretArn",
            value=self.cluster.secret.secret_arn,
            description="Secrets Manager ARN for DB credentials",
            export_name="ScamGuard-Dev-SecretArn",
        )
        CfnOutput(
            self,
            "DatabaseName",
            value="scamguard",
            description="Default database name",
            export_name="ScamGuard-Dev-DatabaseName",
        )
        CfnOutput(
            self,
            "LambdaSecurityGroupId",
            value=lambda_security_group.security_group_id,
            description="Security group ID to attach to Lambda functions that need DB access",
            export_name="ScamGuard-Dev-LambdaSecurityGroupId",
        )
        CfnOutput(
            self,
            "VpcId",
            value=vpc.vpc_id,
            description="VPC ID for Lambda VPC configuration",
            export_name="ScamGuard-Dev-VpcId",
        )
        CfnOutput(
            self,
            "EstimatedMonthlyCost",
            value="$46-52 (0.5 ACU + 5GB storage) — see SERVERLESS_ARCHITECTURE_DECISION.md",
            description="Estimated monthly cost for dev environment",
        )
