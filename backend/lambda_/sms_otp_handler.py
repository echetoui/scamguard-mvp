import json
import os
import random
import time
import boto3
from botocore.exceptions import ClientError

# Configuration depuis les variables d'environnement (.env)
OTP_TABLE = os.environ.get('DYNAMODB_TABLE_OTP', 'ScamGuardOTP')
PINPOINT_PROJECT_ID = os.environ.get('PINPOINT_PROJECT_ID')
EXPIRATION_MINUTES = 5
CODE_LENGTH = 4

# Initialisation des clients AWS
dynamodb = boto3.resource('dynamodb')
pinpoint = boto3.client('pinpoint')

def generate_otp() -> str:
    """Génère un code OTP à 4 chiffres (ex: 4092)"""
    # On évite les codes commençant par 0 pour moins de confusion
    return str(random.randint(1000, 9999))

def send_sms_via_pinpoint(phone_number: str, otp_code: str) -> dict:
    """Envoie le SMS via AWS Pinpoint avec le message éducatif anti-fraude"""
    
    # Respect du Tone & Voice de BRAND_GUIDELINES.md
    message = (
        f"Ceci est votre code ScamGuard : {otp_code}.\n"
        "Ne le partagez avec personne. ScamGuard ne vous appellera "
        "JAMAIS pour vous demander ce code."
    )
    
    try:
        response = pinpoint.send_messages(
            ApplicationId=PINPOINT_PROJECT_ID,
            MessageRequest={
                'Addresses': {
                    phone_number: {
                        'ChannelType': 'SMS'
                    }
                },
                'MessageConfiguration': {
                    'SMSMessage': {
                        'Body': message,
                        'MessageType': 'TRANSACTIONAL',
                        'SenderId': 'ScamGuard'
                    }
                }
            }
        )
        return response
    except ClientError as e:
        print(f"Erreur lors de l'envoi du SMS via Pinpoint: {e}")
        raise e

def request_otp(event, context):
    """Point d'entrée Lambda pour POST /auth/request-sms-otp"""
    try:
        body = json.loads(event.get('body', '{}'))
        phone_number = body.get('phoneNumber')
        
        if not phone_number:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Le numéro de cellulaire est requis.'})
            }
            
        otp_code = generate_otp()
        timestamp = int(time.time())
        expires_at = timestamp + (EXPIRATION_MINUTES * 60)
        
        # 1. Sauvegarde dans DynamoDB (ScamGuardOTP)
        table = dynamodb.Table(OTP_TABLE)
        table.put_item(
            Item={
                'PK': phone_number,
                'SK': f"OTP#{timestamp}",
                'code': otp_code,
                'expiresAt': expires_at,
                'attempts': 0,
                'verified': False
            }
        )
        
        # 2. Envoi du SMS au senior
        send_sms_via_pinpoint(phone_number, otp_code)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps({
                'message': 'Code envoyé avec succès.',
                'expiresIn': EXPIRATION_MINUTES * 60
            })
        }
        
    except Exception as e:
        print(f"Erreur inattendue: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Une erreur est survenue lors de l\'envoi du code.'})
        }