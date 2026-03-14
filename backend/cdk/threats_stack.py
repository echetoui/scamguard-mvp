"""
DynamoDB Stack for Phase 2 Sprint 5 - Threats Infrastructure
Defines tables for threat data, user threat matching, and threat scenarios
"""

from aws_cdk import (
    aws_dynamodb as dynamodb,
    core,
    aws_lambda as lambda_,
)


class ThreatsStack(core.Stack):
    """
    Stack containing DynamoDB tables for threat management
    """

    def __init__(self, scope: core.Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # 1. Threats Table
        # Stores threat objects from SQ API and CAFC
        self.threats_table = dynamodb.Table(
            self,
            "ThreatsTable",
            partition_key=dynamodb.Attribute(
                name="threat_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="date_detected",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # On-demand pricing
            point_in_time_recovery=True,  # Enable PITR for disaster recovery
            stream=dynamodb.StreamSpecification(
                stream_type=dynamodb.StreamType.NEW_AND_OLD_IMAGES
            ),
            removal_policy=core.RemovalPolicy.RETAIN,  # Keep data on stack delete
        )

        # Add Global Secondary Index for querying by threat level
        self.threats_table.add_global_secondary_index(
            index_name="threat_level_index",
            partition_key=dynamodb.Attribute(
                name="threat_level",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="date_detected",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # Add Global Secondary Index for querying by institution
        self.threats_table.add_global_secondary_index(
            index_name="institution_index",
            partition_key=dynamodb.Attribute(
                name="institution",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="date_detected",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # Add TTL for automatic cleanup of old threats (90 days)
        self.threats_table.add_ttl_attribute(
            attribute_name="ttl_timestamp"
        )

        # 2. User Threats Table
        # Tracks which threats match each user's profile
        self.user_threats_table = dynamodb.Table(
            self,
            "UserThreatsTable",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="threat_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            stream=dynamodb.StreamSpecification(
                stream_type=dynamodb.StreamType.NEW_AND_OLD_IMAGES
            ),
            removal_policy=core.RemovalPolicy.RETAIN,
        )

        # Add Global Secondary Index for querying threats by date for a user
        self.user_threats_table.add_global_secondary_index(
            index_name="user_date_index",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="matched_at",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # 3. Threat Scenarios Table
        # Stores quiz training scenarios (locally maintained)
        self.threat_scenarios_table = dynamodb.Table(
            self,
            "ThreatScenariosTable",
            partition_key=dynamodb.Attribute(
                name="scenario_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="version",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=core.RemovalPolicy.RETAIN,
        )

        # Add Global Secondary Index for querying by category
        self.threat_scenarios_table.add_global_secondary_index(
            index_name="category_index",
            partition_key=dynamodb.Attribute(
                name="category",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="scenario_id",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # Output table names for reference
        core.CfnOutput(
            self,
            "ThreatsTableName",
            value=self.threats_table.table_name,
            export_name="ThreatsTableName"
        )

        core.CfnOutput(
            self,
            "UserThreatsTableName",
            value=self.user_threats_table.table_name,
            export_name="UserThreatsTableName"
        )

        core.CfnOutput(
            self,
            "ThreatScenariosTableName",
            value=self.threat_scenarios_table.table_name,
            export_name="ThreatScenariosTableName"
        )
