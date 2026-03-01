#!/bin/bash

# ScamGuard Cost Optimization Script
# Niveau 2: MOYEN → -$1.50/mois

set -e

echo "🔧 Applying cost optimizations..."

# 1. Set CloudWatch Logs retention to 3 days
echo "📝 Setting CloudWatch Logs retention to 3 days..."
aws logs put-retention-policy --log-group-name /aws/lambda/scamguard-auth-dev --retention-in-days 3
aws logs put-retention-policy --log-group-name /aws/lambda/scamguard-sms-otp-dev --retention-in-days 3

# 2. Configure S3 lifecycle for 7-day deletion
echo "🗂️ Setting S3 lifecycle policy for 7-day deletion..."
BUCKET_NAME="scamguard-artifacts-034362029181-dev"

cat > /tmp/lifecycle.json << EOF
{
    "Rules": [
        {
            "ID": "DeleteOldObjects",
            "Status": "Enabled",
            "Filter": {},
            "Expiration": {
                "Days": 7
            }
        },
        {
            "ID": "DeleteIncompleteMultipartUploads", 
            "Status": "Enabled",
            "Filter": {},
            "AbortIncompleteMultipartUpload": {
                "DaysAfterInitiation": 1
            }
        }
    ]
}
EOF

aws s3api put-bucket-lifecycle-configuration --bucket $BUCKET_NAME --lifecycle-configuration file:///tmp/lifecycle.json

echo "✅ Cost optimizations applied!"
echo "💰 Expected savings: -$1.50/mois (-40%)"
echo "📊 New monthly cost: $2.20-3.20/mois"