#!/bin/bash

# Load Test Suite Runner
# Executes all K6 load tests and generates comprehensive report

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="load-test-results-${TIMESTAMP}"
API_URL="${BASE_URL:-https://mzkwpdt7m3.execute-api.us-east-1.amazonaws.com/staging/api/v1}"

echo "🚀 ScamGuard Load Testing Suite"
echo "=================================="
echo "Timestamp: $(date)"
echo "API URL: $API_URL"
echo "Results Directory: $RESULTS_DIR"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Test 1: Simple Load Test (warm-up)
echo "📊 Test 1: Simple Concurrent Load Test (10-100 VUs, 2 minutes)"
echo "-----------------------------------------------------------"
k6 run frontend/tests/load/load-simple.js \
  --vus 10 \
  --duration 2m \
  -o json="${RESULTS_DIR}/test-1-simple.json" \
  2>&1 | tee "${RESULTS_DIR}/test-1-simple.log"

echo ""
echo "✅ Test 1 Complete"
sleep 10

# Test 2: Login Load Test
echo "📊 Test 2: Login Load Test (increasing to 100 VUs)"
echo "---------------------------------------------------"
k6 run frontend/tests/load/load-logins.js \
  --stage '1m:100' \
  -o json="${RESULTS_DIR}/test-2-logins.json" \
  2>&1 | tee "${RESULTS_DIR}/test-2-logins.log"

echo ""
echo "✅ Test 2 Complete"
sleep 10

# Test 3: Signup Load Test
echo "📊 Test 3: Signup Load Test (50-500 VUs)"
echo "----------------------------------------"
k6 run frontend/tests/load/load-signups.js \
  -o json="${RESULTS_DIR}/test-3-signups.json" \
  2>&1 | tee "${RESULTS_DIR}/test-3-signups.log"

echo ""
echo "✅ Test 3 Complete"
sleep 10

# Test 4: Mixed Load Test (most realistic)
echo "📊 Test 4: Mixed Load Test (realistic traffic, 100-500 VUs)"
echo "-----------------------------------------------------------"
k6 run frontend/tests/load/load-mixed.js \
  -o json="${RESULTS_DIR}/test-4-mixed.json" \
  2>&1 | tee "${RESULTS_DIR}/test-4-mixed.log"

echo ""
echo "✅ Test 4 Complete"
sleep 5

# Summary
echo ""
echo "📈 Load Test Execution Summary"
echo "=============================="
echo "All tests completed: $(date)"
echo "Results saved to: $RESULTS_DIR"
echo ""
echo "📁 Generated files:"
ls -lh "$RESULTS_DIR"
echo ""
echo "✨ Load testing complete!"
