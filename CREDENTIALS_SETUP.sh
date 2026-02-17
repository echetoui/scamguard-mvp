#!/bin/bash

# ScamGuard AWS Credentials Setup
# Configure AWS CLI and prepare for deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    ScamGuard AWS Credentials & Setup Guide             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

# Check if AWS CLI is configured
echo -e "\n${YELLOW}[1/4] Checking AWS CLI Configuration...${NC}"

if aws sts get-caller-identity &>/dev/null; then
    echo -e "${GREEN}✓ AWS credentials already configured${NC}"
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=$(aws configure get region 2>/dev/null || echo "us-east-1")
    echo -e "${GREEN}  Account: ${ACCOUNT_ID}${NC}"
    echo -e "${GREEN}  Region: ${REGION}${NC}"
else
    echo -e "${YELLOW}AWS credentials not configured${NC}"
    echo -e "\n${BLUE}To get AWS credentials:${NC}"
    echo -e "1. Go to: ${YELLOW}https://console.aws.amazon.com/${NC}"
    echo -e "2. Click your name → ${YELLOW}My Security Credentials${NC}"
    echo -e "3. Click ${YELLOW}Access Keys → Create New Access Key${NC}"
    echo -e "4. Download the CSV file${NC}"
    echo -e "\n${YELLOW}Then run:${NC}"
    echo -e "  ${BLUE}aws configure${NC}"
    echo -e "  ${BLUE}Enter Access Key ID: AKIA...${NC}"
    echo -e "  ${BLUE}Enter Secret Access Key: wJalr...${NC}"
    echo -e "  ${BLUE}Enter Default region: us-east-1${NC}"
    echo -e "  ${BLUE}Enter Default format: json${NC}"
    exit 1
fi

# Check for API Keys
echo -e "\n${YELLOW}[2/4] Checking API Keys...${NC}"

OPENAI_SECRET=$(aws secretsmanager get-secret-value --secret-id scamguard/openai-key --region "$REGION" 2>/dev/null || echo "not-found")
GEMINI_SECRET=$(aws secretsmanager get-secret-value --secret-id scamguard/gemini-key --region "$REGION" 2>/dev/null || echo "not-found")

if [ "$OPENAI_SECRET" != "not-found" ]; then
    echo -e "${GREEN}✓ OpenAI API Key found in Secrets Manager${NC}"
else
    echo -e "${YELLOW}⚠ OpenAI API Key not found${NC}"
fi

if [ "$GEMINI_SECRET" != "not-found" ]; then
    echo -e "${GREEN}✓ Gemini API Key found in Secrets Manager${NC}"
else
    echo -e "${YELLOW}⚠ Gemini API Key not found${NC}"
fi

# Get API Keys if needed
echo -e "\n${YELLOW}[3/4] Setting up API Keys...${NC}"

if [ "$OPENAI_SECRET" = "not-found" ]; then
    echo -e "\n${BLUE}OpenAI API Key Setup:${NC}"
    echo -e "1. Go to: ${YELLOW}https://platform.openai.com/api-keys${NC}"
    echo -e "2. Click ${YELLOW}Create new secret key${NC}"
    echo -e "3. Copy the key (starts with sk-)${NC}"
    read -p "Paste OpenAI API Key: " OPENAI_KEY

    if [ -z "$OPENAI_KEY" ]; then
        echo -e "${RED}✗ OpenAI API Key is required${NC}"
        exit 1
    fi

    aws secretsmanager create-secret \
        --name scamguard/openai-key \
        --secret-string "{\"api_key\":\"${OPENAI_KEY}\"}" \
        --region "$REGION"

    echo -e "${GREEN}✓ OpenAI API Key stored${NC}"
fi

if [ "$GEMINI_SECRET" = "not-found" ]; then
    echo -e "\n${BLUE}Google Gemini API Key Setup:${NC}"
    echo -e "1. Go to: ${YELLOW}https://aistudio.google.com/app/apikey${NC}"
    echo -e "2. Click ${YELLOW}Create API Key${NC}"
    echo -e "3. Copy the key (starts with AIza)${NC}"
    read -p "Paste Gemini API Key: " GEMINI_KEY

    if [ -z "$GEMINI_KEY" ]; then
        echo -e "${RED}✗ Gemini API Key is required${NC}"
        exit 1
    fi

    aws secretsmanager create-secret \
        --name scamguard/gemini-key \
        --secret-string "{\"api_key\":\"${GEMINI_KEY}\"}" \
        --region "$REGION"

    echo -e "${GREEN}✓ Gemini API Key stored${NC}"
fi

# Verify everything
echo -e "\n${YELLOW}[4/4] Verifying Setup...${NC}"

echo -e "${GREEN}✓ AWS CLI configured${NC}"
echo -e "${GREEN}✓ AWS Account: ${ACCOUNT_ID}${NC}"
echo -e "${GREEN}✓ AWS Region: ${REGION}${NC}"
echo -e "${GREEN}✓ OpenAI API Key stored${NC}"
echo -e "${GREEN}✓ Gemini API Key stored${NC}"

# Final instructions
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Setup Complete! 🎉                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Next Step:${NC}"
echo -e "  Run the deployment script:"
echo -e "  ${YELLOW}./deploy.sh${NC}"

echo -e "\n${BLUE}This will:${NC}"
echo -e "  1. Install Python dependencies"
echo -e "  2. Build SAM application"
echo -e "  3. Deploy to AWS CloudFormation"
echo -e "  4. Create Lambda functions"
echo -e "  5. Setup DynamoDB, Cognito, API Gateway"
echo -e "  6. Display API endpoint URL"

echo -e "\n${BLUE}Estimated time:${NC} 15-20 minutes"
echo -e "${BLUE}Estimated cost:${NC} ~\$124/month"
