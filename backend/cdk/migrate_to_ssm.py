#!/usr/bin/env python3
import boto3
import json

def migrate_secrets_to_ssm():
    secrets_client = boto3.client('secretsmanager')
    ssm_client = boto3.client('ssm')
    
    secrets = [
        {'name': 'scamguard/gemini-key', 'param': '/scamguard/gemini-key'},
        {'name': 'scamguard/openai-key', 'param': '/scamguard/openai-key'}
    ]
    
    for secret in secrets:
        try:
            # Récupérer le secret
            response = secrets_client.get_secret_value(SecretId=secret['name'])
            secret_value = response['SecretString']
            
            # Créer le paramètre SSM
            ssm_client.put_parameter(
                Name=secret['param'],
                Value=secret_value,
                Type='SecureString',
                Overwrite=True,
                Description=f"Migrated from {secret['name']}"
            )
            
            print(f"✓ Migré {secret['name']} vers {secret['param']}")
            
        except Exception as e:
            print(f"✗ Erreur pour {secret['name']}: {e}")

if __name__ == "__main__":
    migrate_secrets_to_ssm()