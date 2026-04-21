#!/usr/bin/env bash
# =============================================================================
# ScamGuard Lambda Smoke Test — Phase 3
#
# Invokes each Lambda handler via SAM local invoke using the test events in
# events/. Validates that handlers parse events and return valid JSON without
# unhandled Python exceptions.
#
# Prerequisites:
#   - AWS SAM CLI installed (sam --version)
#   - Docker Desktop running (SAM local uses a Lambda container)
#   - AWS credentials configured for scamguard-dev profile
#     (used to pull Secrets Manager secret; or set AURORA_SECRET_ARN to empty
#      and let db.py fail gracefully so routing tests still pass)
#
# Usage:
#   chmod +x smoke_test.sh
#   ./smoke_test.sh [--no-db]
#
# --no-db: Overrides AURORA_SECRET_ARN to empty string so DB calls fail fast
#          without blocking routing tests. Handler should still return valid
#          JSON (internal error) rather than crashing.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/template.yaml"
ENV_FILE="$SCRIPT_DIR/env.json"
EVENTS_DIR="$SCRIPT_DIR/events"
PASS=0
FAIL=0
ERRORS=()

# Colour helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

NO_DB=false
for arg in "$@"; do
  [[ "$arg" == "--no-db" ]] && NO_DB=true
done

if $NO_DB; then
  echo -e "${YELLOW}[INFO] --no-db: DB calls will fail gracefully (testing routing only)${NC}"
  # Temporarily override secret ARN to trigger fast failure in db.py
  export AURORA_SECRET_ARN=""
fi

# Check SAM CLI
if ! command -v sam &>/dev/null; then
  echo -e "${RED}[ERROR] AWS SAM CLI not found. Install: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html${NC}"
  exit 1
fi

echo ""
echo "======================================================================"
echo " ScamGuard Phase 3 Lambda Smoke Tests"
echo "======================================================================"
echo ""

run_test() {
  local function_name="$1"
  local event_file="$2"
  local description="$3"

  echo -n "  Testing [$description] ... "

  local output
  output=$(sam local invoke "$function_name" \
    --template-file "$TEMPLATE" \
    --event "$event_file" \
    --env-vars "$ENV_FILE" \
    --profile scamguard-dev \
    --no-event 2>/dev/null || true)

  # Validate output is JSON with a statusCode
  if echo "$output" | python3 -c "
import sys, json
data = json.load(sys.stdin)
assert 'statusCode' in data, 'Missing statusCode'
code = int(data['statusCode'])
# Accept 200/201/400/401/404/500 — all are valid handler responses (not crashes)
assert code in (200, 201, 400, 401, 403, 404, 500), f'Unexpected statusCode {code}'
" 2>/dev/null; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++)) || true
  else
    echo -e "${RED}FAIL${NC}"
    ERRORS+=("$description: invalid or missing JSON response")
    ((FAIL++)) || true
    if [[ -n "$output" ]]; then
      echo "    Output: ${output:0:200}"
    fi
  fi
}

# ---------------------------------------------------------------------------
# SmsAuthHandler
# ---------------------------------------------------------------------------
echo "--- SmsAuthHandler ---"
run_test "SmsAuthHandler" \
  "$EVENTS_DIR/auth_request_otp.json" \
  "POST /api/v1/auth/request-sms-otp"

run_test "SmsAuthHandler" \
  "$EVENTS_DIR/auth_verify_otp.json" \
  "POST /api/v1/auth/verify-sms-otp (invalid OTP expected)"

# ---------------------------------------------------------------------------
# ThreatsHandler
# ---------------------------------------------------------------------------
echo ""
echo "--- ThreatsHandler ---"
run_test "ThreatsHandler" \
  "$EVENTS_DIR/threats_list.json" \
  "GET /api/v1/threats"

run_test "ThreatsHandler" \
  "$EVENTS_DIR/threats_match.json" \
  "POST /api/v1/threats/match"

# ---------------------------------------------------------------------------
# FamilyHandler
# ---------------------------------------------------------------------------
echo ""
echo "--- FamilyHandler ---"
run_test "FamilyHandler" \
  "$EVENTS_DIR/family_create.json" \
  "POST /api/v1/family/create"

# ---------------------------------------------------------------------------
# ReportsToolsHandler
# ---------------------------------------------------------------------------
echo ""
echo "--- ReportsToolsHandler ---"
run_test "ReportsToolsHandler" \
  "$EVENTS_DIR/report_submit.json" \
  "POST /api/v1/reports"

run_test "ReportsToolsHandler" \
  "$EVENTS_DIR/tools_check_email.json" \
  "POST /api/v1/tools/check-email"

run_test "ReportsToolsHandler" \
  "$EVENTS_DIR/tools_check_advisor.json" \
  "POST /api/v1/tools/check-advisor"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "======================================================================"
echo " Results: ${PASS} passed, ${FAIL} failed"
echo "======================================================================"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo ""
  echo "Failures:"
  for err in "${ERRORS[@]}"; do
    echo -e "  ${RED}x${NC} $err"
  done
  echo ""
  exit 1
fi

echo ""
echo -e "${GREEN}All smoke tests passed.${NC}"
exit 0
