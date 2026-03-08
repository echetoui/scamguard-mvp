"""
DynamoDB Schema Management for Quebec Alerts
Defines table structure and provides helper functions for alerts
"""

import json
import boto3
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Initialize AWS SDK
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')

# Table configuration
ALERTS_TABLE_NAME = 'Alerts_QC'
ALERTS_TABLE_CONFIG = {
    'AttributeDefinitions': [
        {
            'AttributeName': 'alert_id',
            'AttributeType': 'S'  # String
        },
        {
            'AttributeName': 'date_detected',
            'AttributeType': 'S'  # String (ISO 8601)
        }
    ],
    'KeySchema': [
        {
            'AttributeName': 'alert_id',
            'KeyType': 'HASH'  # Partition key
        },
        {
            'AttributeName': 'date_detected',
            'KeyType': 'RANGE'  # Sort key
        }
    ],
    'BillingMode': 'PAY_PER_REQUEST',  # On-demand pricing
    'StreamSpecification': {
        'StreamViewType': 'NEW_AND_OLD_IMAGES'
    },
    'TimeToLiveSpecification': {
        'AttributeName': 'ttl',
        'Enabled': True
    }
}


class AlertsTable:
    """Manages Alerts_QC DynamoDB table operations"""

    VALID_THREAT_LEVELS = ['low', 'medium', 'high']
    VALID_FRAUD_TYPES = [
        'banking_phishing',
        'government_impersonation',
        'urgency_scam',
        'credential_theft',
        'payment_fraud',
        'telecom_fraud',
        'other'
    ]
    VALID_SOURCES = ['CAFC', 'SQ', 'INTERNAL']

    def __init__(self):
        """Initialize alerts table reference"""
        self.table = dynamodb.Table(ALERTS_TABLE_NAME)

    def create_table(self) -> bool:
        """
        Create Alerts_QC table if it doesn't exist

        Returns:
            True if table created or already exists
        """
        try:
            # Check if table exists
            try:
                self.table.load()
                print(f"Table {ALERTS_TABLE_NAME} already exists")
                return True
            except dynamodb.meta.client.exceptions.ResourceNotFoundException:
                pass

            # Create table
            table = dynamodb.create_table(
                TableName=ALERTS_TABLE_NAME,
                **ALERTS_TABLE_CONFIG
            )

            # Wait for table to be created
            table.meta.client.get_waiter('table_exists').wait(
                TableName=ALERTS_TABLE_NAME
            )

            print(f"Table {ALERTS_TABLE_NAME} created successfully")
            return True

        except Exception as e:
            print(f"Error creating table: {e}")
            return False

    def delete_table(self) -> bool:
        """
        Delete Alerts_QC table (WARNING: destructive)

        Returns:
            True if table deleted
        """
        try:
            self.table.delete()
            self.table.meta.client.get_waiter('table_not_exists').wait(
                TableName=ALERTS_TABLE_NAME
            )
            print(f"Table {ALERTS_TABLE_NAME} deleted")
            return True
        except Exception as e:
            print(f"Error deleting table: {e}")
            return False

    def get_alert(self, alert_id: str) -> Optional[Dict]:
        """
        Get a specific alert by ID

        Args:
            alert_id: The alert ID

        Returns:
            Alert item or None if not found
        """
        try:
            response = self.table.get_item(
                Key={'alert_id': alert_id}
            )
            return response.get('Item')
        except Exception as e:
            print(f"Error getting alert: {e}")
            return None

    def get_alerts_by_institution(self, institution: str) -> List[Dict]:
        """
        Get all alerts for a specific institution

        Args:
            institution: Institution name (e.g., 'Desjardins')

        Returns:
            List of alerts for that institution
        """
        try:
            response = self.table.scan(
                FilterExpression='institution = :inst',
                ExpressionAttributeValues={
                    ':inst': institution
                }
            )
            return response.get('Items', [])
        except Exception as e:
            print(f"Error scanning alerts: {e}")
            return []

    def get_high_threat_alerts(self) -> List[Dict]:
        """
        Get all high-threat alerts

        Returns:
            List of high-threat alerts
        """
        try:
            response = self.table.scan(
                FilterExpression='threat_level = :level',
                ExpressionAttributeValues={
                    ':level': 'high'
                }
            )
            return response.get('Items', [])
        except Exception as e:
            print(f"Error getting high threat alerts: {e}")
            return []

    def get_recent_alerts(self, hours: int = 24) -> List[Dict]:
        """
        Get alerts from the last N hours

        Args:
            hours: Number of hours to look back (default 24)

        Returns:
            List of recent alerts
        """
        try:
            cutoff_time = (datetime.utcnow() - timedelta(hours=hours)).isoformat() + 'Z'

            response = self.table.scan(
                FilterExpression='date_detected > :cutoff',
                ExpressionAttributeValues={
                    ':cutoff': cutoff_time
                }
            )
            return response.get('Items', [])
        except Exception as e:
            print(f"Error getting recent alerts: {e}")
            return []

    def get_alerts_by_region(self, region: str) -> List[Dict]:
        """
        Get alerts affecting a specific region

        Args:
            region: Region name (e.g., 'Montreal', 'Quebec')

        Returns:
            List of alerts for that region
        """
        try:
            response = self.table.scan(
                FilterExpression='contains(regions_affected, :region)',
                ExpressionAttributeValues={
                    ':region': region
                }
            )
            return response.get('Items', [])
        except Exception as e:
            print(f"Error getting regional alerts: {e}")
            return []

    def get_alerts_by_fraud_type(self, fraud_type: str) -> List[Dict]:
        """
        Get alerts of a specific fraud type

        Args:
            fraud_type: Type of fraud (e.g., 'banking_phishing')

        Returns:
            List of alerts of that type
        """
        try:
            response = self.table.scan(
                FilterExpression='fraud_type = :type',
                ExpressionAttributeValues={
                    ':type': fraud_type
                }
            )
            return response.get('Items', [])
        except Exception as e:
            print(f"Error getting fraud type alerts: {e}")
            return []

    def validate_alert(self, alert: Dict) -> tuple[bool, str]:
        """
        Validate alert structure and values

        Args:
            alert: Alert dictionary to validate

        Returns:
            Tuple of (is_valid: bool, error_message: str)
        """
        # Check required fields
        required_fields = [
            'alert_id',
            'date_detected',
            'source',
            'threat_level',
            'institution',
            'fraud_type',
            'description_fr'
        ]

        for field in required_fields:
            if field not in alert:
                return False, f"Missing required field: {field}"

        # Validate threat level
        if alert['threat_level'] not in self.VALID_THREAT_LEVELS:
            return False, f"Invalid threat_level: {alert['threat_level']}"

        # Validate fraud type
        if alert['fraud_type'] not in self.VALID_FRAUD_TYPES:
            return False, f"Invalid fraud_type: {alert['fraud_type']}"

        # Validate source
        if alert['source'] not in self.VALID_SOURCES:
            return False, f"Invalid source: {alert['source']}"

        return True, ""

    def count_alerts(self) -> int:
        """
        Count total alerts in table

        Returns:
            Number of alerts
        """
        try:
            response = self.table.scan(Select='COUNT')
            return response.get('Count', 0)
        except Exception as e:
            print(f"Error counting alerts: {e}")
            return 0

    def get_alert_statistics(self) -> Dict:
        """
        Get statistics about alerts

        Returns:
            Dictionary with alert statistics
        """
        try:
            all_alerts = self.table.scan()['Items']

            stats = {
                'total': len(all_alerts),
                'by_threat_level': {},
                'by_fraud_type': {},
                'by_institution': {},
                'by_source': {}
            }

            for alert in all_alerts:
                # Count by threat level
                level = alert.get('threat_level', 'unknown')
                stats['by_threat_level'][level] = stats['by_threat_level'].get(level, 0) + 1

                # Count by fraud type
                ftype = alert.get('fraud_type', 'unknown')
                stats['by_fraud_type'][ftype] = stats['by_fraud_type'].get(ftype, 0) + 1

                # Count by institution
                inst = alert.get('institution', 'Unknown')
                stats['by_institution'][inst] = stats['by_institution'].get(inst, 0) + 1

                # Count by source
                src = alert.get('source', 'unknown')
                stats['by_source'][src] = stats['by_source'].get(src, 0) + 1

            return stats

        except Exception as e:
            print(f"Error getting statistics: {e}")
            return {}

    def cleanup_old_alerts(self, days: int = 30) -> int:
        """
        Manual cleanup of old alerts (TTL handles auto-delete)

        Args:
            days: Delete alerts older than this many days

        Returns:
            Number of alerts deleted
        """
        try:
            cutoff_time = (datetime.utcnow() - timedelta(days=days)).isoformat() + 'Z'

            response = self.table.scan(
                FilterExpression='date_detected < :cutoff',
                ExpressionAttributeValues={
                    ':cutoff': cutoff_time
                }
            )

            deleted = 0
            for item in response.get('Items', []):
                self.table.delete_item(
                    Key={'alert_id': item['alert_id']}
                )
                deleted += 1

            return deleted

        except Exception as e:
            print(f"Error cleaning up alerts: {e}")
            return 0


def format_alert_for_display(alert: Dict) -> str:
    """
    Format alert for user display

    Args:
        alert: Alert dictionary

    Returns:
        Formatted alert string
    """
    threat_emoji = {
        'high': '🚨',
        'medium': '⚠️',
        'low': 'ℹ️'
    }

    emoji = threat_emoji.get(alert.get('threat_level'), '?')

    return f"""
{emoji} **{alert.get('title', 'Alert')}**

Institution: {alert.get('institution')}
Type: {alert.get('fraud_type')}
Threat Level: {alert.get('threat_level').upper()}

Description:
{alert.get('description_fr')}

Regions Affected:
{', '.join(alert.get('regions_affected', []))}

Action:
{alert.get('action')}

Reported: {alert.get('date_detected')}
Source: {alert.get('source')}
"""


if __name__ == '__main__':
    # Test script
    print("Testing Alerts Schema...")

    manager = AlertsTable()

    # Create table
    print("\n1. Creating table...")
    manager.create_table()

    # Count alerts
    print(f"\n2. Alert count: {manager.count_alerts()}")

    # Get statistics
    print("\n3. Alert statistics:")
    stats = manager.get_alert_statistics()
    print(json.dumps(stats, indent=2))

    print("\nSchema test complete!")
