# Task 1.1 - DynamoDB TTL & Anonymisation
## 📋 Quick Execution Guide

**Status:** Ready to Execute
**Timeline:** Week 1
**Estimated Time:** 2.5 hours total (30 min Claude + 30 min Gemini + 60 min review)
**API Cost:** ~$0.15

---

## 🎯 Step 1: Copy-Paste This Prompt to Claude

### Prompt for Claude Sonnet

```
Tu es un expert AWS DynamoDB et sécurité des données.

CONTEXTE:
ScamGuard est une app de prévention d'arnaque pour aînés québécois.
Stack existant: DynamoDB + Lambda + CloudFront
Conformité requise: Loi 25 (RGPD québécois)

TÂCHE:
Modifie le schéma DynamoDB et la fonction Lambda pour:

1. RÉTENTION (TTL - Time To Live)
   ├─ Ajoute un champ 'expirationTime' (TimeToLive)
   ├─ TTL = 30 jours après création
   ├─ Les anciens records s'auto-supprimnt
   └─ Code Python avec boto3 pour configurer TTL

2. ANONYMISATION (SHA-256 + Salt)
   ├─ Crée utilitaire: hash_user_id(userId, salt)
   ├─ Stocke hash au lieu de userId brut
   ├─ Garde salt dans AWS Secrets Manager
   ├─ Impossible de tracer l'utilisateur après 30 jours
   └─ Conforme Loi 25 (pseudonymization)

3. MIGRATION
   ├─ Script pour migrer anciens records
   ├─ Tester sur DynamoDB local d'abord
   └─ Plan rollback si problème

FICHIERS À GÉNÉRER:
├─ backend/lambda/utils/anonymization.py (new)
│  └─ Fonction: hash_user_id(), verify_hash()
├─ backend/lambda/handler_llm.py (modified)
│  └─ Appel à anonymization avant save DynamoDB
├─ backend/lambda/migration_script.py (new)
│  └─ Migrate existing data
└─ backend/lambda/tests/test_anonymization.py
   └─ Unit tests

FORMAT RETOUR DynamoDB:
{
  "hashedUserId": "sha256_hash_here",
  "timestamp": "2026-02-17T10:30:00Z",
  "expirationTime": 1709251800,  # Unix timestamp (30j later)
  "analysis": {
    "risk_score": 75,
    "is_scam": true,
    "explanation": "..."
  }
}

VALIDATION:
- Hash est déterministe (same input = same hash)
- Salt is secure (from Secrets Manager)
- TTL fonctionne dans DynamoDB
- Tests couvrent tous les cas
```

---

## 🔄 Step 2: What Claude Will Generate

You should expect:

✅ **anonymization.py** (~150 lines)
```python
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta

class AnonymizationManager:
    def __init__(self):
        # Load salt from AWS Secrets Manager

    def hash_user_id(self, user_id: str) -> str:
        # Deterministic hash with salt

    def get_expiration_time(self) -> int:
        # Unix timestamp for 30 days from now

    def verify_hash(self, user_id: str, hash_value: str) -> bool:
        # Verify user_id matches hash (for testing)
```

✅ **handler_llm.py** (modified to use anonymization)
- Replace `userId` with `hash_user_id()` before storing
- Add `expirationTime` field to DynamoDB records

✅ **migration_script.py** (~100 lines)
- Migrate existing user records
- Test on DynamoDB local first

✅ **test_anonymization.py** (~150 lines)
- Test hash determinism
- Test TTL configuration
- Test Secrets Manager integration

---

## 🧪 Step 3: Validate with Gemini

After Claude delivers the code, copy this prompt to **Gemini Flash**:

```
Tu es un expert en sécurité des données.

VALIDE LE CODE SUIVANT pour:
- Pas de fuite de userId brut
- Salt management sécurisé
- Pas de régression de performance
- Compatibilité Loi 25

Utilise ce checklist:
☑ userId jamais stocké en clair
☑ Salt ne dépasse pas 1000 requests/jour API
☑ TTL configué correctement
☑ Migration non-destructive
☑ Tests couvrent 95%+ du code

[Paste Claude's code here]
```

**Expected Response:** Gemini validates or flags issues for Claude to fix.

---

## ✅ Step 4: Your Review Checklist (15-30 min)

Before committing, verify:

- [ ] Code follows PEP 8 style
- [ ] No hardcoded secrets (all from Secrets Manager)
- [ ] Hash is deterministic (same input = same output)
- [ ] Tests run without errors: `pytest backend/lambda/tests/test_anonymization.py`
- [ ] TTL is set to 30 days (2,592,000 seconds)
- [ ] No userId appears in logs or DynamoDB raw
- [ ] Migration script is idempotent (safe to run twice)
- [ ] docstrings explain each function

---

## 📝 Step 5: Commit to Git

```bash
cd /Users/echetoui/scamguard-mvp

# Copy generated files
cp <claude_output>/anonymization.py backend/lambda/utils/
cp <claude_output>/migration_script.py backend/lambda/
cp <claude_output>/test_anonymization.py backend/lambda/tests/

# Run tests
pytest backend/lambda/tests/test_anonymization.py -v

# Stage and commit
git add backend/lambda/utils/anonymization.py
git add backend/lambda/migration_script.py
git add backend/lambda/tests/test_anonymization.py
git add backend/lambda/handler_llm.py

git commit -m "feat(privacy): implement DynamoDB TTL and user ID anonymization (Loi 25 compliance)"
```

---

## 📊 Time Breakdown

| Step | Time | Cost |
|------|------|------|
| Claude generation | 30 min | $0.10 |
| Gemini validation | 15 min | $0.05 |
| Your review | 45 min | $22.50 (at $50/h) |
| Git commit | 10 min | - |
| **TOTAL** | **100 min** | **$22.65** |

---

## 🚀 Next Task (Week 2)

After completing Task 1.1:
- **Task 1.2:** ConsentBanner (UI-001) - Same process, different Claude prompt
- **Task 2.1:** System Prompt Expert (AI-001) - For LLM optimization

---

## 📚 Context Files Already Available

- ✅ `PROJECT_STATUS.md` - Architecture reference
- ✅ `ROADMAP_COMPLETE.md` - Phase 1 specifications
- ✅ `backend/lambda/handler_llm.py` - Current Lambda handler
- ✅ `backend/template.yaml` - CloudFormation template

---

## ❓ Troubleshooting

**Q: Claude says it needs more context?**
A: Provide `backend/lambda/handler_llm.py` contents (copy from repo)

**Q: How do I test TTL locally?**
A: Use DynamoDB local or mock with moto library (Claude will include this)

**Q: What if migration fails in production?**
A: Rollback plan: Restore from DynamoDB backup, run migration script again with different salt version

**Q: Is this GDPR compliant?**
A: Yes - pseudonymization + auto-delete after 30 days = Loi 25 compliant

---

**Ready? Open Claude and paste the prompt above! ⬆️**
