#!/bin/bash

# ScamGuard AWS Deployment Script
# Automates SAM build and deployment to AWS Lambda

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          ScamGuard AWS Lambda Deployment              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

# Check prerequisites
echo -e "\n${YELLOW}[1/7] Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI not found. Install: https://aws.amazon.com/cli/${NC}"
    exit 1
fi

if ! command -v sam &> /dev/null; then
    echo -e "${RED}✗ SAM CLI not found. Install: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Install: https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3.12+ not found. Install: https://www.python.org/downloads/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"

# Verify AWS credentials
echo -e "\n${YELLOW}[2/7] Verifying AWS credentials...${NC}"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) || {
    echo -e "${RED}✗ AWS credentials not configured. Run: aws configure${NC}"
    exit 1
}

AWS_REGION=$(aws configure get region 2>/dev/null || echo "us-east-1")
echo -e "${GREEN}✓ AWS Account: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${GREEN}✓ AWS Region: ${AWS_REGION}${NC}"

# Create S3 bucket for artifacts
echo -e "\n${YELLOW}[3/7] Setting up S3 bucket for artifacts...${NC}"

BUCKET_NAME="scamguard-deployment-artifacts-${AWS_ACCOUNT_ID}"

if aws s3 ls "s3://${BUCKET_NAME}" 2>/dev/null; then
    echo -e "${GREEN}✓ S3 bucket already exists: ${BUCKET_NAME}${NC}"
else
    echo -e "${BLUE}Creating S3 bucket: ${BUCKET_NAME}${NC}"
    aws s3 mb "s3://${BUCKET_NAME}" --region "${AWS_REGION}"
    echo -e "${GREEN}✓ S3 bucket created${NC}"
fi

# Install Python dependencies into layer
echo -e "\n${YELLOW}[4/7] Installing Python dependencies...${NC}"

cd backend
LAYER_DIR="layers/python_dependencies/python/lib/python3.12/site-packages"

if [ -d "$LAYER_DIR" ]; then
    rm -rf "$LAYER_DIR"
fi

mkdir -p "$LAYER_DIR"

pip install -q -r requirements.txt -t "$LAYER_DIR/" 2>&1 | grep -v "already satisfied" || true
echo -e "${GREEN}✓ Dependencies installed into Lambda layer${NC}"

# Build SAM application
echo -e "\n${YELLOW}[5/7] Building SAM application...${NC}"

sam build --use-container
echo -e "${GREEN}✓ SAM build complete${NC}"

# Deploy to AWS
echo -e "\n${YELLOW}[6/7] Deploying to AWS Lambda...${NC}"

read -p "Enter environment (dev/staging/prod) [dev]: " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-dev}

sam deploy \
    --stack-name "scamguard-mvp" \
    --s3-bucket "$BUCKET_NAME" \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        ImageRepoUri="public.ecr.aws/lambda/python:3.12" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --region "$AWS_REGION" \
    --no-fail-on-empty-changeset

echo -e "${GREEN}✓ Deployment complete${NC}"

# Display outputs
echo -e "\n${YELLOW}[7/7] Deployment Summary${NC}"

OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "scamguard-mvp" \
    --query 'Stacks[0].Outputs' \
    --region "$AWS_REGION" \
    --output json)

echo -e "\n${BLUE}Deployment Outputs:${NC}"
echo "$OUTPUTS" | python3 -m json.tool

# Extract key outputs
API_ENDPOINT=$(echo "$OUTPUTS" | python3 -c "import sys, json; data=json.load(sys.stdin); print([x['OutputValue'] for x in data if x['OutputKey']=='ApiEndpoint'][0])" 2>/dev/null || echo "N/A")
USER_POOL_ID=$(echo "$OUTPUTS" | python3 -c "import sys, json; data=json.load(sys.stdin); print([x['OutputValue'] for x in data if x['OutputKey']=='UserPoolId'][0])" 2>/dev/null || echo "N/A")

# Store API keys in Secrets Manager
echo -e "\n${YELLOW}Setting up API Keys in Secrets Manager...${NC}"

read -sp "Enter OpenAI API Key (sk-...): " OPENAI_KEY
echo

read -sp "Enter Google Gemini API Key (AIza...): " GEMINI_KEY
echo

# Check if secrets already exist
if aws secretsmanager get-secret-value --secret-id scamguard/openai-key --region "$AWS_REGION" 2>/dev/null; then
    aws secretsmanager update-secret \
        --secret-id scamguard/openai-key \
        --secret-string "{\"api_key\":\"${OPENAI_KEY}\"}" \
        --region "$AWS_REGION"
else
    aws secretsmanager create-secret \
        --name scamguard/openai-key \
        --secret-string "{\"api_key\":\"${OPENAI_KEY}\"}" \
        --region "$AWS_REGION"
fi

if aws secretsmanager get-secret-value --secret-id scamguard/gemini-key --region "$AWS_REGION" 2>/dev/null; then
    aws secretsmanager update-secret \
        --secret-id scamguard/gemini-key \
        --secret-string "{\"api_key\":\"${GEMINI_KEY}\"}" \
        --region "$AWS_REGION"
else
    aws secretsmanager create-secret \
        --name scamguard/gemini-key \
        --secret-string "{\"api_key\":\"${GEMINI_KEY}\"}" \
        --region "$AWS_REGION"
fi

echo -e "${GREEN}✓ API keys stored in Secrets Manager${NC}"

# Final summary
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Deployment Successful! 🎉                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "1. Test API endpoint:"
echo -e "   ${YELLOW}curl -X GET \"${API_ENDPOINT}api/v1/health\"${NC}"
echo -e "\n2. View logs:"
echo -e "   ${YELLOW}sam logs -n scamguard-handler-${ENVIRONMENT} --stack-name scamguard-mvp --tail${NC}"
echo -e "\n3. Create test user:"
echo -e "   ${YELLOW}aws cognito-idp admin-create-user --user-pool-id ${USER_POOL_ID} --username test@example.com${NC}"
echo -e "\n4. Monitor in CloudWatch:"
echo -e "   ${YELLOW}https://console.aws.amazon.com/cloudwatch${NC}"
echo -e "\n5. Monitor in X-Ray:"
echo -e "   ${YELLOW}https://console.aws.amazon.com/xray${NC}"

echo -e "\n${BLUE}Documentation:${NC}"
echo -e "   ${YELLOW}See backend/AWS_DEPLOYMENT.md for detailed guide${NC}"
