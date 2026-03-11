"""Lambda entry point for ScamGuard API - Routes to appropriate handlers"""
import json

def handler(event, context):
    """Route to appropriate handler based on path."""
    try:
        path = event.get("path", "")

        # SMS OTP endpoints
        if "/auth/request-sms-otp" in path or "/auth/verify-sms-otp" in path:
            from sms_otp_handler import lambda_handler as sms_handler
            return sms_handler(event, context)

        # Family endpoints
        if "/family" in path:
            from family_handler import lambda_handler as family_handler
            return family_handler(event, context)

        # Tools endpoints
        if "/tools" in path:
            from tools_handler import lambda_handler as tools_handler
            return tools_handler(event, context)

        # Default: LLM handler
        from handler_llm import lambda_handler as llm_handler
        return llm_handler(event, context)

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {'Content-Type': 'application/json'}
        }


__all__ = ['handler']
