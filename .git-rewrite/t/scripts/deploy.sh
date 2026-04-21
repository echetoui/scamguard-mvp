#!/bin/bash
set -e

echo "🚀 ScamGuard v5.0 - Deployment Script"
echo "======================================"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

if ! command -v cdk &> /dev/null; then
    echo -e "${RED}❌ CDK not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"

echo -e "${BLUE}Checking secrets...${NC}"

if ! aws secretsmanager describe-secret --secret-id scamguard/gemini-key &> /dev/null; then
    echo -e "${RED}❌ Gemini secret not found${NC}"
    exit 1
fi

if ! aws secretsmanager describe-secret --secret-id scamguard/openai-key &> /dev/null; then
    echo -e "${RED}❌ OpenAI secret not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Secrets OK${NC}"

echo -e "${BLUE}Installing CDK dependencies...${NC}"
cd backend/cdk
pip install -r requirements.txt

echo -e "${BLUE}Checking CDK bootstrap...${NC}"
if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
    echo -e "${BLUE}Bootstrapping CDK...${NC}"
    cdk bootstrap
fi

echo -e "${BLUE}Deploying infrastructure...${NC}"
cdk deploy --require-approval never

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name ScamGuardStack \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo -e "${GREEN}🎉 ScamGuard v5.0 deployed successfully!${NC}"
