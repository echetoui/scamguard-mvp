"""Tools handler for verification utilities - Email breach and financial advisor checking."""

import json
import os
import re
import boto3
import requests

# Initialize AWS clients
ssm_client = boto3.client('ssm', region_name='us-east-1')


# Response formatting functions
def success_response(status_code, data):
    """Return standardized success response."""
    return {
        "statusCode": status_code,
        "body": json.dumps({
            "data": data
        }),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    }


def error_response(status_code, code, message):
    """Return standardized error response."""
    return {
        "statusCode": status_code,
        "body": json.dumps({
            "error": {
                "code": code,
                "message": message,
            }
        }),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    }


def get_parameter(param_name):
    """Get parameter from SSM Parameter Store."""
    try:
        response = ssm_client.get_parameter(Name=param_name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        print(f"Error getting parameter {param_name}: {e}")
        return None


def check_email_breach(event, context):
    """
    POST /api/v1/tools/check-email

    Check if email appears in known data breaches via BreachDirectory API.
    Body: { "email": "user@example.com" }

    PRIVACY NOTE: Email is not logged or persisted to DynamoDB.
    """
    try:
        body = json.loads(event.get("body", "{}"))
        email = body.get("email", "").strip()

        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
        if not email or not re.match(email_pattern, email):
            return error_response(400, "INVALID_EMAIL", "Adresse courriel invalide")

        # Get BreachDirectory API key from SSM
        api_key = get_parameter('/scamguard/breachdirectory-api-key')

        if not api_key:
            # Fallback: Return response with link to haveibeenpwned
            return success_response(200, {
                "breached": None,
                "breach_count": 0,
                "sources": [],
                "message": "⚠️ Service de vérification temporairement indisponible",
                "actions": [
                    "Vérifiez sur https://haveibeenpwned.com",
                    "Changez votre mot de passe si besoin",
                    "Activez l'authentification à deux facteurs"
                ],
                "fallback_url": "https://haveibeenpwned.com"
            })

        # Call BreachDirectory API
        response = requests.get(
            "https://breachdirectory.org/api",
            params={"func": "auto", "term": email},
            headers={
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "ScamGuard/1.0"
            },
            timeout=10
        )

        if response.status_code != 200:
            # API error - return fallback
            return success_response(200, {
                "breached": None,
                "breach_count": 0,
                "sources": [],
                "message": "⚠️ Service de vérification temporairement indisponible",
                "actions": [
                    "Vérifiez sur https://haveibeenpwned.com",
                    "Changez votre mot de passe si besoin",
                    "Activez l'authentification à deux facteurs"
                ],
                "fallback_url": "https://haveibeenpwned.com"
            })

        result = response.json()

        # Parse BreachDirectory response
        if result.get("success"):
            found = result.get("found", 0)
            sources = result.get("result", [])

            if found > 0:
                return success_response(200, {
                    "breached": True,
                    "breach_count": found,
                    "sources": sources,
                    "message": f"⚠️ Attention : votre courriel apparaît dans {found} fuite(s) de données.",
                    "actions": [
                        "Changez votre mot de passe",
                        "Activez l'authentification à deux facteurs",
                        "Vérifiez vos autres comptes"
                    ],
                    "fallback_url": "https://haveibeenpwned.com"
                })
            else:
                return success_response(200, {
                    "breached": False,
                    "breach_count": 0,
                    "sources": [],
                    "message": "✅ Bonne nouvelle : votre courriel n'apparaît pas dans nos bases de données connues.",
                    "actions": [
                        "Continuez à utiliser des mots de passe forts",
                        "Activez l'authentification à deux facteurs",
                        "Restez vigilant face aux tentatives de phishing"
                    ],
                    "fallback_url": "https://haveibeenpwned.com"
                })
        else:
            # API returned success=false
            return success_response(200, {
                "breached": None,
                "breach_count": 0,
                "sources": [],
                "message": "⚠️ Impossible de vérifier ce courriel à ce moment",
                "actions": [
                    "Réessayez plus tard",
                    "Vérifiez sur https://haveibeenpwned.com"
                ],
                "fallback_url": "https://haveibeenpwned.com"
            })

    except requests.RequestException as e:
        print(f"BreachDirectory API error: {e}")
        return success_response(200, {
            "breached": None,
            "breach_count": 0,
            "sources": [],
            "message": "⚠️ Service de vérification temporairement indisponible",
            "actions": [
                "Vérifiez sur https://haveibeenpwned.com",
                "Réessayez plus tard"
            ],
            "fallback_url": "https://haveibeenpwned.com"
        })
    except json.JSONDecodeError:
        return error_response(400, "INVALID_JSON", "Format de requête invalide")
    except Exception as e:
        print(f"Unexpected error in check_email_breach: {e}")
        return error_response(500, "INTERNAL_ERROR", "Erreur serveur interne")


def check_financial_advisor(event, context):
    """
    POST /api/v1/tools/check-advisor

    Check if a financial advisor is authorized using LLM analysis + registry links.
    Body: { "advisorName": "Jean Dupont", "firmName": "Banque XYZ" }
    """
    try:
        body = json.loads(event.get("body", "{}"))
        advisor_name = body.get("advisorName", "").strip()
        firm_name = body.get("firmName", "").strip()

        if not advisor_name:
            return error_response(400, "MISSING_NAME", "Nom du conseiller requis")

        # Try OpenAI first, fallback to Gemini, then return static response
        llm_result = None

        # Try OpenAI
        openai_key = get_parameter('/scamguard/openai-api-key')
        if openai_key:
            try:
                llm_result = query_openai(advisor_name, firm_name, openai_key)
            except Exception as e:
                print(f"OpenAI error: {e}")

        # Try Gemini if OpenAI failed
        if not llm_result:
            gemini_key = get_parameter('/scamguard/gemini-api-key')
            if gemini_key:
                try:
                    llm_result = query_gemini(advisor_name, firm_name, gemini_key)
                except Exception as e:
                    print(f"Gemini error: {e}")

        # Use fallback response if LLM not available
        if not llm_result:
            llm_result = get_fallback_advisor_response(advisor_name, firm_name)

        return success_response(200, llm_result)

    except json.JSONDecodeError:
        return error_response(400, "INVALID_JSON", "Format de requête invalide")
    except Exception as e:
        print(f"Unexpected error in check_financial_advisor: {e}")
        return error_response(500, "INTERNAL_ERROR", "Erreur serveur interne")


def query_openai(advisor_name, firm_name, api_key):
    """Query OpenAI API for advisor verification."""
    prompt = get_advisor_analysis_prompt(advisor_name, firm_name)

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "Tu es un expert en réglementation financière au Québec. Réponds UNIQUEMENT en JSON valide."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        },
        timeout=10
    )

    response.raise_for_status()
    result = response.json()

    # Parse OpenAI response
    content = result['choices'][0]['message']['content'].strip()

    # Try to extract JSON from response
    try:
        # Look for JSON block in response
        if '{' in content and '}' in content:
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            json_str = content[json_start:json_end]
            return json.loads(json_str)
    except:
        pass

    return None


def query_gemini(advisor_name, firm_name, api_key):
    """Query Gemini API for advisor verification."""
    prompt = get_advisor_analysis_prompt(advisor_name, firm_name)

    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        headers={"Content-Type": "application/json"},
        json={
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "systemInstruction": {
                "parts": [
                    {"text": "Tu es un expert en réglementation financière au Québec. Réponds UNIQUEMENT en JSON valide."}
                ]
            }
        },
        params={"key": api_key},
        timeout=10
    )

    response.raise_for_status()
    result = response.json()

    # Parse Gemini response
    if 'candidates' in result and len(result['candidates']) > 0:
        content = result['candidates'][0]['content']['parts'][0]['text'].strip()

        # Try to extract JSON from response
        try:
            if '{' in content and '}' in content:
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                json_str = content[json_start:json_end]
                return json.loads(json_str)
        except:
            pass

    return None


def get_advisor_analysis_prompt(advisor_name, firm_name):
    """Generate the prompt for advisor analysis."""
    return f"""Analyse ce conseiller financier pour un aîné québécois.
Nom: {advisor_name}
Firme: {firm_name}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{{
  "risk_level": "low|medium|high|unknown",
  "summary": "Résumé en 2 phrases simples",
  "red_flags": ["signal d'alarme 1", "signal d'alarme 2"],
  "official_registries": [
    {{"name": "AMF - Registre", "url": "https://lautorite.qc.ca/grand-public/outils-et-ressources/registre-des-representants/"}},
    {{"name": "CIRO - Vérification", "url": "https://www.ciro.ca/fr/investisseurs/proteger-vos-investissements/verifier-votre-conseiller"}},
    {{"name": "CSF - Registre", "url": "https://www.csf.qc.ca/registre/"}}
  ],
  "disclaimer": "Cette analyse est indicative. Vérifiez toujours sur les registres officiels."
}}"""


def get_fallback_advisor_response(advisor_name, firm_name):
    """Return fallback response when LLM is not available."""
    return {
        "risk_level": "unknown",
        "summary": "Service d'analyse temporairement indisponible. Vérifiez le conseiller sur les registres officiels.",
        "red_flags": [
            "Service de vérification LLM indisponible",
            "Recommandation: consultez les registres officiels directement"
        ],
        "official_registries": [
            {
                "name": "AMF - Registre des représentants",
                "url": "https://lautorite.qc.ca/grand-public/outils-et-ressources/registre-des-representants/"
            },
            {
                "name": "CIRO - Vérifier votre conseiller",
                "url": "https://www.ciro.ca/fr/investisseurs/proteger-vos-investissements/verifier-votre-conseiller"
            },
            {
                "name": "CSF - Registre des entrepreneurs",
                "url": "https://www.csf.qc.ca/registre/"
            }
        ],
        "disclaimer": "Cette analyse est indicative. Vérifiez toujours sur les registres officiels aux adresses ci-dessus."
    }


def lambda_handler(event, context):
    """Main Lambda handler for tools endpoints."""

    path = event.get("path", "")
    method = event.get("httpMethod", "")

    # Handle CORS preflight
    if method == "OPTIONS":
        return success_response(200, {})

    # Route to appropriate handler
    if path == "/api/v1/tools/check-email" and method == "POST":
        return check_email_breach(event, context)

    elif path == "/api/v1/tools/check-advisor" and method == "POST":
        return check_financial_advisor(event, context)

    else:
        return error_response(404, "NOT_FOUND", f"Endpoint {method} {path} not found")
