# Outils Tab Testing Guide - Phase 5C

## ✅ Testing Completed

### Backend Testing
- **Unit Tests:** 14/14 PASSED ✅
  - Response formatting (CORS headers, JSON structure)
  - Email breach endpoint validation
  - Financial advisor endpoint validation
  - Lambda routing and error handling
  - Fallback responses when APIs unavailable

**Run tests:**
```bash
cd backend/lambda_
python3 -m pytest tests/test_tools_handler.py -v --no-cov
```

### Frontend Build
- **Build Status:** SUCCESS ✅
- **Output:**
  - `index.html`: 0.49 KB (gzip: 0.32 KB)
  - `index-*.css`: 107.62 KB (gzip: 19.33 KB)
  - `index-*.js`: 257.32 KB (gzip: 75.91 KB)
  - Build time: 2.88s

---

## Manual Testing Checklist

### 1. Navigation
- [ ] Bottom navigation shows "Outils" (🔧) tab
- [ ] Tab positioned after "Ressources", before "Famille"
- [ ] Tab is clickable and active state shows
- [ ] Tab title: "🔧 Outils de Vérification"

### 2. Email Breach Tab
**Input Step:**
- [ ] Form displays with email input field
- [ ] Input label: "Votre adresse courriel"
- [ ] Placeholder shows example email
- [ ] Button text: "🔍 Vérifier mon courriel"
- [ ] Button disabled when input empty
- [ ] Touch target >= 48px height

**Result Step (when API responds):**
- [ ] Status indicator displays with appropriate color:
  - Green (✅) if breached=false
  - Red (⚠️) if breached=true
  - Orange (ℹ️) if breached=null
- [ ] Message clearly explains status
- [ ] If breached: Lists sources/databases
- [ ] Actions listed as bullet points
- [ ] Link to haveibeenpwned.com provided
- [ ] "Vérifier un autre courriel" button works

### 3. Advisor Tab
**Input Step:**
- [ ] Form displays with two fields
- [ ] Field 1 (required): "Nom du conseiller"
- [ ] Field 2 (optional): "Nom de la firme ou de la banque"
- [ ] Button text: "🔍 Vérifier le conseiller"
- [ ] Button disabled when advisor name empty
- [ ] Touch target >= 48px height

**Result Step (when API responds):**
- [ ] Risk level displayed with icon:
  - ✅ (green) = low risk
  - ⚠️ (orange) = medium risk
  - 🚨 (red) = high risk
  - ℹ️ (blue) = unknown
- [ ] Summary text explains risk assessment
- [ ] Red flags listed (if any)
- [ ] Three registry links displayed:
  1. AMF - Registre des représentants
  2. CIRO - Vérifier votre conseiller
  3. CSF - Registre des entrepreneurs
- [ ] Links are clickable (open in new tab)
- [ ] Disclaimer text visible
- [ ] "Vérifier un autre conseiller" button works

### 4. Accessibility
- [ ] All buttons have min 48px height
- [ ] Form labels associated with inputs (htmlFor)
- [ ] Focus indicators visible (outline around elements)
- [ ] Keyboard navigation: Tab moves between fields
- [ ] Error messages have role="alert"
- [ ] Loading states show aria-busy="true"
- [ ] Links have target="_blank" + rel="noopener noreferrer"

### 5. Design & Styling
- [ ] Warm color palette applied:
  - Terracotta (#C85A2A) - primary buttons, headers
  - Gold (#D4A574) - secondary, accents
  - Sage green (#7A9B7F) - success states
  - Cream (#FFF9F3) - background
- [ ] Typography:
  - Display font: Cormorant Garamond (headings)
  - Body font: Lora (readable serif)
- [ ] Cards have shadow depth
- [ ] Mobile responsive:
  - Test at <480px (mobile)
  - Test at 481-768px (tablet)
  - Test at 769px+ (desktop)

### 6. Dark Mode
- [ ] Toggle system dark mode (macOS) or browser dev tools
- [ ] Colors adjusted for dark backgrounds
- [ ] Text remains readable (good contrast)
- [ ] Backgrounds are dark (not white)

### 7. Error Handling
- [ ] Invalid email rejected with message
- [ ] Missing advisor name rejected with message
- [ ] Network errors show graceful fallback
- [ ] Error messages have role="alert"

---

## Mockup Interaction Scenarios

### Scenario 1: Email Breach Check (Success)
```
Input: "john.doe@gmail.com"
Response:
{
  "breached": true,
  "breach_count": 3,
  "sources": ["LinkedIn", "Adobe", "RockYou"],
  "message": "⚠️ Attention : votre courriel apparaît dans 3 fuite(s) de données.",
  "actions": [
    "Changez votre mot de passe",
    "Activez l'authentification à deux facteurs",
    "Vérifiez vos autres comptes"
  ]
}
```

### Scenario 2: Email Not Breached
```
Input: "newemail@newdomain.com"
Response:
{
  "breached": false,
  "breach_count": 0,
  "sources": [],
  "message": "✅ Bonne nouvelle : votre courriel n'apparaît pas dans nos bases de données connues.",
  "actions": [
    "Continuez à utiliser des mots de passe forts",
    "Activez l'authentification à deux facteurs",
    "Restez vigilant face aux tentatives de phishing"
  ]
}
```

### Scenario 3: Advisor Check (High Risk)
```
Input: advisorName="Jean Dupont", firmName="Unknown Firm"
Response (LLM-generated):
{
  "risk_level": "high",
  "summary": "Ce conseiller ne figure pas dans les registres officiels...",
  "red_flags": [
    "Absence dans les registres AMF/CIRO",
    "Firme non reconnue",
    "Demandes de paiement anticipé"
  ],
  "official_registries": [
    {"name": "AMF - Registre", "url": "..."},
    {"name": "CIRO - Vérification", "url": "..."},
    {"name": "CSF - Registre", "url": "..."}
  ]
}
```

---

## Browser Testing Matrix

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome  | ✅ Test | ✅ Test | TBD    |
| Firefox | ✅ Test | ✅ Test | TBD    |
| Safari  | ✅ Test | ✅ Test | TBD    |
| Edge    | ✅ Test | ✅ Test | TBD    |

---

## API Endpoint Testing (curl)

### Email Breach Check
```bash
curl -X POST http://localhost:3001/api/v1/tools/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Financial Advisor Check
```bash
curl -X POST http://localhost:3001/api/v1/tools/check-advisor \
  -H "Content-Type: application/json" \
  -d '{"advisorName":"Jean Dupont","firmName":"Banque XYZ"}'
```

---

## Pre-Deployment Checklist

- [ ] All 14 unit tests passing
- [ ] Frontend builds successfully
- [ ] All required imports in place
- [ ] Routing configured in index.py
- [ ] API endpoints in api.js
- [ ] Navigation updated
- [ ] Manual testing complete
- [ ] Accessibility verified (WCAG AAA)
- [ ] Dark mode tested
- [ ] Mobile responsive tested

---

## Next Steps

1. **Set SSM Parameters** (required before deployment):
   ```bash
   aws ssm put-parameter \
     --name "/scamguard/breachdirectory-api-key" \
     --value "YOUR_BREACHDIRECTORY_KEY" \
     --type SecureString \
     --region us-east-1
   ```

2. **Deploy to staging** using existing CDK deployment

3. **Integration testing** against AWS Lambda endpoints

4. **Production deployment** (when approved)
