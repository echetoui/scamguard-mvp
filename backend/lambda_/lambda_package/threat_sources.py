"""
Threat Sources Integration - Fetch and parse threats from external sources
Phase 2 Sprint 5 - SMS Simulation & Real Threats

Sources:
- SQ (Sûreté du Québec) API - polling every 4 hours
- CAFC (Canadian Anti-Fraud Centre) CSV - daily import
"""

import json
import os
import logging
import csv
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
from io import StringIO

import boto3
import requests
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
threats_table = dynamodb.Table(os.environ.get('THREATS_TABLE', 'threats'))

# AWS S3 for CSV storage
s3 = boto3.client('s3')
CAFC_BUCKET = os.environ.get('CAFC_BUCKET', 'scamguard-cafc-data')

# External API endpoints
SQ_API_URL = os.environ.get('SQ_API_URL', 'https://api.sq.qc.ca/threats')
SQ_API_KEY = os.environ.get('SQ_API_KEY', '')
CAFC_CSV_URL = os.environ.get('CAFC_CSV_URL', 'https://www.antifraudcentre-centreantifraude.ca/threats.csv')

# Configuration
SQ_POLL_INTERVAL_HOURS = 4
CAFC_POLL_INTERVAL_HOURS = 24
THREAT_TTL_DAYS = 90


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for threat source integration
    Can be triggered by CloudWatch scheduled events
    """
    try:
        source = event.get('source', 'all')
        
        results = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'sources_processed': [],
            'threats_added': 0,
            'errors': []
        }
        
        # Process SQ API
        if source in ('all', 'sq'):
            try:
                sq_results = process_sq_api()
                results['sources_processed'].append('SQ')
                results['threats_added'] += sq_results['count']
                results['sq_details'] = sq_results
            except Exception as e:
                logger.error(f"Error processing SQ API: {str(e)}")
                results['errors'].append(f"SQ API: {str(e)}")
        
        # Process CAFC CSV
        if source in ('all', 'cafc'):
            try:
                cafc_results = process_cafc_csv()
                results['sources_processed'].append('CAFC')
                results['threats_added'] += cafc_results['count']
                results['cafc_details'] = cafc_results
            except Exception as e:
                logger.error(f"Error processing CAFC CSV: {str(e)}")
                results['errors'].append(f"CAFC CSV: {str(e)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps(results)
        }
    
    except Exception as e:
        logger.exception(f"Error in threat_sources handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def process_sq_api() -> Dict[str, Any]:
    """
    Fetch threats from Sûreté du Québec API
    Poll interval: Every 4 hours
    """
    logger.info("Processing SQ API...")
    
    try:
        # Fetch threats from SQ API
        headers = {'Authorization': f'Bearer {SQ_API_KEY}'}
        response = requests.get(
            f'{SQ_API_URL}?limit=100',
            headers=headers,
            timeout=30
        )
        response.raise_for_status()
        
        sq_threats = response.json()
        if not isinstance(sq_threats, list):
            sq_threats = sq_threats.get('threats', [])
        
        logger.info(f"Fetched {len(sq_threats)} threats from SQ API")
        
        added_count = 0
        duplicate_count = 0
        error_count = 0
        
        for threat_data in sq_threats:
            try:
                threat = transform_sq_threat(threat_data)
                
                # Check for duplicates
                if threat_exists(threat['threat_id']):
                    duplicate_count += 1
                    continue
                
                # Store threat
                store_threat(threat)
                added_count += 1
            
            except Exception as e:
                logger.warning(f"Error processing SQ threat: {str(e)}")
                error_count += 1
        
        logger.info(f"SQ API: Added {added_count}, Duplicates {duplicate_count}, Errors {error_count}")
        
        return {
            'count': added_count,
            'duplicates': duplicate_count,
            'errors': error_count,
            'source': 'SQ'
        }
    
    except requests.RequestException as e:
        logger.error(f"SQ API request failed: {str(e)}")
        raise Exception(f"SQ API request failed: {str(e)}")


def process_cafc_csv() -> Dict[str, Any]:
    """
    Fetch and parse CAFC CSV threats
    Poll interval: Daily
    """
    logger.info("Processing CAFC CSV...")
    
    try:
        # Fetch CSV from CAFC
        response = requests.get(CAFC_CSV_URL, timeout=30)
        response.raise_for_status()
        
        csv_content = response.text
        logger.info(f"Fetched CAFC CSV ({len(csv_content)} bytes)")
        
        # Store CSV in S3 for audit trail
        timestamp = datetime.utcnow().isoformat()
        s3_key = f"cafc-imports/cafc-{timestamp}.csv"
        
        try:
            s3.put_object(
                Bucket=CAFC_BUCKET,
                Key=s3_key,
                Body=csv_content
            )
            logger.info(f"Stored CAFC CSV in S3: {s3_key}")
        except ClientError as e:
            logger.warning(f"Failed to store CSV in S3: {str(e)}")
        
        # Parse CSV
        csv_reader = csv.DictReader(StringIO(csv_content))
        threats = list(csv_reader)
        
        logger.info(f"Parsed {len(threats)} threats from CAFC CSV")
        
        added_count = 0
        duplicate_count = 0
        error_count = 0
        
        for threat_row in threats:
            try:
                threat = transform_cafc_threat(threat_row)
                
                # Check for duplicates
                if threat_exists(threat['threat_id']):
                    duplicate_count += 1
                    continue
                
                # Store threat
                store_threat(threat)
                added_count += 1
            
            except Exception as e:
                logger.warning(f"Error processing CAFC threat: {str(e)}")
                error_count += 1
        
        logger.info(f"CAFC CSV: Added {added_count}, Duplicates {duplicate_count}, Errors {error_count}")
        
        return {
            'count': added_count,
            'duplicates': duplicate_count,
            'errors': error_count,
            'source': 'CAFC'
        }
    
    except requests.RequestException as e:
        logger.error(f"CAFC CSV fetch failed: {str(e)}")
        raise Exception(f"CAFC CSV fetch failed: {str(e)}")


def transform_sq_threat(sq_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform SQ API threat format to internal schema
    """
    return {
        'threat_id': f"SQ-{sq_data.get('id', '')}",
        'type': sq_data.get('type', 'SMS'),
        'institution': sq_data.get('institution', ''),
        'threat_level': sq_data.get('threat_level', 'medium'),
        'message': sq_data.get('message', ''),
        'explanation_fr': sq_data.get('explanation_fr', ''),
        'keywords': sq_data.get('keywords', []),
        'regions': sq_data.get('regions', ['Quebec']),
        'date_detected': sq_data.get('date_detected', datetime.utcnow().isoformat() + 'Z'),
        'is_scam': sq_data.get('is_scam', True),
        'threat_indicators': sq_data.get('threat_indicators', []),
        'source': 'SQ',
        'ttl_timestamp': int((datetime.utcnow() + timedelta(days=THREAT_TTL_DAYS)).timestamp())
    }


def transform_cafc_threat(cafc_row: Dict[str, str]) -> Dict[str, Any]:
    """
    Transform CAFC CSV threat to internal schema
    
    Expected CSV columns: id, type, institution, message, explanation_fr,
                         threat_level, is_scam, keywords, regions
    """
    threat_id = f"CAFC-{cafc_row.get('id', '')}"
    
    return {
        'threat_id': threat_id,
        'type': cafc_row.get('type', 'SMS'),
        'institution': cafc_row.get('institution', ''),
        'threat_level': cafc_row.get('threat_level', 'medium'),
        'message': cafc_row.get('message', ''),
        'explanation_fr': cafc_row.get('explanation_fr', ''),
        'keywords': cafc_row.get('keywords', '').split(',') if cafc_row.get('keywords') else [],
        'regions': cafc_row.get('regions', 'Quebec').split(','),
        'date_detected': cafc_row.get('date_detected', datetime.utcnow().isoformat() + 'Z'),
        'is_scam': cafc_row.get('is_scam', 'true').lower() == 'true',
        'threat_indicators': cafc_row.get('threat_indicators', '').split(',') if cafc_row.get('threat_indicators') else [],
        'source': 'CAFC',
        'ttl_timestamp': int((datetime.utcnow() + timedelta(days=THREAT_TTL_DAYS)).timestamp())
    }


def threat_exists(threat_id: str) -> bool:
    """
    Check if threat already exists in DynamoDB
    """
    try:
        response = threats_table.scan(
            FilterExpression='threat_id = :id',
            ExpressionAttributeValues={':id': threat_id},
            Limit=1
        )
        return len(response.get('Items', [])) > 0
    except ClientError as e:
        logger.warning(f"Error checking threat existence: {str(e)}")
        return False


def store_threat(threat: Dict[str, Any]) -> None:
    """
    Store threat in DynamoDB with error handling
    """
    try:
        threats_table.put_item(Item=threat)
        logger.info(f"Stored threat: {threat['threat_id']}")
    except ClientError as e:
        logger.error(f"Failed to store threat {threat['threat_id']}: {str(e)}")
        raise


# Import for timedelta
from datetime import timedelta

__all__ = ['lambda_handler', 'process_sq_api', 'process_cafc_csv']
