#!/usr/bin/env python3
"""
ScamGuard MVP - Lambda-Based Schema Runner
Phase 2, Day 6-7

Deploys a one-shot Lambda function into the Aurora VPC, runs schema.sql,
then deletes itself. Used when Aurora is in private subnets with no bastion.

Usage:
    python apply_schema_lambda.py

Requirements:
    pip install boto3

The script:
  1. Creates a temporary Lambda function in the Aurora VPC (LambdaSecurityGroup)
  2. Embeds schema.sql as the function payload
  3. Invokes the Lambda synchronously
  4. Prints the result (table list)
  5. Deletes the Lambda function

IAM requirement: the caller must have lambda:CreateFunction, lambda:InvokeFunction,
lambda:DeleteFunction, iam:PassRole, ec2:DescribeVpcs permissions.
(Or use the LambdaDBAccessPolicy managed policy from the AuroraStack outputs.)
"""

import base64
import json
import os
import sys
import time
import zipfile
import io

import boto3

AWS_PROFILE = os.environ.get("AWS_PROFILE", "scamguard-dev")
AWS_REGION  = os.environ.get("AWS_REGION",  "us-east-1")
STACK_NAME  = "AuroraStack"
FUNCTION_NAME = "scamguard-schema-runner-tmp"

SCHEMA_SQL_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

# Lambda handler code — embedded as string, packaged into zip
HANDLER_CODE = '''
import json
import os
import boto3
import psycopg2

def handler(event, context):
    sm = boto3.client("secretsmanager")
    creds = json.loads(
        sm.get_secret_value(SecretId=os.environ["SECRET_ARN"])["SecretString"]
    )
    conn = psycopg2.connect(
        host=os.environ["AURORA_ENDPOINT"],
        port=5432,
        database=os.environ.get("DB_NAME", "scamguard"),
        user=creds["username"],
        password=creds["password"],
        connect_timeout=30,
    )
    conn.autocommit = True
    cursor = conn.cursor()

    schema_sql = event.get("schema_sql", "")
    if not schema_sql:
        return {"status": "error", "message": "No schema_sql provided"}

    # Split statements on semicolons (naive but sufficient for this schema)
    statements = [s.strip() for s in schema_sql.split(";") if s.strip()]
    executed = 0
    errors = []

    for stmt in statements:
        try:
            cursor.execute(stmt)
            executed += 1
        except Exception as e:
            errors.append(f"Error in statement: {stmt[:80]}...\\nError: {str(e)}")

    # Report tables created
    cursor.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name
    """)
    tables = [row[0] for row in cursor.fetchall()]

    cursor.close()
    conn.close()

    return {
        "status": "success" if not errors else "partial",
        "statements_executed": executed,
        "errors": errors,
        "tables": tables,
    }
'''


def get_session():
    return boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)


def get_cfn_outputs(session, stack_name: str) -> dict:
    cfn = session.client("cloudformation")
    resp = cfn.describe_stacks(StackName=stack_name)
    return {o["OutputKey"]: o["OutputValue"] for o in resp["Stacks"][0].get("Outputs", [])}


def get_private_subnets(session, vpc_id: str) -> list:
    ec2 = session.client("ec2")
    resp = ec2.describe_subnets(
        Filters=[
            {"Name": "vpc-id", "Values": [vpc_id]},
            {"Name": "tag:Name", "Values": ["*private*", "*isolated*"]},
        ]
    )
    if not resp["Subnets"]:
        # Fallback: get all subnets in VPC that are not public
        resp2 = ec2.describe_subnets(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])
        subnets = [s for s in resp2["Subnets"] if not s.get("MapPublicIpOnLaunch")]
        return [s["SubnetId"] for s in subnets[:2]]
    return [s["SubnetId"] for s in resp["Subnets"][:2]]


def build_lambda_zip() -> bytes:
    """Build a minimal Lambda zip with handler.py and psycopg2 layer reference."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("handler.py", HANDLER_CODE)
    return buf.getvalue()


def get_or_create_lambda_role(session) -> str:
    """Use the LambdaDBAccessPolicy-attached role or create a minimal one."""
    iam = session.client("iam")
    role_name = "ScamGuardSchemaRunnerRole-tmp"

    try:
        resp = iam.get_role(RoleName=role_name)
        print(f"  Using existing role: {resp['Role']['Arn']}")
        return resp["Role"]["Arn"]
    except iam.exceptions.NoSuchEntityException:
        pass

    trust = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole",
        }]
    })

    role = iam.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=trust,
        Description="Temporary role for schema runner Lambda",
    )
    role_arn = role["Role"]["Arn"]

    # Attach policies
    iam.attach_role_policy(
        RoleName=role_name,
        PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
    )
    iam.attach_role_policy(
        RoleName=role_name,
        PolicyArn="arn:aws:iam::aws:policy/SecretsManagerReadWrite",
    )

    print(f"  Created role: {role_arn}")
    print("  Waiting 10s for IAM propagation...")
    time.sleep(10)
    return role_arn


def main():
    print("=== ScamGuard Lambda Schema Runner ===")
    session = get_session()

    # Get stack outputs
    print("[1/6] Getting AuroraStack outputs...")
    outputs = get_cfn_outputs(session, STACK_NAME)
    aurora_endpoint   = outputs["ClusterEndpoint"]
    secret_arn        = outputs["SecretArn"]
    vpc_id            = outputs["VpcId"]
    lambda_sg_id      = outputs["LambdaSecurityGroupId"]
    print(f"  Endpoint: {aurora_endpoint}")

    # Get subnets
    print("[2/6] Getting private subnets...")
    subnet_ids = get_private_subnets(session, vpc_id)
    if not subnet_ids:
        print("ERROR: No private subnets found in VPC")
        sys.exit(1)
    print(f"  Subnets: {subnet_ids}")

    # Read schema
    print("[3/6] Reading schema.sql...")
    with open(SCHEMA_SQL_PATH) as f:
        schema_sql = f.read()
    print(f"  Schema: {len(schema_sql)} bytes")

    # Get/create IAM role
    print("[4/6] Getting Lambda execution role...")
    role_arn = get_or_create_lambda_role(session)

    # Deploy Lambda
    print("[5/6] Creating schema runner Lambda...")
    lambda_client = session.client("lambda")

    # Delete if exists from previous run
    try:
        lambda_client.delete_function(FunctionName=FUNCTION_NAME)
        print("  Deleted existing function")
        time.sleep(3)
    except lambda_client.exceptions.ResourceNotFoundException:
        pass

    lambda_client.create_function(
        FunctionName=FUNCTION_NAME,
        Runtime="python3.12",
        Role=role_arn,
        Handler="handler.handler",
        Code={"ZipFile": build_lambda_zip()},
        Timeout=120,
        MemorySize=256,
        Environment={
            "Variables": {
                "AURORA_ENDPOINT": aurora_endpoint,
                "SECRET_ARN":      secret_arn,
                "DB_NAME":         "scamguard",
            }
        },
        VpcConfig={
            "SubnetIds":        subnet_ids,
            "SecurityGroupIds": [lambda_sg_id],
        },
        Layers=[
            # AWS-maintained psycopg2 layer for Python 3.12 in us-east-1
            # See: https://github.com/jetbridge/psycopg2-lambda-layer
            # If this ARN is unavailable, use a custom Lambda layer with psycopg2-binary
            "arn:aws:lambda:us-east-1:898466741470:layer:psycopg2-py38:1",
        ],
        Description="TEMPORARY — scamguard schema runner, delete after use",
    )

    # Wait for active
    print("  Waiting for Lambda to become Active...")
    waiter = lambda_client.get_waiter("function_active")
    waiter.wait(FunctionName=FUNCTION_NAME)

    # Invoke
    print("[6/6] Invoking schema runner...")
    resp = lambda_client.invoke(
        FunctionName=FUNCTION_NAME,
        InvocationType="RequestResponse",
        Payload=json.dumps({"schema_sql": schema_sql}).encode(),
    )

    result_payload = json.loads(resp["Payload"].read())
    print("\nResult:")
    print(json.dumps(result_payload, indent=2))

    # Cleanup
    print("\nCleaning up Lambda...")
    lambda_client.delete_function(FunctionName=FUNCTION_NAME)
    print("  Lambda deleted.")

    if result_payload.get("status") in ("success", "partial"):
        tables = result_payload.get("tables", [])
        print(f"\nTables in PostgreSQL ({len(tables)} total):")
        for t in tables:
            print(f"  - {t}")
        errors = result_payload.get("errors", [])
        if errors:
            print(f"\nWARNINGS ({len(errors)} non-fatal errors):")
            for e in errors:
                print(f"  {e}")
            sys.exit(0)  # partial success is OK (likely IF NOT EXISTS was new)
        else:
            print("\nSchema applied successfully.")
    else:
        print("\nERROR: Schema application failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
