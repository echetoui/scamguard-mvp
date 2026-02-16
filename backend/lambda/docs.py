"""API documentation handlers (Swagger UI, OpenAPI spec)."""

import json
import yaml
import os
from pathlib import Path

# Load OpenAPI spec
OPENAPI_PATH = os.path.join(os.path.dirname(__file__), "../openapi.yaml")


def load_openapi_spec() -> dict:
    """Load and parse OpenAPI spec."""
    try:
        with open(OPENAPI_PATH, "r") as f:
            return yaml.safe_load(f)
    except Exception:
        # Fallback to minimal spec if file not found
        return {
            "openapi": "3.0.0",
            "info": {"title": "ScamGuard API", "version": "1.0.0"},
            "paths": {},
        }


def swagger_ui_handler(event, context):
    """GET /api/docs - Swagger UI."""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>ScamGuard API</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui.css">
        <style>
            html {
                box-sizing: border-box;
                overflow: -moz-scrollbars-vertical;
                overflow-y: scroll;
            }
            *, *:before, *:after {
                box-sizing: inherit;
            }
            body {
                margin: 0;
                padding: 0;
            }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui-standalone-preset.js"></script>
        <script>
            const ui = SwaggerUIBundle({
                url: "/api/openapi.json",
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout",
                requestInterceptor: (request) => {
                    request.headers['Authorization'] = 'Bearer YOUR_TOKEN_HERE';
                    return request;
                }
            });
            window.ui = ui;
        </script>
    </body>
    </html>
    """
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/html",
        },
        "body": html,
    }


def openapi_json_handler(event, context):
    """GET /api/openapi.json - OpenAPI spec (JSON)."""
    spec = load_openapi_spec()
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": json.dumps(spec),
    }


def openapi_yaml_handler(event, context):
    """GET /api/openapi.yaml - OpenAPI spec (YAML)."""
    with open(OPENAPI_PATH, "r") as f:
        spec = f.read()

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/yaml",
        },
        "body": spec,
    }


def health_check_handler(event, context):
    """GET /health - Health check."""
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": json.dumps({
            "status": "healthy",
            "version": "1.0.0",
            "environment": os.environ.get("ENVIRONMENT", "unknown"),
        }),
    }
