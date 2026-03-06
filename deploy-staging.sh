#!/bin/bash

################################################################################
# ScamGuard MVP - Complete Staging Deployment Script
# Deploys frontend to CloudFront + Infrastructure via CDK
# Date: 6 mars 2026
################################################################################

set -e

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║    🚀 ScamGuard MVP - Staging Deployment (Phase 5A Complete)          ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT=$(pwd)
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
BACKEND_DIR="${PROJECT_ROOT}/backend"
REGION="us-east-1"
ENVIRONMENT="staging"

# Step 1: Verify Prerequisites
echo -e "${BLUE}[Step 1/6]${NC} Verifying Prerequisites..."
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${YELLOW}⚠️  AWS credentials expired or not configured.${NC}"
    echo ""
    echo -e "${YELLOW}To authenticate with AWS:${NC}"
    echo "  aws configure"
    echo "  OR use:"
    echo "  aws sso login --profile <profile-name>"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites verified${NC}"
echo ""

# Step 2: Verify Frontend Build
echo -e "${BLUE}[Step 2/6]${NC} Verifying Frontend Build..."
if [ ! -d "${FRONTEND_DIR}/build" ]; then
    echo -e "${YELLOW}⚠️  Frontend build not found. Building now...${NC}"
    cd "${FRONTEND_DIR}"
    npm run build
    cd "${PROJECT_ROOT}"
fi

BUILD_SIZE=$(du -sh "${FRONTEND_DIR}/build" | cut -f1)
echo -e "${GREEN}✅ Frontend build ready (${BUILD_SIZE})${NC}"
echo ""

# Step 3: Get AWS Resources
echo -e "${BLUE}[Step 3/6]${NC} Retrieving AWS Resources..."

# Get S3 bucket from CDK outputs or environment
S3_BUCKET=$(aws s3 ls | grep -i "scamguard.*frontend\|staging" | awk '{print $3}' | head -1)
if [ -z "$S3_BUCKET" ]; then
    echo -e "${YELLOW}⚠️  S3 bucket not found automatically.${NC}"
    read -p "Enter S3 bucket name (or press Enter to skip frontend deploy): " S3_BUCKET
fi

# Get CloudFront distribution
CF_DISTRIBUTION=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins[0].DomainName==\`${S3_BUCKET}.s3.amazonaws.com\`].Id" --output text 2>/dev/null || echo "")
if [ -z "$CF_DISTRIBUTION" ]; then
    echo -e "${YELLOW}⚠️  CloudFront distribution not found automatically.${NC}"
    read -p "Enter CloudFront Distribution ID (or press Enter to skip cache invalidation): " CF_DISTRIBUTION
fi

echo -e "${GREEN}✅ AWS Resources identified${NC}"
if [ ! -z "$S3_BUCKET" ]; then
    echo "   S3 Bucket: $S3_BUCKET"
fi
if [ ! -z "$CF_DISTRIBUTION" ]; then
    echo "   CloudFront Distribution: $CF_DISTRIBUTION"
fi
echo ""

# Step 4: Deploy Frontend to S3
if [ ! -z "$S3_BUCKET" ]; then
    echo -e "${BLUE}[Step 4/6]${NC} Deploying Frontend to S3..."

    cd "${FRONTEND_DIR}"

    # Upload build files
    echo "Uploading files to s3://${S3_BUCKET}/"
    aws s3 sync build/ "s3://${S3_BUCKET}/" \
        --region ${REGION} \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "index.html" \
        --exclude "*.map"

    # Upload index.html with no cache
    aws s3 cp "build/index.html" "s3://${S3_BUCKET}/index.html" \
        --region ${REGION} \
        --cache-control "public, max-age=0, must-revalidate" \
        --content-type "text/html"

    echo -e "${GREEN}✅ Frontend deployed to S3${NC}"
    cd "${PROJECT_ROOT}"
    echo ""
else
    echo -e "${YELLOW}⊘ Skipped frontend deployment (S3 bucket not configured)${NC}"
    echo ""
fi

# Step 5: Invalidate CloudFront Cache
if [ ! -z "$CF_DISTRIBUTION" ]; then
    echo -e "${BLUE}[Step 5/6]${NC} Invalidating CloudFront Cache..."

    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id ${CF_DISTRIBUTION} \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)

    echo "Invalidation ID: ${INVALIDATION_ID}"
    echo "Waiting for invalidation to complete..."

    aws cloudfront wait invalidation-completed \
        --distribution-id ${CF_DISTRIBUTION} \
        --id ${INVALIDATION_ID}

    echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
    echo ""
else
    echo -e "${YELLOW}⊘ Skipped CloudFront invalidation (distribution not configured)${NC}"
    echo ""
fi

# Step 6: Deploy Infrastructure via CDK
echo -e "${BLUE}[Step 6/6]${NC} Deploying Infrastructure via CDK..."

cd "${BACKEND_DIR}"

if [ ! -f "cdk.json" ]; then
    echo -e "${RED}❌ CDK configuration not found (cdk.json)${NC}"
    exit 1
fi

echo "Installing CDK dependencies..."
pip install aws-cdk-lib constructs boto3 -q

echo "Deploying CDK stack..."
cdk deploy \
    --region ${REGION} \
    --require-approval never \
    --progress events

echo -e "${GREEN}✅ Infrastructure deployed via CDK${NC}"
cd "${PROJECT_ROOT}"
echo ""

# Final Summary
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo -e "║ ${GREEN}✅ DEPLOYMENT COMPLETE${NC}                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -z "$CF_DISTRIBUTION" ]; then
    CLOUDFRONT_URL="https://$(aws cloudfront get-distribution --id ${CF_DISTRIBUTION} --query 'Distribution.DomainName' --output text 2>/dev/null)"
    echo -e "Frontend URL: ${BLUE}${CLOUDFRONT_URL}${NC}"
    echo ""
fi

echo "🔍 Next Steps:"
echo "  1. Verify deployment: Visit the CloudFront URL above"
echo "  2. Check console for errors (should be empty)"
echo "  3. Test accessibility with VoiceOver (Cmd+F5 on macOS)"
echo "  4. Run E2E tests: npx playwright test"
echo ""
echo "📊 Post-Deployment Verification:"
echo "  • Page loads without errors"
echo "  • Both buttons visible (✏️ and 🎓)"
echo "  • Descriptions displayed below buttons"
echo "  • Tab navigation works (focus outline visible)"
echo "  • Responsive on mobile (test at 360px width)"
echo ""
echo "📚 Documentation:"
echo "  • Accessibility: SCREEN_READER_TESTING.md"
echo "  • Deployment: STAGING_DEPLOYMENT_PLAN.md"
echo "  • Phase 5A: instructions.md"
echo ""
echo "🚀 Phase 5B (Next):"
echo "  • Scam Reporting System with LLM analysis"
echo "  • Image upload and threat creation"
echo ""

