import json
import os
import time
import boto3
from boto3.dynamodb.conditions import Key

OTP_TABLE = os.environ.get('DYNAMODB_TABLE_OTP', 'ScamGuardOTP')
dynamodb = boto3.resource('dynamodb')

def verify_otp(event, context):
    """Point d'entrée Lambda pour POST /auth/verify-sms-otp"""
    try:
        body = json.loads(event.get('body', '{}'))
        phone_number = body.get('phoneNumber')
        submitted_code = body.get('code')
        
        if not phone_number or not submitted_code:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Numéro et code requis.'})
            }
            
        table = dynamodb.Table(OTP_TABLE)
        current_time = int(time.time())
        
        # 1. Chercher le code le plus récent pour ce numéro
        response = table.query(
            KeyConditionExpression=Key('PK').eq(phone_number),
            ScanIndexForward=False, # Trie par SK (timestamp) décroissant
            Limit=1
        )
        
        items = response.get('Items', [])
        if not items:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Aucun code demandé.'})}
            
        latest_otp = items[0]
        
        # 2. Vérifications de sécurité (Expiration et Correspondance)
        if current_time > latest_otp['expiresAt']:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Ce code a expiré.'})}
            
        if latest_otp['verified']:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Ce code a déjà été utilisé.'})}
            
        if str(latest_otp['code']) != str(submitted_code):
            # Incrémenter les tentatives (Logique anti-bruteforce)
            table.update_item(
                Key={'PK': phone_number, 'SK': latest_otp['SK']},
                UpdateExpression="SET attempts = attempts + :inc",
                ExpressionAttributeValues={':inc': 1}
            )
            return {'statusCode': 400, 'body': json.dumps({'error': 'Code incorrect.'})}
            
        # 3. Code Valide ! On le marque comme vérifié
        table.update_item(
            Key={'PK': phone_number, 'SK': latest_otp['SK']},
            UpdateExpression="SET verified = :val",
            ExpressionAttributeValues={':val': True}
        )
        
        # 4. TODO: Générer ici ton JWT via AWS Cognito ou custom JWT
        # mock_token = generate_jwt(phone_number)
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Authentification réussie.',
                'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', # Ton jeton d'accès
                'user': {
                    'phoneNumber': phone_number
                }
            })
        }
        
    except Exception as e:
        print(f"Erreur vérification OTP: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Erreur interne du serveur.'})
        }