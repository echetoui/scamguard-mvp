#!/bin/bash

###############################################################################
# Phase 4.4 - Infrastructure Deployment Script
# Automates AWS Pinpoint, DynamoDB, and Lambda deployment
#
# Usage: ./deploy-phase1.sh
# Prerequisites: AWS CLI configured with 'scamguard' profile
###############################################################################

set -e  # Exit on error

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
export AWS_PROFILE="scamguard"
export REGION="us-east-1"
export APP_NAME="ScamGuard-SMS"
export STACK_NAME="scamguard-mvp"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

###############################################################################
# STEP 1: Verify AWS Credentials
###############################################################################

log "Step 1/13: Verifying AWS Credentials..."
if ! aws sts get-caller-identity --profile $AWS_PROFILE --region $REGION > /dev/null 2>&1; then
    error "AWS credentials not configured. Run: aws configure --profile scamguard"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text)
success "AWS credentials verified. Account: $ACCOUNT_ID"

###############################################################################
# STEP 2: Create Pinpoint Project
###############################################################################

log "Step 2/13: Creating AWS Pinpoint Project..."
PINPOINT_RESPONSE=$(aws pinpoint create-app \
    --profile $AWS_PROFILE \
    --region $REGION \
    --create-application-request Name="$APP_NAME",QuietTime='{Start=22:00,End=08:00}' \
    2>/dev/null || echo "")

if [ -z "$PINPOINT_RESPONSE" ]; then
    warning "Pinpoint project may already exist. Listing existing projects..."
    aws pinpoint list-apps \
        --profile $AWS_PROFILE \
        --region $REGION \
        --query "ApplicationsResponse.Item[0].Id" \
        --output text
fi

PINPOINT_PROJECT_ID=$(echo "$PINPOINT_RESPONSE" | jq -r '.ApplicationResponse.Id' 2>/dev/null || \
    aws pinpoint list-apps \
        --profile $AWS_PROFILE \
        --region $REGION \
        --query "ApplicationsResponse.Item[0].Id" \
        --output text)

if [ -z "$PINPOINT_PROJECT_ID" ] || [ "$PINPOINT_PROJECT_ID" = "None" ]; then
    error "Failed to create or find Pinpoint project"
    exit 1
fi

success "Pinpoint Project ID: $PINPOINT_PROJECT_ID"

###############################################################################
# STEP 3: Enable SMS Channel
###############################################################################

log "Step 3/13: Enabling SMS Channel in Pinpoint..."
aws pinpoint update-sms-channel \
    --profile $AWS_PROFILE \
    --application-id "$PINPOINT_PROJECT_ID" \
    --region $REGION \
    --sms-channel-request Enabled=true > /dev/null

sleep 2

SMS_ENABLED=$(aws pinpoint get-sms-channel \
    --profile $AWS_PROFILE \
    --application-id "$PINPOINT_PROJECT_ID" \
    --region $REGION \
    --query "SMSChannelResponse.Enabled" \
    --output text)

if [ "$SMS_ENABLED" = "true" ]; then
    success "SMS Channel enabled"
else
    warning "SMS Channel status: $SMS_ENABLED"
fi

###############################################################################
# STEP 4: Check SMS Spending Limit
###############################################################################

log "Step 4/13: Checking SMS Spending Limit..."
SPENDING_LIMIT=$(aws pinpoint get-account-sms-attributes \
    --profile $AWS_PROFILE \
    --region $REGION \
    --query "AttributesResponse.Attributes.MonthlySpendLimit" \
    --output text 2>/dev/null || echo "0")

if [ "$SPENDING_LIMIT" = "None" ] || [ "$SPENDING_LIMIT" = "0" ]; then
    warning "SMS spending limit not set or is $0. May need to request increase."
    warning "Request at: https://console.aws.amazon.com/support/home?region=$REGION#/case/create?issueType=service-limit-increase"
else
    success "SMS Spending Limit: \$$SPENDING_LIMIT/month"
fi

###############################################################################
# STEP 5: Update samconfig.toml
###############################################################################

log "Step 5/13: Updating samconfig.toml with Pinpoint Project ID..."

# Backup original
cp backend/samconfig.toml backend/samconfig.toml.backup

# Update PinpointProjectId
sed -i.bak "s/\"PinpointProjectId=/\"PinpointProjectId=$PINPOINT_PROJECT_ID/g" backend/samconfig.toml

# Verify update
if grep -q "PinpointProjectId=$PINPOINT_PROJECT_ID" backend/samconfig.toml; then
    success "samconfig.toml updated with Pinpoint Project ID"
else
    error "Failed to update samconfig.toml"
    exit 1
fi

###############################################################################
# STEP 6: Validate SAM Template
###############################################################################

log "Step 6/13: Validating SAM CloudFormation Template..."
if sam validate \
    --template backend/template.yaml \
    --region $REGION \
    --profile $AWS_PROFILE > /dev/null 2>&1; then
    success "SAM template is valid"
else
    error "SAM template validation failed"
    exit 1
fi

###############################################################################
# STEP 7: Build SAM Application
###############################################################################

log "Step 7/13: Building SAM Application (this may take 1-2 minutes)..."
cd backend

if sam build --region $REGION --profile $AWS_PROFILE > /dev/null 2>&1; then
    success "SAM build completed"
else
    error "SAM build failed"
    exit 1
fi

cd ..

###############################################################################
# STEP 8: Deploy CloudFormation Stack
###############################################################################

log "Step 8/13: Deploying CloudFormation Stack (this may take 5-10 minutes)..."
log "Deploying to: $STACK_NAME"

cd backend

if sam deploy \
    --region $REGION \
    --profile $AWS_PROFILE \
    --no-confirm-changeset 2>&1 | grep -q "Successfully created/updated stack"; then
    success "CloudFormation stack deployed successfully"
else
    warning "Checking deployment status..."
fi

cd ..

###############################################################################
# STEP 9: Capture Stack Outputs
###############################################################################

log "Step 9/13: Capturing CloudFormation Stack Outputs..."

# Wait for stack to be ready
sleep 5

STACK_OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --profile $AWS_PROFILE \
    --query "Stacks[0].Outputs" \
    2>/dev/null || echo "[]")

# Extract key outputs
API_ENDPOINT=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiEndpoint") | .OutputValue')
OTP_TABLE=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="OTPTableName") | .OutputValue')
LAMBDA_ARN=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="SMSOTPHandlerArn") | .OutputValue')
USER_POOL_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="UserPoolId") | .OutputValue')
USER_POOL_CLIENT=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="UserPoolClientId") | .OutputValue')

if [ -z "$API_ENDPOINT" ] || [ "$API_ENDPOINT" = "null" ]; then
    warning "Stack outputs not yet available. Waiting 10 seconds..."
    sleep 10
    STACK_OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --profile $AWS_PROFILE \
        --query "Stacks[0].Outputs")
    API_ENDPOINT=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiEndpoint") | .OutputValue')
fi

success "Stack outputs captured"

###############################################################################
# STEP 10: Verify Infrastructure
###############################################################################

log "Step 10/13: Verifying Infrastructure..."

# Check DynamoDB table
if aws dynamodb describe-table \
    --table-name ScamGuardOTP-dev \
    --region $REGION \
    --profile $AWS_PROFILE > /dev/null 2>&1; then
    success "✓ DynamoDB OTP table exists"
else
    error "DynamoDB OTP table not found"
    exit 1
fi

# Check Lambda function
if aws lambda get-function \
    --function-name scamguard-sms-otp-dev \
    --region $REGION \
    --profile $AWS_PROFILE > /dev/null 2>&1; then
    success "✓ Lambda function deployed"
else
    error "Lambda function not found"
    exit 1
fi

success "Infrastructure verification complete"

###############################################################################
# SAVE OUTPUTS TO FILE
###############################################################################

log "Saving deployment outputs to: .env.deployment"

cat > .env.deployment <<EOF
# Phase 4.4 Deployment Outputs
# Generated: $(date)

# Pinpoint
PINPOINT_PROJECT_ID=$PINPOINT_PROJECT_ID

# API Gateway
API_ENDPOINT=$API_ENDPOINT

# DynamoDB
OTP_TABLE_NAME=$OTP_TABLE

# Lambda
SMS_OTP_HANDLER_ARN=$LAMBDA_ARN

# Cognito
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_CLIENT_ID=$USER_POOL_CLIENT

# AWS Configuration
AWS_PROFILE=$AWS_PROFILE
AWS_REGION=$REGION
AWS_ACCOUNT_ID=$ACCOUNT_ID

# Stack
STACK_NAME=$STACK_NAME
EOF

success "Deployment outputs saved to .env.deployment"

###############################################################################
# DISPLAY SUMMARY
###############################################################################

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║     ✅ PHASE 1: INFRASTRUCTURE DEPLOYMENT COMPLETE       ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "📊 DEPLOYMENT SUMMARY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pinpoint Project ID: $PINPOINT_PROJECT_ID"
echo "API Endpoint:        $API_ENDPOINT"
echo "OTP Table:           $OTP_TABLE"
echo "Lambda Function:     scamguard-sms-otp-dev"
echo "Region:              $REGION"
echo "Account:             $ACCOUNT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🧪 NEXT: Test SMS Delivery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Set your phone number (E.164 format):"
echo "   export TEST_PHONE=\"+1514555XXXX\""
echo ""
echo "2. Request OTP:"
echo "   curl -X POST \"${API_ENDPOINT}api/v1/auth/request-sms-otp\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{"
echo "       \"email\": \"test@example.com\","
echo "       \"phone\": \"+1514555XXXX\","
echo "       \"password\": \"TestPass123!\""
echo "     }'"
echo ""
echo "3. Check your phone for SMS code"
echo ""
echo "4. Verify code:"
echo "   curl -X POST \"${API_ENDPOINT}api/v1/auth/verify-sms-otp\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{"
echo "       \"email\": \"test@example.com\","
echo "       \"phone\": \"+1514555XXXX\","
echo "       \"code\": \"123456\","
echo "       \"password\": \"TestPass123!\""
echo "     }'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📝 Configuration saved to: .env.deployment"
echo ""
echo "🚀 Ready for Phase 2: Backend Testing"
echo ""
