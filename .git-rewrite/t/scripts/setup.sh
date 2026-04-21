#!/bin/bash
set -e

echo "🛡️ ScamGuard v5.0 - Initial Setup"
echo "=================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${YELLOW}⚠️  This script is optimized for macOS${NC}"
fi

if ! command -v brew &> /dev/null; then
    echo -e "${BLUE}Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

if ! command -v aws &> /dev/null; then
    echo -e "${BLUE}Installing AWS CLI...${NC}"
    brew install awscli
fi

if ! command -v node &> /dev/null; then
    echo -e "${BLUE}Installing Node.js...${NC}"
    brew install node
fi

if ! command -v cdk &> /dev/null; then
    echo -e "${BLUE}Installing AWS CDK...${NC}"
    npm install -g aws-cdk
fi

echo -e "${BLUE}Installing Python dependencies...${NC}"
pip3 install --upgrade pip
pip3 install boto3 pytest pytest-cov

if [ ! -f ~/.aws/credentials ]; then
    echo -e "${YELLOW}AWS credentials not found. Configuring...${NC}"
    aws configure
else
    echo -e "${GREEN}✅ AWS credentials found${NC}"
fi

echo ""
echo -e "${YELLOW}📝 API Keys Setup${NC}"
echo "You need API keys for:"
echo "  1. Google Gemini: https://ai.google.dev/"
echo "  2. OpenAI: https://platform.openai.com/"
echo ""

read -p "Do you have your API keys ready? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Gemini API Key: " GEMINI_KEY
    read -p "Enter OpenAI API Key: " OPENAI_KEY
    
    echo -e "${BLUE}Creating secrets in AWS Secrets Manager...${NC}"
    
    aws secretsmanager create-secret \
        --name scamguard/gemini-key \
        --secret-string "$GEMINI_KEY" \
        --description "Gemini API Key for ScamGuard" \
        2>/dev/null || \
    aws secretsmanager update-secret \
        --secret-id scamguard/gemini-key \
        --secret-string "$GEMINI_KEY"
    
    aws secretsmanager create-secret \
        --name scamguard/openai-key \
        --secret-string "$OPENAI_KEY" \
        --description "OpenAI API Key for ScamGuard" \
        2>/dev/null || \
    aws secretsmanager update-secret \
        --secret-id scamguard/openai-key \
        --secret-string "$OPENAI_KEY"
    
    echo -e "${GREEN}✅ Secrets created${NC}"
else
    echo -e "${YELLOW}⚠️  Please create secrets manually${NC}"
fi

echo -e "${BLUE}Creating Python virtual environment...${NC}"
cd backend/cdk
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. cd backend/cdk"
echo "  2. source .venv/bin/activate"
echo "  3. cdk bootstrap"
echo "  4. cdk deploy"
