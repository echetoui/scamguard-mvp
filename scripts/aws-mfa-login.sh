#!/bin/bash
# Script pour obtenir session temporaire avec MFA

set -e

echo "🔐 AWS MFA Session Token"
echo "========================"

# Configuration
PROFILE="scamguard"
MFA_ARN="arn:aws:iam::ACCOUNT_ID:mfa/scamguard-dev"  # ⚠️ REMPLACER ACCOUNT_ID
DURATION=43200  # 12 heures

# Demander le token MFA
read -p "Enter MFA token code: " MFA_TOKEN

echo "Getting session token..."

# Obtenir credentials temporaires
CREDENTIALS=$(aws sts get-session-token \
    --profile $PROFILE \
    --serial-number $MFA_ARN \
    --token-code $MFA_TOKEN \
    --duration-seconds $DURATION \
    --output json)

# Extraire les credentials
ACCESS_KEY=$(echo $CREDENTIALS | jq -r '.Credentials.AccessKeyId')
SECRET_KEY=$(echo $CREDENTIALS | jq -r '.Credentials.SecretAccessKey')
SESSION_TOKEN=$(echo $CREDENTIALS | jq -r '.Credentials.SessionToken')
EXPIRATION=$(echo $CREDENTIALS | jq -r '.Credentials.Expiration')

# Créer profil temporaire
aws configure set aws_access_key_id $ACCESS_KEY --profile scamguard-mfa
aws configure set aws_secret_access_key $SECRET_KEY --profile scamguard-mfa
aws configure set aws_session_token $SESSION_TOKEN --profile scamguard-mfa
aws configure set region us-east-1 --profile scamguard-mfa

echo ""
echo "✅ Session created successfully!"
echo "Expires: $EXPIRATION"
echo ""
echo "Usage:"
echo "  export AWS_PROFILE=scamguard-mfa"
echo "  aws sts get-caller-identity"
echo ""
echo "Or add to your shell:"
echo "  echo 'export AWS_PROFILE=scamguard-mfa' >> ~/.zshrc"
