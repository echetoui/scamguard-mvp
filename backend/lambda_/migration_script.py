"""
DynamoDB Migration Script for Anonymization and TTL
Migrates existing records to use hashed user IDs and adds TTL

Usage:
    python migration_script.py [--dry-run] [--table TABLE_NAME]

Options:
    --dry-run       Show what would be changed without actually modifying data
    --table         Specify DynamoDB table name (default: auto-detect from CDK)
"""

import boto3
import json
import sys
import argparse
from datetime import datetime, timedelta
from utils.anonymization import AnonymizationManager, anonymize_item

# Initialize AWS SDK
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')


class DynamoDBMigrator:
    """Handles migration of DynamoDB items for anonymization"""

    TTL_DAYS = 30

    def __init__(self, table_name: str, dry_run: bool = False):
        """
        Initialize the migrator

        Args:
            table_name (str): Name of the DynamoDB table
            dry_run (bool): If True, show changes without applying them
        """
        self.table_name = table_name
        self.dry_run = dry_run
        self.table = dynamodb.Table(table_name)
        self.anon_manager = AnonymizationManager()
        self.stats = {
            'scanned': 0,
            'migrated': 0,
            'skipped': 0,
            'errors': 0,
            'no_change': 0
        }

    def scan_items(self):
        """
        Scan all items in the DynamoDB table

        Yields:
            dict: Each item in the table
        """
        scan_kwargs = {}
        done = False
        start_key = None

        while not done:
            if start_key:
                scan_kwargs['ExclusiveStartKey'] = start_key

            response = self.table.scan(**scan_kwargs)

            for item in response.get('Items', []):
                yield item

            start_key = response.get('LastEvaluatedKey')
            done = not start_key

    def needs_migration(self, item: dict) -> bool:
        """
        Check if an item needs migration

        Args:
            item (dict): The DynamoDB item

        Returns:
            bool: True if item needs migration
        """
        # Needs migration if:
        # 1. Has userId but not hashedUserId, OR
        # 2. Missing expirationTime
        has_user_id = 'userId' in item
        has_hashed_id = 'hashedUserId' in item
        has_ttl = 'expirationTime' in item

        return (has_user_id and not has_hashed_id) or not has_ttl

    def migrate_item(self, item: dict) -> tuple:
        """
        Migrate a single DynamoDB item

        Args:
            item (dict): The original item

        Returns:
            tuple: (success: bool, migrated_item: dict)
        """
        try:
            # Create anonymized copy
            migrated = {
                **item,
                'hashedUserId': self.anon_manager.hash_user_id(item.get('userId', 'anonymous')),
                'expirationTime': int((datetime.utcnow() + timedelta(days=self.TTL_DAYS)).timestamp()),
                'migrated_at': datetime.utcnow().isoformat() + 'Z',
                'migration_version': 1
            }

            # Remove original userId for privacy
            if 'userId' in migrated:
                del migrated['userId']

            return True, migrated
        except Exception as e:
            print(f"Error migrating item: {e}")
            return False, None

    def execute(self, limit: int = None) -> dict:
        """
        Execute the migration

        Args:
            limit (int): Maximum number of items to migrate (None = all)

        Returns:
            dict: Migration statistics
        """
        print(f"\n{'='*60}")
        print(f"DynamoDB Migration Tool - Anonymization & TTL")
        print(f"{'='*60}")
        print(f"Table: {self.table_name}")
        print(f"Dry Run: {self.dry_run}")
        print(f"Max Items: {limit or 'All'}")
        print(f"{'='*60}\n")

        for item in self.scan_items():
            self.stats['scanned'] += 1

            # Check limit
            if limit and self.stats['scanned'] > limit:
                break

            # Check if needs migration
            if not self.needs_migration(item):
                self.stats['no_change'] += 1
                continue

            # Migrate item
            success, migrated_item = self.migrate_item(item)

            if not success:
                self.stats['errors'] += 1
                continue

            # Get item key for update
            key = self._get_item_key(item)

            if not self.dry_run:
                try:
                    # Delete old item (remove userId)
                    self.table.delete_item(Key=key)

                    # Put new anonymized item
                    self.table.put_item(Item=migrated_item)

                    self.stats['migrated'] += 1

                    if self.stats['migrated'] % 10 == 0:
                        print(f"✓ Migrated {self.stats['migrated']} items...")

                except Exception as e:
                    print(f"Error updating item {key}: {e}")
                    self.stats['errors'] += 1
            else:
                # Dry run - just count
                self.stats['migrated'] += 1
                if self.stats['migrated'] <= 3:
                    print(f"[DRY RUN] Would migrate item:")
                    print(f"  Old: userId={item.get('userId', 'N/A')}")
                    print(f"  New: hashedUserId={migrated_item.get('hashedUserId', 'N/A')[:16]}...")
                    print(f"  TTL: expirationTime={migrated_item.get('expirationTime')}")
                    print()

        self._print_summary()
        return self.stats

    def _get_item_key(self, item: dict) -> dict:
        """Extract primary key from item"""
        # Assuming 'timestamp' is the sort key and there's a partition key
        # Adjust based on actual table schema
        key = {}
        if 'hashedUserId' in item:
            key['hashedUserId'] = item['hashedUserId']
        elif 'userId' in item:
            key['userId'] = item['userId']
        if 'timestamp' in item:
            key['timestamp'] = item['timestamp']
        return key

    def _print_summary(self):
        """Print migration summary"""
        print(f"\n{'='*60}")
        print(f"Migration Summary")
        print(f"{'='*60}")
        print(f"Total Scanned:    {self.stats['scanned']}")
        print(f"Migrated:         {self.stats['migrated']}")
        print(f"No Change:        {self.stats['no_change']}")
        print(f"Errors:           {self.stats['errors']}")
        print(f"Skipped:          {self.stats['skipped']}")
        print(f"{'='*60}\n")

        if self.dry_run:
            print("⚠️  DRY RUN - No changes were made to the database")
        else:
            print("✅ Migration completed successfully!")


def get_table_name() -> str:
    """
    Auto-detect DynamoDB table name from CDK or environment

    Returns:
        str: Table name
    """
    # Try environment variable first
    if 'TABLE_NAME' in __import__('os').environ:
        return __import__('os').environ['TABLE_NAME']

    # Try to find CDK-generated table
    # This is a common CDK table name pattern
    return 'ScamGuardStack-DataTable447BC44E-1BID2SBGQEELH'


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Migrate DynamoDB items for anonymization and TTL'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without applying changes'
    )
    parser.add_argument(
        '--table',
        type=str,
        default=get_table_name(),
        help='DynamoDB table name'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=None,
        help='Maximum number of items to migrate'
    )

    args = parser.parse_args()

    try:
        migrator = DynamoDBMigrator(
            table_name=args.table,
            dry_run=args.dry_run
        )
        stats = migrator.execute(limit=args.limit)

        # Return exit code based on errors
        sys.exit(0 if stats['errors'] == 0 else 1)

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
