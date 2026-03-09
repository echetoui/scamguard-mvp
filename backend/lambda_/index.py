"""Lambda entry point for ScamGuard API - Routes to appropriate handlers"""

def handler(event, context):
    """Route to appropriate handler based on path."""
    path = event.get("path", "")

    # Route family endpoints to family_handler
    if path.startswith("/api/v1/family"):
        from family_handler import lambda_handler as family_handler
        return family_handler(event, context)

    # Route tools endpoints to tools_handler
    if path.startswith("/api/v1/tools"):
        from tools_handler import lambda_handler as tools_handler
        return tools_handler(event, context)

    # Route all other endpoints to handler_llm (analysis, profile, analytics, etc.)
    from handler_llm import lambda_handler as llm_handler
    return llm_handler(event, context)


__all__ = ['handler']
