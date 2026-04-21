#!/bin/bash

export PYTHONPATH=/Users/echetoui/scamguard-mvp/backend/lambda
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=testing
export AWS_SECRET_ACCESS_KEY=testing

./venv2/bin/pytest tests/test_compliance_rules.py -v --tb=short -x
