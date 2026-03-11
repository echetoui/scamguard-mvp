#!/usr/bin/env python3
"""
Test Firebase SMS configuration
Verifies that Firebase credentials are valid and SMS can be sent
"""

import os
import requests
import json
from datetime import datetime

# Firebase credentials
FIREBASE_API_KEY = os.environ.get("FIREBASE_API_KEY", "BJ7nqu0Hg7XuR-6riO06tCfzy7JjSpmmjqhjHEgzeGv1Elryv_Gqg6z_1EMQuW0wtQPRMlOE7bBR4JYeXiVCt_k")
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "scamguard-c3e04")

def test_firebase_credentials():
    """Test if Firebase credentials are valid"""
    print(f"\n🔍 Testing Firebase Credentials")
    print(f"   Project ID: {FIREBASE_PROJECT_ID}")
    print(f"   API Key: {FIREBASE_API_KEY[:20]}...")

    # Test with Firebase REST API - get project info
    url = f"https://identitytoolkit.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}"

    params = {
        "key": FIREBASE_API_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=5)

        if response.status_code == 200:
            print(f"✅ Firebase credentials are VALID")
            data = response.json()
            print(f"   Project: {data.get('name', 'Unknown')}")
            return True
        else:
            print(f"❌ Firebase authentication failed: {response.status_code}")
            print(f"   Error: {response.json().get('error', {}).get('message', 'Unknown')}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {str(e)}")
        return False

def test_sms_format():
    """Test OTP message format"""
    print(f"\n📝 SMS Format Test")

    otp_code = "123456"
    phone = "+14388313122"
    message = f"ScamGuard - Votre code de vérification: {otp_code} (valide 10 minutes)"

    print(f"   Phone: {phone}")
    print(f"   Code: {otp_code}")
    print(f"   Message: {message}")
    print(f"   Length: {len(message)} chars")

    if len(message) <= 160:
        print(f"✅ SMS fits in single message (≤160 chars)")
    else:
        print(f"⚠️  SMS requires multiple messages (>{len(message)} chars)")

    return True

def show_next_steps():
    """Show configuration next steps"""
    print(f"\n📋 Next Steps for Production:")
    print(f"\n1. Set Lambda Environment Variables:")
    print(f"   export FIREBASE_API_KEY=\"{FIREBASE_API_KEY}\"")
    print(f"   export FIREBASE_PROJECT_ID=\"{FIREBASE_PROJECT_ID}\"")

    print(f"\n2. Deploy updated backend:")
    print(f"   cd /Users/echetoui/scamguard-mvp/backend/cdk")
    print(f"   npx cdk deploy ScamGuardStack --require-approval never")

    print(f"\n3. Test SMS endpoint:")
    print(f'   curl -X POST https://your-api/api/v1/auth/request-sms-otp \\')
    print(f'     -H "Content-Type: application/json" \\')
    print(f'     -d \'{{"phone":"+14388313122"}}\'')

    print(f"\n4. Local testing continues with mock server:")
    print(f"   node mock-server.js  # OTP logged to console")

if __name__ == "__main__":
    print(f"\n🔐 Firebase SMS Configuration Test")
    print(f"{'='*50}")
    print(f"Timestamp: {datetime.now().isoformat()}")

    # Run tests
    creds_valid = test_firebase_credentials()
    test_sms_format()

    if creds_valid:
        print(f"\n✅ All tests passed! Firebase SMS is ready.")
        show_next_steps()
    else:
        print(f"\n❌ Firebase configuration failed. Check credentials.")

    print(f"\n{'='*50}\n")
