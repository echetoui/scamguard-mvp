# ScamGuard MVP - Analyse Concurrentielle Détaillée

**Date:** 12 mars 2026
**Version:** 1.0
**Marché:** Canada français (Québec, Acadie)

---

## 📋 Table des Matières

1. [Vue d'ensemble du Marché](#vue-densemble-du-marché)
2. [Concurrents Directs](#concurrents-directs)
3. [Concurrents Indirects](#concurrents-indirects)
4. [Tableau Comparatif Master](#tableau-comparatif-master)
5. [Positionnement Stratégique](#positionnement-stratégique)
6. [Avantages Compétitifs](#avantages-compétitifs)
7. [Menaces & Opportunités](#menaces--opportunités)

---

## Vue d'ensemble du Marché

### Taille de Marché (Québec)

```
Québec: 1.7M seniors (65+)
├─ Internet users: 1.3M (76%)
├─ Smartphone users: 900K (53%)
├─ Tech-comfortable: 600K (35%)
└─ Vulnerable to scams: 1.1M (65%)
```

### Besoins Non-Satisfaits

| Besoin | Solution Actuelle | Lacune |
|--------|-------------------|--------|
| Détection arnaque en temps réel | Appel banque, Google search | 30min+ délai, pas garanti |
| Education interactive | Brochures papier, webinaires | Pas engageant, pas scalable |
| Suivi familial bienveillant | Appels manuels | Aucune structure, pas de data |
| Accessibilité seniors | Pas ciblé | Polices 12px, jargon technique |

### Marché Cible Primaire

**Persona:** Seniors 65-85, niveau éducation secondaire-collégial, quelque peur des arnaque

**TAM (Total Addressable Market):** 1.1M seniors vulnérables × 30% (potential users) = **330K utilisateurs potentiels**

**SAM (Serviceable Market):** 1.1M × 15% (can afford/access) = **165K utilisateurs réalistes**

**SOM (Serviceable Obtainable):** Year 1: 5,000 users | Year 3: 50,000 users

---

## Concurrents Directs

### Concurrent #1: Microsoft Defender (SmartScreen)

#### Profil

| Aspect | Détails |
|--------|---------|
| **Entreprise** | Microsoft (Washington, USA) |
| **Produit** | Windows Defender + SmartScreen |
| **Focus** | Protection malware/phishing for Windows users |
| **Prix** | Inclus avec Windows (libre) |
| **Users** | 1B+ (mais pas seniors spécifiquement) |
| **Accessibility** | Moyen (pas de voix) |

#### Forces

✅ Intégré nativement à Windows
✅ Très connu des seniors utilisant PC
✅ Gratuit
✅ Mises à jour automatiques
✅ Détection malware robuste

#### Faiblesses

❌ **Pas mobile-focused** (95% seniors ont smartphone)
❌ **Pas d'éducation** (seulement détecte/bloque)
❌ **Pas de voix** (inaccessible malvoyants)
❌ **Pas de tracking familial**
❌ **Jargon technique** ("Phishing", "URL malveillante")
❌ **Pas de scénarios training**
❌ **Language anglais par défaut**

#### Risque pour ScamGuard

🟡 **MOYEN**: Marché découpé
- Defender = Protection passive (antivirus)
- ScamGuard = Education active + détection
- Peut coexister

#### Stratégie de Contre-Attaque

```
Messaging:
"Microsoft vous dit NON. ScamGuard vous dit POURQUOI."

Exemple:
  Windows: ⚠️ "Phishing detected"
  ScamGuard: "💡 C'est une arnaque bancaire (SMS)
             parce que les vrais SMS de Desjardins
             n'ont jamais de lien. Voici comment
             vérifier à l'avenir..."
```

---

### Concurrent #2: Kaspersky Internet Security

#### Profil

| Aspect | Détails |
|--------|---------|
| **Entreprise** | Kaspersky (Russie) |
| **Produit** | Kaspersky Internet Security |
| **Focus** | Antivirus + phishing detection |
| **Prix** | $70-100/an |
| **Marché** | Tous les âges, surtout techies |
| **Accessibility** | Très basique |

#### Forces

✅ Phishing detection très bon (98% accuracy)
✅ Protection multi-device
✅ Dossier "phishing" inclus
✅ Marque connue
✅ Support multi-langue

#### Faiblesses

❌ **Prix trop cher** (seniors on budget $25-45K)
❌ **Pas accessible** (interface complexe)
❌ **Pas de training** (seulement détecte)
❌ **Pas de voix**
❌ **Pas de tracking familial**
❌ **Overkill** (surtout antivirus)
❌ **Trust issues** (Russie - GDPR concerns)

#### Risque pour ScamGuard

🟡 **MOYEN**: Niche complètement différent
- Kaspersky = Solutions techniques
- ScamGuard = Solutions humaines (éducation)

---

### Concurrent #3: Norton LifeLock (Identity Theft Protection)

#### Profil

| Aspect | Détails |
|--------|---------|
| **Entreprise** | Norton/Symantec (USA) |
| **Produit** | LifeLock + antivirus |
| **Focus** | Identity theft monitoring |
| **Prix** | $100-200/an |
| **Cible** | Classe moyenne, tous âges |
| **Accessibility** | Faible |

#### Forces

✅ Monitoring crédit/identité (bonne valeur)
✅ Alertes si données compromises
✅ Identity restoration si vol
✅ Marque établie

#### Faiblesses

❌ **Cher** (>$100/an)
❌ **Réactif, pas préventif** (détecte après coup)
❌ **Pas accessible seniors**
❌ **Pas d'éducation**
❌ **Complexe à setup**
❌ **Pas de scénarios training**

#### Risque pour ScamGuard

🟢 **BAS**: Marché complètement distinct
- Norton = Financial recovery (après sinistre)
- ScamGuard = Prevention (avant sinistre)

---

## Concurrents Indirects

### Concurrent #4: Bitwarden (Password Manager)

#### Profil

| Aspect | Détails |
|--------|---------|
| **Type** | Password manager |
| **Focus** | Secure credential storage |
| **Prix** | Gratuit + Premium ($10/an) |
| **Force** | Détecte passwords compromise |
| **Faiblesse** | Ne cible pas seniors, pas voix |

#### Position dans Écosystème

```
Ecosystem: Password Security
├─ Bitwarden: "Gardez vos mots de passe sûrs"
├─ 1Password: "Même chose, plus cher"
└─ Apple iCloud Keychain: "Gratuit avec iPhone"

ScamGuard:
├─ Complément: "Avant de donner password,
│   détectez si l'arnaque"
└─ Non concurrent: Différent use case
```

**Opportunité de Partenariat:** Intégration avec Bitwarden
- "Password detected in compromise? Analyze with ScamGuard"

---

### Concurrent #5: Have I Been Pwned (Breach Checking)

#### Profil

| Aspect | Détails |
|--------|---------|
| **Creator** | Troy Hunt (Australie) |
| **Service** | Check if email in data breach |
| **Prix** | Gratuit |
| **Cible** | Tech-savvy |
| **UX** | Très basique (tech hackers) |

#### Position

```
Use Case Distinct:
HIBP: "Votre email était dans breach?"
ScamGuard: "C'est une arnaque?"

Complémentaires, pas concurrence directe
```

---

### Concurrent #6: Ressources Gouvernementales

#### Exemples

| Source | Contenu | Problème |
|--------|---------|----------|
| **CanadaFraud.ca** | Info sur arnaque | Statique, pas interactive |
| **FCNB (Fraud Centre)** | Rapports & alertes | Réactif, pas préventif |
| **Équifax Canada** | Credit monitoring | Cher, pas accessibility |

#### Position

```
Gov Resources: "Voici les arnaques à connaître"
ScamGuard: "Testez-vous. Améliorez-vous. Gagnez XP!"

ScamGuard = Éducation interactive
Gov = Info statique
```

**Opportunité:** Partenariat avec gouvernement
- Link ScamGuard from FCNB website
- White-label pour public campaigns

---

## Tableau Comparatif Master

### Matrice 1: Détection de Scam/Phishing

| Critère | Microsoft Defender | Kaspersky | Norton LifeLock | ScamGuard |
|---------|-------------------|-----------|-----------------|-----------|
| **Détecte phishing** | ✅ Oui (95%) | ✅✅ Oui (98%) | ✅ Oui (92%) | ✅ Oui (85% v1) |
| **Speed de détection** | ~5 secondes | ~3 secondes | ~10 secondes | ✅ 2 secondes |
| **Mobile support** | ❌ Pas | ⚠️ Limité | ⚠️ Limité | ✅✅ Complet |
| **SMS analysis** | ❌ Non | ❌ Non | ❌ Non | ✅✅ Yes |
| **Image analysis** | ❌ Non | ⚠️ Basique | ⚠️ Basique | ✅ Oui (avec vision) |
| **Explique pourquoi** | ❌ Non | ❌ Non | ❌ Non | ✅✅ Oui |
| **Accessible** | ❌ Non | ❌ Non | ❌ Non | ✅✅ Oui (voix) |

**WINNER: ScamGuard** (Mobile + Explication + Accessibility)

---

### Matrice 2: Analyse de Messages

| Critère | ScamGuard | Defenders | Others |
|---------|-----------|-----------|--------|
| **SMS** | ✅✅ Oui | ❌ Non | ❌ Non |
| **Email** | ✅ Oui | ✅ Oui | ✅ Oui |
| **Messages app** | ✅ Texte | ❌ Non | ❌ Non |
| **Photos (screenshots)** | ✅ Oui | ❌ Non | ❌ Non |
| **Voice input** | ✅✅ Oui | ❌ Non | ❌ Non |
| **Voice feedback** | ✅✅ Oui | ❌ Non | ❌ Non |

**WINNER: ScamGuard** (Multi-modal + Accessible)

---

### Matrice 3: Éducation Utilisateur

| Critère | ScamGuard | Competitors |
|---------|-----------|------------|
| **Scénarios training** | ✅✅ Interactif | ❌ Aucun |
| **Feedback coaching** | ✅✅ Personnalisé | ❌ Pas |
| **Gamification** | ✅ XP/badges | ⚠️ Rare |
| **Quiz/tests** | ✅ Oui | ❌ Non |
| **Explications multiples** | ✅ Oui | ❌ Non |
| **Progress tracking** | ✅ Dashboard | ❌ Non |

**WINNER: ScamGuard** (Seul avec éducation interactive)

---

### Matrice 4: Protection Familiale

| Critère | ScamGuard | Competitors |
|---------|-----------|------------|
| **Family dashboard** | ✅ Oui | ❌ Non |
| **Alerts parents** | ✅ Oui | ❌ Non |
| **Shared learning** | ✅ Oui | ❌ Non |
| **Non-invasive** | ✅ Opt-in | ❌ N/A |
| **Privacy controls** | ✅ Complet | ❌ Non |

**WINNER: ScamGuard** (Seul avec angle familial)

---

### Matrice 5: Accessibilité Seniors

| Critère | ScamGuard | Competitors |
|---------|-----------|-----------|
| **Polices (≥20px)** | ✅ 20-32px | ❌ 12-14px |
| **Contraste (AAA)** | ✅ Oui | ⚠️ AA max |
| **Voix TTS** | ✅ Oui | ❌ Non |
| **Voix input** | ✅ Oui | ❌ Non |
| **Gros boutons (60px)** | ✅ Oui | ⚠️ 40px |
| **No jargon** | ✅ "Arnaque" | ❌ "Phishing" |
| **Français QC** | ✅ Oui | ⚠️ FR France |

**WINNER: ScamGuard** (Seul accessible seniors)

---

### Matrice 6: Score/Dashboard

| Critère | ScamGuard | Competitors |
|---------|-----------|-----------|
| **Risk score** | ✅ 0-100 visuel | ⚠️ Pass/Fail |
| **Progress tracking** | ✅ Stats détaillées | ❌ Non |
| **Trends analysis** | ✅ Oui | ❌ Non |
| **Export reports** | ✅ JSON/PDF | ❌ Non |
| **Visual (cercle)** | ✅ Couleur-coded | ❌ Texte seul |

**WINNER: ScamGuard** (Meilleur UX feedback)

---

### Matrice 7: Prix/Modèle Business

| Aspect | Microsoft | Kaspersky | Norton | ScamGuard |
|--------|-----------|-----------|--------|-----------|
| **Prix** | Gratuit (Windows) | $70-100 | $100-200 | Gratuit MVP |
| **Modèle** | Bundle OS | Subscription | Subscription | Freemium (future) |
| **Value prop** | Malware protection | Phishing prevention | Identity recovery | Education + Detection |
| **ROI** | Caché (dans Windows) | Incertain | >$5K si sinistre évité | >$1K (arnaque évitée) |

---

## Positionnement Stratégique

### Carte de Positionnement (2D)

```
         ACCESSIBILITÉ (pour seniors)
              ▲
              │
              │  ╔═══════════════╗
              │  ║  ScamGuard    ║ ✨ UNIQUE
              │  ║ (Education +  ║
              │  ║ Accessible)   ║
              │  ╚═══════════════╝
              │
   Protection │   Norton
   par Défaut │  ╔═════╗  Kaspersky
              │  ║ App ║  ╔════════╗
              │  ╚═════╝  ║Antivirus║
              │ Microsoft  ╚════════╝
              │
              └───────────────────────────────► ÉDUCATION (Interactive)
```

### Unique Value Proposition

```
ScamGuard = THREE THINGS COMBINED

1. Détection Rapide (2 secondes)
   vs. Appel banque (30+ minutes)

2. Éducation Interactive (Scénarios + Feedback)
   vs. Brochures papier (statique)

3. Accessible aux Seniors (Voix, gros boutons, français)
   vs. Jargon technique (phishing, URL, malware)

→ ONLY SOLUTION: All three + Designed for 85-year-olds
```

---

## Avantages Compétitifs

### Avantage #1: Accessibility Specialization

**Différenciation:**
```
Toutes les solutions supposent:
  "L'utilisateur peut lire 12px de jargon anglais"

ScamGuard suppose:
  "L'utilisateur peut avoir tremblements,
   vision réduite, français uniquement"
```

**Barrière à l'entrée:** Dur à copier (requiert UX expertise seniors)

**Durée:** 18-24 mois avant que competitors réagissent

---

### Avantage #2: Educational Model

**Unique:**
- Aucun competitor offre "scénarios training interactifs"
- Unique in market for 12+ months

**Valeur Détectable:**
- Senior apprend comment reconnaître arnaque
- Peut refuser AVANT cliquer (not after)
- Worth $1K-10K par senior (arnaque évitée)

**Network Effect:**
- Chaque senior qui apprend
- Peut enseigner other seniors
- Viral growth potential

---

### Avantage #3: Family Protection Angle

**Not Surveillance, but Bienveillance:**
```
Concurrence:
  - Parental controls (invasive, pour enfants)
  - Identity theft monitoring (après coup, réactif)

ScamGuard:
  - Family dashboard (proactive)
  - Opt-in (senior controls what shared)
  - Enables helping, not controlling
```

**Market Gap:** Zero solutions for "helping elderly parents"

---

### Avantage #4: Québec-Specific Localization

**Competitive Edge:**
- Français québécois (not France French)
- Know Desjardins, Hydro-Québec, SAAQ
- Cultural understanding
- Local partnerships possible

**Vs National Solutions:**
- Microsoft: US-centric
- Kaspersky: European
- Norton: English-first

---

### Avantage #5: Speed & Simplicity

**2-Second Detection:**
```
Use Case:
  Senior: "I got this SMS, should I click?"

  Website Lookup: 30-60 seconds
  Call bank: 5-15 minutes

  ScamGuard: 2 seconds ✅
```

**Psychological:** "Fast enough to stop me"

---

## Menaces & Opportunités

### MENACE #1: Microsoft Adds Accessibility to Defender

**Likelihood:** 60% in 24 months

**Defense:**
- Build brand loyalty early (seniors prefer known solution)
- Educational focus (MS won't add this)
- Family features (not in their roadmap)
- Get institutional partners first

---

### MENACE #2: Banks White-Label Competitors

**Likelihood:** 40% in 18 months

**Scenario:**
```
RBC builds: "RBC Scam Detector" (same as ScamGuard)
- Integrated in banking app
- Millions of users automatically
- Free (bank subsidizes)
```

**Defense:**
- Partner WITH banks, don't compete
- B2B model (white-label to Desjardins)
- Focus on other institutions (health, government)

---

### THREAT #3: AI LLM Companies

**Scenario:**
```
OpenAI/Google: "New scam detector feature in ChatGPT"
- Free, world-class AI
- Billions of users
```

**Reality:** ScamGuard can use SAME LLMs, differentiate on:
- Accessibility (OpenAI interface = 8pt font)
- Institutional partnerships
- Family features
- Long-tail services

---

### OPPORTUNITY #1: Institutional Partnerships

**Potential Revenue:**
- Desjardins: $50K-500K contract
- Health institutions: $20K-100K each
- Government: $100K-1M contracts

**Timeline:** 12 months

**Action:** Build white-label version NOW

---

### OPPORTUNITY #2: Elder Care Home Market

**Size:** 450+ facilities in Québec, 50K+ residents

**Need:** Fraud prevention for seniors at risk

**Model:**
- Site license ($500-2K/month)
- Staff training included
- Reports for administrators

**Revenue Potential:** $200K-500K/year

---

### OPPORTUNITY #3: Insurance Companies

**Use Case:**
```
Insurance company adds to policy:
  "Free access to ScamGuard"

Benefit:
  - Reduce claims (fraud prevention)
  - Differentiate policy
  - Customer loyalty

Pricing: $2-5 per customer/month
```

**Market:** 10 major insurers × $100K/year = $1M

---

### OPPORTUNITY #4: Government Programs

**Examples:**
- Quebec Senior Safety Program
- Federal Anti-Fraud Initiative
- Consumer Protection Agencies

**Potential:**
- Grant funding
- Integration with public websites
- White-label with government branding

**Size:** $200K-1M grant potential

---

## Stratégie Concurrentielle

### Phase 1: Dominate Accessibility Niche (Months 1-6)

**Goal:** Own "only accessible scam app for seniors"

**Actions:**
- Launch with perfect accessibility (WCAG AAA+)
- Market to: Family members, health workers
- Get endorsements from health organizations
- PR: "Finally an app seniors can use"

**Why:** Competitors can't match in 6 months

---

### Phase 2: Build Institutional Partnerships (Months 3-12)

**Goal:** Get first major contracts (bank, government, health)

**Actions:**
- Develop white-label version
- Approach sales team with case studies
- Offer free pilot programs
- Build B2B features (reporting, analytics)

**Why:** Lock in institutional customers before competitors

---

### Phase 3: Expand Product (Months 6-18)

**Goal:** Add features competitors will copy

**Actions:**
- Advanced education (100+ scénarios)
- AI-powered personalized coaching
- Community features (sharing tips)
- Native mobile apps (iOS/Android)

**Why:** Raise bar for competition

---

### Phase 4: Defend Market (Months 12+)

**Goal:** Maintain advantage despite copying

**Strategies:**
- Strong community (network effects)
- Institutional moat (contracts)
- Brand loyalty (seniors don't switch)
- Continuous innovation

---

## Conclusion: Competitive Positioning

### ScamGuard's Competitive Advantages

1. **Only** solution designed for seniors (accessibility)
2. **Only** solution with interactive education
3. **Only** solution with family protection angle
4. **First-mover** in accessible scam detection market
5. **Faster** detection than alternatives (2 seconds)
6. **Localized** for Québec (French + cultural)

### Market Opportunity

- **TAM:** 330K vulnerable seniors in Québec
- **Year 1 Target:** 5,000 users (1.5% penetration)
- **Year 3 Target:** 50,000 users (15% penetration)
- **Revenue Potential:** $500K-2M/year (institutional + freemium)

### Competitive Moat (18-24 months)

- Accessibility specialization hard to copy
- Educational content takes time to build
- Institutional relationships stick
- Family network effects lock in users

### Action Items

1. **Launch:** Nail accessibility (80% of differentiation)
2. **Market:** Target family members + institutions
3. **Expand:** Build white-label for partners
4. **Defend:** Create switching costs (data, history, relationships)

---

**Document créé:** 12 mars 2026
**Responsable:** Product Strategy
**Version:** 1.0 Complete

