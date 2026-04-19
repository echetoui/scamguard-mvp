#!/usr/bin/env bash
# =============================================================================
# ScamGuard MVP - Apply PostgreSQL Schema to Aurora
# Phase 2, Day 6-7
#
# Usage:
#   ./apply_schema.sh
#
# Prerequisites:
#   - Aurora stack deployed (cdk deploy AuroraStack --profile scamguard-dev)
#   - psql installed locally
#   - AWS credentials configured (profile: scamguard-dev)
#   - SSM Session Manager plugin installed (for VPC tunnel approach) OR
#     public accessibility enabled temporarily on the cluster
#
# This script:
#   1. Fetches Aurora endpoint and credentials from CloudFormation + Secrets Manager
#   2. Applies backend/scripts/schema.sql via psql
#   3. Verifies all tables were created
#
# NOTE: Aurora is in private subnets. To connect from a laptop you need either:
#   Option A (recommended): AWS SSM port forwarding via a bastion EC2 in the VPC
#   Option B: Lambda-based schema runner (see apply_schema_lambda.py)
#   Option C (dev only): Temporarily allow public access via a security group rule
# =============================================================================
set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-scamguard-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="AuroraStack"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="${SCRIPT_DIR}/schema.sql"

echo "=== ScamGuard Aurora Schema Application ==="
echo "Stack:   ${STACK_NAME}"
echo "Region:  ${AWS_REGION}"
echo "Profile: ${AWS_PROFILE}"
echo ""

# ─── Step 1: Get CloudFormation outputs ──────────────────────────────────────
echo "[1/4] Fetching CloudFormation outputs..."

AURORA_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --profile "${AWS_PROFILE}" \
    --region "${AWS_REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`ClusterEndpoint`].OutputValue' \
    --output text)

SECRET_ARN=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --profile "${AWS_PROFILE}" \
    --region "${AWS_REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`SecretArn`].OutputValue' \
    --output text)

if [[ -z "${AURORA_ENDPOINT}" || -z "${SECRET_ARN}" ]]; then
    echo "ERROR: Could not retrieve Aurora endpoint or secret ARN from CloudFormation."
    echo "       Ensure AuroraStack is deployed and CREATE_COMPLETE."
    exit 1
fi

echo "  Endpoint: ${AURORA_ENDPOINT}"
echo "  SecretARN: ${SECRET_ARN}"

# ─── Step 2: Retrieve credentials from Secrets Manager ───────────────────────
echo "[2/4] Retrieving credentials from Secrets Manager..."

SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "${SECRET_ARN}" \
    --profile "${AWS_PROFILE}" \
    --region "${AWS_REGION}" \
    --query 'SecretString' \
    --output text)

DB_USER=$(echo "${SECRET_JSON}" | python3 -c "import sys,json; print(json.load(sys.stdin)['username'])")
DB_PASS=$(echo "${SECRET_JSON}" | python3 -c "import sys,json; print(json.load(sys.stdin)['password'])")
DB_NAME="scamguard"

echo "  User: ${DB_USER}"
echo "  Database: ${DB_NAME}"

# ─── Step 3: Apply schema ─────────────────────────────────────────────────────
echo "[3/4] Applying schema.sql..."
echo "  IMPORTANT: Aurora is in private subnets."
echo "  This requires a VPC tunnel or SSM port-forwarding session."
echo "  If psql hangs, Aurora is not reachable — set up tunnel first."
echo ""

PGPASSWORD="${DB_PASS}" psql \
    --host="${AURORA_ENDPOINT}" \
    --port=5432 \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --file="${SCHEMA_FILE}" \
    --echo-errors \
    --set ON_ERROR_STOP=1

echo ""
echo "[4/4] Verifying tables..."
PGPASSWORD="${DB_PASS}" psql \
    --host="${AURORA_ENDPOINT}" \
    --port=5432 \
    --username="${DB_USER}" \
    --dbname="${DB_NAME}" \
    --tuples-only \
    --command="
        SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)))
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    "

echo ""
echo "=== Schema application complete ==="
