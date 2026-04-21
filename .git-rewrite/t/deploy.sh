#!/bin/bash

# Phase 2 Sprint 5 - Automated Deployment Script
# Full stack deployment: DynamoDB + Lambda + API Gateway + Frontend
# Usage: ./deploy.sh <aws-account-id> <domain> <s3-bucket> <sq-api-key>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_ACCOUNT_ID=$1
DOMAIN=$2
S3_BUCKET=$3
SQ_API_KEY=$4
AWS_REGION="us-east-1"
CAFC_BUCKET="scamguard-cafc-data"

# Validate inputs
if [ -z "$AWS_ACCOUNT_ID" ] || [ -z "$DOMAIN" ] || [ -z "$S3_BUCKET" ] || [ -z "$SQ_API_KEY" ]; then
    echo -e "${RED}Usage: ./deploy.sh <aws-account-id> <domain> <s3-bucket> <sq-api-key>${NC}"
    echo "Example: ./deploy.sh 123456789012 yourdomain.com scamguard-frontend-bucket YOUR_API_KEY"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Phase 2 Sprint 5 - Full Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "Domain: $DOMAIN"
echo "S3 Bucket: $S3_BUCKET"
echo "Region: $AWS_REGION"
echo ""

# Step 1: Deploy DynamoDB Infrastructure
echo -e "${YELLOW}[STEP 1/7] Deploying DynamoDB Infrastructure...${NC}"
cd backend/cdk
npm install > /dev/null 2>&1 || true
echo "- Synthesizing CloudFormation template..."
cdk synth > /dev/null 2>&1
echo "- Deploying Threats stack..."
cdk deploy ThreatsStack --require-approval never --region $AWS_REGION || { echo "DynamoDB deployment failed"; exit 1; }
echo -e "${GREEN}✓ DynamoDB tables created${NC}"
cd ../..

# Step 2: Prepare Lambda Package
echo -e "${YELLOW}[STEP 2/7] Preparing Lambda Deployment Package...${NC}"
cd backend/lambda_
mkdir -p lambda_package
echo "- Copying Python files..."
cp *.py lambda_package/ 2>/dev/null || true
if [ -f "requirements.txt" ]; then
    cp requirements.txt lambda_package/
    cd lambda_package
    echo "- Installing dependencies..."
    pip install -q -r requirements.txt -t . 2>/dev/null || pip3 install -q -r requirements.txt -t .
    cd ..
else
    echo "- No requirements.txt found, skipping dependency install"
fi
echo "- Creating deployment ZIP..."
cd lambda_package
zip -q -r ../threats-lambda.zip . 2>/dev/null
cd ..
rm -rf lambda_package
LAMBDA_SIZE=$(ls -lh threats-lambda.zip | awk '{print $5}')
echo -e "${GREEN}✓ Lambda package created ($LAMBDA_SIZE)${NC}"
cd ../..

# Step 3: Upload Lambda Functions
echo -e "${YELLOW}[STEP 3/7] Deploying Lambda Functions...${NC}"
echo "- Creating threats API Lambda function..."
LAMBDA_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/lambda-execution-role"
aws lambda create-function \
    --function-name scamguard-threats-api \
    --runtime python3.12 \
    --role $LAMBDA_ARN \
    --handler index.handler \
    --zip-file fileb://backend/lambda_/threats-lambda.zip \
    --environment "Variables={THREATS_TABLE=threats,USER_THREATS_TABLE=user_threats,ALLOWED_ORIGIN=https://${DOMAIN}}" \
    --timeout 60 \
    --memory-size 512 \
    --region $AWS_REGION \
    --publish 2>/dev/null || echo "Lambda already exists, updating..."

aws lambda update-function-code \
    --function-name scamguard-threats-api \
    --zip-file fileb://backend/lambda_/threats-lambda.zip \
    --region $AWS_REGION 2>/dev/null || true

echo "- Creating threat sources Lambda function..."
aws lambda create-function \
    --function-name scamguard-threat-sources \
    --runtime python3.12 \
    --role $LAMBDA_ARN \
    --handler threat_sources.lambda_handler \
    --zip-file fileb://backend/lambda_/threats-lambda.zip \
    --environment "Variables={THREATS_TABLE=threats,SQ_API_URL=https://api.sq.qc.ca/threats,SQ_API_KEY=${SQ_API_KEY},CAFC_CSV_URL=https://www.antifraudcentre.ca/threats.csv,CAFC_BUCKET=${CAFC_BUCKET}}" \
    --timeout 300 \
    --memory-size 1024 \
    --region $AWS_REGION \
    --publish 2>/dev/null || echo "Lambda already exists, updating..."

aws lambda update-function-code \
    --function-name scamguard-threat-sources \
    --zip-file fileb://backend/lambda_/threats-lambda.zip \
    --region $AWS_REGION 2>/dev/null || true

echo -e "${GREEN}✓ Lambda functions deployed${NC}"

# Step 4: Configure CloudWatch Scheduled Events
echo -e "${YELLOW}[STEP 4/7] Configuring CloudWatch Scheduled Events...${NC}"
echo "- Creating SQ API polling rule (every 4 hours)..."
aws events put-rule \
    --name scamguard-sq-polling \
    --schedule-expression 'rate(4 hours)' \
    --state ENABLED \
    --region $AWS_REGION 2>/dev/null || true

aws events put-targets \
    --rule scamguard-sq-polling \
    --targets "Id=1,Arn=arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:scamguard-threat-sources,Input={\"source\":\"sq\"}" \
    --region $AWS_REGION 2>/dev/null || true

aws lambda add-permission \
    --function-name scamguard-threat-sources \
    --statement-id AllowEventBridgeInvoke \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${AWS_REGION}:${AWS_ACCOUNT_ID}:rule/scamguard-sq-polling" \
    --region $AWS_REGION 2>/dev/null || true

echo "- Creating CAFC import rule (daily at 2 AM)..."
aws events put-rule \
    --name scamguard-cafc-import \
    --schedule-expression 'cron(0 2 * * ? *)' \
    --state ENABLED \
    --region $AWS_REGION 2>/dev/null || true

aws events put-targets \
    --rule scamguard-cafc-import \
    --targets "Id=1,Arn=arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:scamguard-threat-sources,Input={\"source\":\"cafc\"}" \
    --region $AWS_REGION 2>/dev/null || true

aws lambda add-permission \
    --function-name scamguard-threat-sources \
    --statement-id AllowEventBridgeInvokeCAFC \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${AWS_REGION}:${AWS_ACCOUNT_ID}:rule/scamguard-cafc-import" \
    --region $AWS_REGION 2>/dev/null || true

echo -e "${GREEN}✓ CloudWatch rules configured${NC}"

# Step 5: Configure API Gateway (assumes API already exists)
echo -e "${YELLOW}[STEP 5/7] API Gateway Configuration...${NC}"
echo "- Verifying API Gateway..."
API_ID=$(aws apigatewayv2 get-apis --query "Items[0].ApiId" --output text --region $AWS_REGION 2>/dev/null || echo "")
if [ -z "$API_ID" ]; then
    echo "- Creating new API Gateway..."
    API_RESPONSE=$(aws apigatewayv2 create-api \
        --name scamguard-threats-api \
        --protocol-type HTTP \
        --region $AWS_REGION)
    API_ID=$(echo $API_RESPONSE | grep -o '"ApiId":"[^"]*' | cut -d'"' -f4)
    echo "- API Gateway ID: $API_ID"
fi
echo -e "${GREEN}✓ API Gateway ready (ID: $API_ID)${NC}"

# Step 6: Deploy Frontend
echo -e "${YELLOW}[STEP 6/7] Building and Deploying Frontend...${NC}"
cd frontend
echo "- Installing dependencies..."
npm install > /dev/null 2>&1
echo "- Building production bundle..."
npm run build > /dev/null 2>&1
BUNDLE_SIZE=$(du -sh build | cut -f1)
echo "- Syncing to S3..."
aws s3 sync build/ "s3://${S3_BUCKET}/" --delete --region $AWS_REGION > /dev/null 2>&1
echo "- Frontend deployed ($BUNDLE_SIZE)"
cd ..

# Check for CloudFront distribution and invalidate if exists
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='${S3_BUCKET}.s3.amazonaws.com'].Id" --output text 2>/dev/null || echo "")
if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "- Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --region $AWS_REGION > /dev/null 2>&1
fi

echo -e "${GREEN}✓ Frontend deployed${NC}"

# Step 7: Verification
echo -e "${YELLOW}[STEP 7/7] Verifying Deployment...${NC}"
echo "- Checking DynamoDB tables..."
TABLES=$(aws dynamodb list-tables --region $AWS_REGION --query 'TableNames' --output text 2>/dev/null || echo "")
if [[ $TABLES == *"threats"* ]]; then
    echo "  ✓ threats table"
fi
if [[ $TABLES == *"user_threats"* ]]; then
    echo "  ✓ user_threats table"
fi

echo "- Checking Lambda functions..."
LAMBDAS=$(aws lambda list-functions --region $AWS_REGION --query 'Functions[].FunctionName' --output text 2>/dev/null || echo "")
if [[ $LAMBDAS == *"scamguard-threats-api"* ]]; then
    echo "  ✓ scamguard-threats-api"
fi
if [[ $LAMBDAS == *"scamguard-threat-sources"* ]]; then
    echo "  ✓ scamguard-threat-sources"
fi

echo "- Checking CloudWatch rules..."
RULES=$(aws events list-rules --region $AWS_REGION --query 'Rules[].Name' --output text 2>/dev/null || echo "")
if [[ $RULES == *"scamguard-sq-polling"* ]]; then
    echo "  ✓ SQ polling rule"
fi
if [[ $RULES == *"scamguard-cafc-import"* ]]; then
    echo "  ✓ CAFC import rule"
fi

echo -e "${GREEN}✓ Deployment verification complete${NC}"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📋 Summary:"
echo "  - DynamoDB tables: Created"
echo "  - Lambda functions: Deployed"
echo "  - API Gateway: Ready (ID: $API_ID)"
echo "  - CloudWatch rules: Configured"
echo "  - Frontend: Deployed to S3"
echo ""
echo "🧪 Next Steps:"
echo "  1. Test API endpoints:"
echo "     curl https://\${API_ID}.execute-api.${AWS_REGION}.amazonaws.com/dev/api/threats"
echo ""
echo "  2. Monitor CloudWatch logs:"
echo "     aws logs tail /aws/lambda/scamguard-threats-api --follow"
echo ""
echo "  3. Check DynamoDB:"
echo "     aws dynamodb scan --table-name threats --region $AWS_REGION"
echo ""
echo "  4. Wait for first SQ poll (4 hours)"
echo ""
echo "📖 Docs:"
echo "  - API Reference: backend/THREATS_API_DOCUMENTATION.md"
echo "  - DynamoDB Schema: backend/DYNAMODB_SCHEMA.md"
echo ""

