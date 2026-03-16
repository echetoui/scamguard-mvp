# ScamGuard MVP - Analyse Détaillée des Personas

**Date:** 12 mars 2026
**Version:** 1.0
**Statut:** Complet

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Persona 1: Senior (Personne Âgée)](#persona-1-senior)
3. [Persona 2: Aidant Familial](#persona-2-aidant-familial)
4. [Persona 3: Conseiller Institutionnel](#persona-3-conseiller-institutionnel)
5. [Persona 4: Institution Financière](#persona-4-institution-financière)
6. [Matrice Convergence](#matrice-convergence)
7. [Stratégies d'Adoption](#stratégies-dadoption)

---

## Vue d'ensemble

ScamGuard cible **4 personas distincts** formant un écosystème de protection en trois couches:

```
┌──────────────────────────────────────────────────────┐
│  TIER 1: PROTÉGÉ (Senior)                            │
│  ├─ Utilisateur principal                            │
│  └─ Interface ultra-accessible                       │
└────────────────┬─────────────────────────────────────┘
                 │
                 ├─ TIER 2a: Aidants Proches
                 │  (Famille)
                 │  └─ Surveillance bienveillante
                 │
                 └─ TIER 2b: Aidants Institutionnels
                    (Institutions)
                    └─ Protection systémique
```

**Valeur Clé:** Pas de jalousie techno - le Senior ne se sent pas surveillé, l'Aidant se sent impliqué.

---

## Persona 1: Senior (Personne Âgée)

### Profil Démographique

| Attribut | Données |
|----------|---------|
| **Âge** | 65-85+ ans (pic: 72 ans) |
| **Lieu** | Québec urbain/rural |
| **Revenu** | $25K-45K/an (retraite) |
| **Éducation** | Secondaire (60%), Collégial (30%), Universitaire (10%) |
| **Vie Familiale** | Couple (40%), Veuf/ve (35%), Seul (25%) |
| **Situation** | Retraité (80%), Semi-actif (20%) |

### Santé & Capacités

| Aspect | Réalité | Impact |
|--------|---------|--------|
| **Vision** | 40% ont vision réduite | Texte ≥20px, contraste AAA obligatoire |
| **Audition** | 50% ont perte auditive | Synthèse vocale + sous-titres |
| **Motricité** | 30% ont tremblements (Parkinson, arthrite) | Boutons ≥60px, pas de double-click |
| **Cognition** | Lucidité générale, mais fatigue mentale | Interface simple, 1 tâche par écran |
| **Mémoire** | Bonne LT, courte moins fiable | Pas de codes complexes, confirmations claires |

### Pain Points (Douleurs Principales)

#### 1. Peur d'arnaques (*80% des seniors*)

**Manifestations:**
- "J'ai reçu un SMS qui prétend venir de ma banque..."
- "Un appel me demandait mon numéro de crédit..."
- "J'ai cliqué accidentellement sur un lien bizarre"

**Origine:**
- Médias (reportages alarmistes)
- Témoignages familiaux (cousin qui s'est fait arnaquer)
- Cas réels vécus

**Impact Émotionnel:**
- Anxiété permanente
- Paralysie décisionnelle (refus d'utiliser internet)
- Culpabilité ("Je devrais comprendre...")

#### 2. Sentiment d'incompétence technologique

**Réalité:** Seniors sont capables, mais manquent de contexte

**Exemple:**
```
Senior: "Comment je sais si c'est vrai un SMS bancaire?"
→ Ne reconnaît pas patterns de scam (urgence, demande données)
→ N'a pas d'expérience de vraies vs fausses interfaces
```

**Conséquence:**
- Doute constant ("Je fais confiance à rien")
- Appels incessants à famille ("C'est sûr ça?")
- Isolation digitale par peur

#### 3. Isolation familiale & manque d'accompagnement

**Situation:**
- Enfants occupés (travail, famille)
- Petits-enfants loin géographiquement
- Pas de "personne de confiance" accessible 24/7

**Besoin Non-Satisfait:**
- Quelqu'un qui comprend ET explique patiemment
- Pas de jugement ("Ah tu t'es fait avoir...")
- Éducation continue, pas unique

#### 4. Interfaces tech hostiles

**Problèmes Rencontrés:**
- Polices petites (Apple, Google: 12-14px)
- Jargon technique ("Authentification 2FA", "Phishing")
- Trop d'options ("Quelle est la bonne?")
- Délais longs (2-3s de chargement = "ça marche pas")
- Pas de feedback ("C'est fait ou pas?")

### Objectifs Principaux

#### Objectif #1: Gain de Confiance (Sécurité)
**"Je veux être sûr de faire confiance à ce message"**

- Détection rapide ("C'est une arnaque" en 5 secondes)
- Explication simple ("Pourquoi c'est une arnaque")
- Actionnable ("Voici ce que je dois faire")

#### Objectif #2: Compréhension Durable
**"Je veux reconnaître les arnaques moi-même"**

- Formation interactive (pas lectures longues)
- Répétition (plusieurs scénarios)
- Feedback immédiat
- Gamification (pour motivation)

#### Objectif #3: Autonomie Digitale
**"Je veux utiliser mon téléphone sans peur"**

- Pas de "blocage" complet
- Confiance graduelle
- "Je sais quoi faire si...")

### Technologie Literacy

| Niveau | % Seniors | Capacités | Limitations |
|--------|-----------|-----------|------------|
| **Bas (1-2)** | 35% | SMS, appels, photos | Pas de web, panique avec popups |
| **Moyen (3-4)** | 45% | Facebook, emails, quelques apps | Confondent domaines, TLS unknowing |
| **Haut (5+)** | 20% | Web, multiples comptes, paramètres | Peuvent guider autres |

**Implication:** Interface doit fonctionner pour niveau 1-2.

### Use Cases Prioritaires (Ordre d'Impact)

#### Use Case #1: Analyse de SMS Bancaire (Impact: CRITIQUE)
```
Scenario:
  Senior reçoit: "Votre compte est bloqué. Cliquez ici."
  Émotion: PANIQUE
  Action habituelle: Clic immédiat OU appel à banque (coûteux)

  ✅ ScamGuard:
  1. Prend photo/décrit message
  2. Analyse en 2 secondes
  3. Résultat: "⚠️ ARNAQUE - 92/100 risque"
  4. Feedback: "Les banques ne demandent jamais via SMS"
  5. Action: "Supprimez le message, appelez Desjardins"
```

**Impact:** Prévient perte financière ($500-10,000)

#### Use Case #2: Vérification Email Suspect (Impact: HAUTE)
```
Scenario:
  "Votre compte Apple a reçu achat non-autorisé"
  Senior: "C'est peut-être vrai? Je dois cliquer?"

  ✅ ScamGuard:
  1. Copie/colle le texte
  2. 3 secondes d'analyse
  3. "Hameçonnage probable"
  4. Explique: "Apple ne demande pas données par email"
```

#### Use Case #3: Entrainement Interactif (Impact: MOYENNE)
```
Scenario:
  Senior n'a pas confiance en ses instincts

  ✅ ScamGuard:
  1. "Testez-vous avec un faux message"
  2. Génère scénario réaliste
  3. Senior essaie de détecter arnaque
  4. Feedback: "Excellent! Tu as reconnu..."
  5. Points gagnés (+10)
  6. Motivation: "Je peux le refaire!"
```

#### Use Case #4: Appel à l'Aide Familial (Impact: CONNAISSANCE)
```
Scenario:
  Senior: "Mon petit-fils, je peux utiliser ScamGuard?"

  ✅ ScamGuard:
  1. Dashboard Famille visible pour petit-fils
  2. Petit-fils voit: "Grand-maman a fait 5 analyses"
  3. Peut discuter: "T'as vu celui-là? C'était effectivement arnaque"
```

### Freins à l'Adoption

| Frein | Probabilité | Sévérité | Mitigation |
|-------|-------------|----------|-----------|
| **Peur de technologie** | 60% | HAUTE | Démo par aidant, interface ultra-simple |
| **Ne comprend pas comment** | 50% | MOYENNE | Tutorial vidéo lent, explication text |
| **Pas de téléphone smart** | 25% | TRÈS-HAUTE | Version web responsive, SMS option |
| **Perd patience si lent** | 40% | MOYENNE | <2s analyses, feedback immédiat |
| **Oublie d'utiliser app** | 35% | MOYENNE | Notifications push douces, routine |
| **Isolé (pas d'aidant)** | 20% | CRITIQUE | Chatbot support, numéro téléphone |

### Métriques de Succès Personnalisées

#### Métrique #1: "Je me sens plus en sécurité"
- **Mesure:** NPS Question: "Je fais confiance à internet" (avant/après 3 mois)
- **Cible:** +40 points
- **Outil:** Sondage trimestriel

#### Métrique #2: "J'utilise l'app régulièrement"
- **Mesure:** DAU (Daily Active Users) parmi cohort seniors
- **Cible:** ≥40% de base utilisateur
- **Outil:** Analytics

#### Métrique #3: "J'ai évité une arnaque"
- **Mesure:** Survey: "Avez-vous détecté/bloqué une arnaque?" (oui/non)
- **Cible:** ≥20% de cohort rapportent une détection
- **Impact:** Économies réelles $$$

#### Métrique #4: "Je comprends mieux les arnaque"
- **Mesure:** Quiz score avant/après
- **Cible:** +50% amélioration moyennes
- **Outil:** Quiz intégré

---

## Persona 2: Aidant Familial

### Profil Démographique

| Attribut | Données |
|----------|---------|
| **Âge** | 35-65 ans (pic: 48 ans) |
| **Lien** | Enfant (60%), Petit-enfant (30%), Conjoint (10%) |
| **Situation** | Travail à temps plein (75%), Mixte (20%), Retraité (5%) |
| **Localisation** | Same province (70%), Autre province (25%), International (5%) |
| **Technologie** | Natif digital (80%), Immigrant (20%) |
| **Revenu** | $60K-120K/an |

### Pain Points

#### 1. Culpabilité & Anxiété
**Manifestation:**
- "Je n'aide pas assez mon père"
- "C'est de ma faute s'il s'est fait arnaquer"
- "Je devrais m'appeler plus souvent"

**Réalité:**
- Emploi exigeant (60+ heures/semaine)
- Géographie (500km+ distance)
- Culpabilité intrinsèque (enfant -> parent)

**Impact:**
- Appels ponctuels mais insuffisants
- Sentiment d'impuissance
- Demandes urgentes ("Papa! Tu as cliqué sur quoi?")

#### 2. Aucune Visibilité sur Situation Réelle
**Problème:**
```
Aidant: "Ma mère est-elle à risque?"
Réalité: Pas de données
  ├─ Ne sait pas combien d'arnaques elle reçoit
  ├─ Ne sait pas si elle clique sur des liens
  ├─ Ne sait pas ses patterns ("Elle regarde Mail 2x/jour")
  └─ Peut seulement réagir après coup ("Tu t'es fait arnaquer?")
```

**Besoin:**
- Tableau de bord simple
- Alertes si comportement suspect
- Historique sans surveillance invasive

#### 3. Difficultés de Communication
**Scénarios Réels:**
```
A) Explication Technique
   Aidant: "C'est un trojan, maman"
   Senior: "Un quoi? Un dinosaure?"
   → Confusion totale

B) Apprentissage Asynchrone
   Senior: "Comment je saurai la prochaine fois?"
   Aidant: "Ben... appelle-moi"
   → Pas d'autonomie, dépendance
```

#### 4. Besoin d'Éducation Aussi
**Réalité:** Aidants ne sont pas experts

```
Aidant: "Je reçois aussi des SMS bizarres...
        Comment je sais si c'est une arnaque?"
```

**Implication:** App doit servir AUSSI les aidants

### Objectifs Principaux

#### Objectif #1: Visibilité Douce (Pas Surveillance)
**"Je veux savoir que mon parent va bien, sans le surveiller"**

- Dashboard simple (analyses récentes, trends)
- Pas de micro-management
- Respecte privacy
- Opt-in parental (senior contrôle ce qui se partage)

#### Objectif #2: Capacité à Intervenir
**"Je veux pouvoir aider si problème"**

- Détection automatique risque élevé
- Alertes contextuelles
- Actions recommandées
- Chat support parent <-> aidant

#### Objectif #3: Auto-Éducation
**"Je veux aussi apprendre"**

- Mêmes features que senior
- Contenu un peu plus avancé
- Ressources pour expliquer à parents

### Cas d'Usages Critiques

#### Use Case #1: Alerte Risque Détecté
```
Scenario:
  Maman a analysé SMS "Compte bloqué" (elle l'a reconnu!)

✅ Aidant voit:
  - Notification: "Maman a analysé un SMS risqué (92/100)"
  - Contenu: "Compte bloqué" - Type: Phishing
  - Action: "Tout va bien?" (send check-in message)
  - Timeline: "Il y a 2 heures"

  Si c'était AVANT (sans app):
  ❌ Aidant découvrait par chance ou appel panique
```

#### Use Case #2: Tableau de Bord Familial
```
Vue: "Ma Famille" (Family Dashboard)
  ┌──────────────────────────────────┐
  │ Maman (73 ans) - SAINE            │
  │ ├─ Analyses ce mois: 8            │
  │ ├─ Dernière: Il y a 5 jours       │
  │ ├─ Risque moyen: 35/100 (Bas)     │
  │ └─ ✅ Aucune alerte               │
  │                                   │
  │ Papa (76 ans) - ATTENTIF          │
  │ ├─ Analyses ce mois: 14           │
  │ ├─ Dernière: Il y a 2 heures      │
  │ ├─ Risque moyen: 25/100 (Très Bas)│
  │ └─ ✅ Aucune alerte               │
  │                                   │
  │ Grand-Maman (88 ans) - URGENT     │
  │ ├─ Analyses ce mois: 2            │
  │ ├─ Dernière: Il y a 3 semaines    │
  │ ├─ Risque moyen: 65/100 (Moyen)   │
  │ └─ ⚠️ 3 alertes ce mois            │
  └──────────────────────────────────┘
```

#### Use Case #3: Coaching Parental
```
Situation: Aidant veut aider papa à reconnaître arnaque

Option A (Sans app):
  Aidant: "Regarde, ici et là, c'est suspect"
  Papa: "Ah oui?" (Oublie après)

Option B (Avec app):
  1. Aidant envoie scénario: "Test toi sur celui-ci"
  2. Papa fait exercice, reçoit feedback
  3. Aidant voit score: "80/100 - excellent!"
  4. Peut discuter: "Comment tu as su?"
  → Apprentissage meilleur
```

### Freins à l'Adoption

| Frein | Probabilité | Impact | Mitigation |
|-------|-------------|--------|-----------|
| **App supplémentaire = fatigue** | 60% | HAUTE | Intégration avec apps existantes (WhatsApp) |
| **Privacy concerns** | 50% | CRITIQUE | Full transparency, parent controls |
| **Parent refuse partage données** | 40% | MOYENNE | Opt-in, peut utiliser seul aussi |
| **Pas assez bénéfice pour aidant** | 30% | MOYENNE | Aidant a aussi features + apprentissage |
| **Coût/Prix** | 20% | BASSE | Gratuit MVP |

### Métriques de Succès

#### Métrique #1: Adoption du Dashboard Familial
- **Mesure:** % aidants ayant ≥1 famille member ajouté
- **Cible:** ≥50% de aidants invitent un parent
- **Timeline:** 3 mois

#### Métrique #2: Engagement Continu
- **Mesure:** % aidants qui check family dashboard ≥2x/mois
- **Cible:** ≥70% retention
- **Outil:** Analytics

#### Métrique #3: Confiance en Intervention
- **Mesure:** Survey: "Vous sentiez capable d'aider votre parent?"
- **Cible:** Avant: 30%, Après: 70%
- **Timeline:** Post-utilisation

---

## Persona 3: Conseiller Institutionnel

### Profil Démographique

| Attribut | Données |
|----------|---------|
| **Rôle** | Travailleur social, infirmière, coach |
| **Âge** | 30-55 ans |
| **Institution** | Clinique santé, Résidence seniors, Centre communautaire |
| **Expertise** | Santé/bien-être, PAS tech |
| **Population Servie** | 50-200 seniors |
| **Technologie** | Comfortable avec basics, novice avec innovations |

### Pain Points

#### 1. Responsabilité vs Ressources Limitées
**Réalité:**
- 1 travailleur social = 100+ clients
- Arnaque affecte 40% des clients
- Temps limité pour éducation individuelle

**Impact:**
```
Idéal: "Éduquer chaque client sur arnaques"
Réalité: "C'est dans ma liste, pas le temps"
```

#### 2. Manque d'Outil Efficace
**Situation Actuelle:**
- Brochures papier (oubliées, pas engageantes)
- Présentations groupe (seulement 30% retiennent)
- One-on-one impossible à scale

#### 3. Obligation de Devoir de Diligence
**Légal:**
- Devoir de care si senior est victime
- Documentation requise
- Responsabilité institutionnelle

**Besoin:**
- Preuve d'éducation ("J'ai expliqué")
- Historique d'alertes ("Elle a reçu arnaque")
- Actions documentées

### Objectifs

#### Objectif #1: Scalabilité d'Éducation
**"Je veux éduquer tous mes clients sans faire 1:1"**

- Outil auto-serveur (app)
- Accountability automatique
- Tracking de progrès
- Reports pour superviseurs

#### Objectif #2: Documentation & Compliance
**"Je veux prouver j'ai fait mon devoir"**

- Rapports auto-générés
- Audit trail
- Evidence d'interventions
- Conformité RGPD/PHIPAA

#### Objectif #3: Support pour Cas Complexes
**"J'ai besoin d'aide pour les clients difficiles"**

- Integration avec mon workflow
- Alertes si client problématique
- Ressources pour expliquer
- Escalation procedures

### Use Cases

#### Use Case #1: Groupe Education
```
Scenario:
  Conseiller fait présentation groupe (15 seniors)

Sans ScamGuard:
  ❌ Slide deck 20 min
  ❌ 50% endormis, 30% entendent pas bien
  ❌ Oublient 90% en 1 semaine

Avec ScamGuard:
  ✅ Présentation 5 min: "Voici 3 types d'arnaques"
  ✅ Puis: "Testez-vous avec app" (15 min)
  ✅ Résultats visibles ("Tu as 75%!")
  ✅ Rapports: "12/15 complétés, score moyen 68"
```

#### Use Case #2: Alerte Client à Risque
```
Scenario:
  Système détecte: Client A a 5 analyses risque élevé ce mois

✅ Conseiller reçoit:
  - Notification: "Client A shows increased risk pattern"
  - Recommandation: "May need check-in"
  - Actions: "Schedule 1:1 session"
```

#### Use Case #3: Reporting & Accountability
```
Document: "Arnaque Prevention Activity - Mars 2026"
  ├─ Total clients: 87
  ├─ Participants app: 64 (73%)
  ├─ Analyses complétées: 124
  ├─ Arnaque détectées: 12
  ├─ Avg. score: 72/100
  ├─ Most common type: SMS Banking (35%)
  └─ Note: "Significant improvement in awareness"
```

### Freins à l'Adoption

| Frein | Probabilité | Impact |
|-------|-------------|--------|
| **IT literacy** | 40% | MOYENNE - needs training |
| **System integration** | 60% | HAUTE - needs API/SSO |
| **Client privacy** | 70% | CRITIQUE - must be HIPAA-ready |
| **Adoption par clients** | 50% | HAUTE - if clients won't use, useless |
| **Support requis** | 40% | MOYENNE - needs helpdesk |

---

## Persona 4: Institution Financière

### Profil

| Attribut | Données |
|----------|---------|
| **Type** | Banques, Caisses populaires, Fintech |
| **Exemple** | Desjardins, RBC, Tangerine |
| **Motivation** | Fraud prevention, customer protection, liability reduction |
| **Budget** | $100K-1M/an pour prevention |
| **Scale** | 100K-10M customers |

### Pain Points

#### 1. Perte Financière par Fraude
- Moyenne: $50-200M/an par banque
- Coûts: Remboursements, investigations, support

#### 2. Responsabilité Légale
- Devoir de care envers customers
- Regulatory pressure (FINRA, PIPEDA)
- Reputation damage

#### 3. Customer Education Difficile
- Customers ignorent risks
- Education efforts ineffective
- Blâment banque ("Pourquoi vous m'aviez pas dit?")

### Objectifs

1. **Prevent fraud before it happens**
2. **Reduce liability via education**
3. **White-label solution for customers**

### Integration Model

```
Banque:
  ├─ Intègre ScamGuard dans app
  ├─ Rebrande avec logo banque
  ├─ Envoie notifications: "Test yourself"
  └─ Récupère reports: "X% clients trained"

Customers:
  ✅ Se sentent protégés
  ✅ Responsabilisés ("Je peux détcter moi-même")
  ✅ Confiance en banque
```

---

## Matrice Convergence

### Intersection Besoins par Persona

| Besoin | Senior | Aidant | Conseiller | Banque |
|--------|--------|--------|-----------|--------|
| **Détection arnaque** | ✅ CRITIQUE | ✅ Important | ✅ Important | ✅ CRITIQUE |
| **Education interactive** | ✅ CRITIQUE | ✅ Important | ✅ CRITIQUE | ✅ Important |
| **Dashboard tracking** | ❌ Pas | ✅ Important | ✅ CRITIQUE | ✅ Important |
| **Privacy/Control** | ✅ CRITIQUE | ✅ Important | ✅ CRITIQUE | ✅ CRITIQUE |
| **Rapports audit** | ❌ Pas | ❌ Pas | ✅ CRITIQUE | ✅ Important |
| **Voix/Accessibilité** | ✅ CRITIQUE | ❌ Pas | ❌ Pas | ❌ Pas |
| **API/Integration** | ❌ Pas | ❌ Pas | ✅ Important | ✅ CRITIQUE |

### Synergies (Win-Win)

| Interaction | Bénéfice Mutuel |
|------------|----------------|
| **Senior + Aidant** | Aidant en sait plus → Peut mieux expliquer |
| **Senior + Conseiller** | Conseiller tracks → Peut intervenir tôt |
| **Conseiller + Banque** | Banque envoie data → Conseiller cible à risque |
| **Aidant + Banque** | Banque alerts → Aidant peut intervenir |

### Conflits Potentiels

| Tension | Résolution |
|--------|----------|
| **Senior privacy vs Aidant visibility** | Opt-in controls, Senior decides what shared |
| **Banque white-label vs ScamGuard brand** | Dual branding possible (powered by ScamGuard) |
| **Conseiller workload + app training** | Automated onboarding, minimal training needed |

---

## Stratégies d'Adoption

### Stratégie #1: Senior-First, Family-Second

**Phase 1 (Mois 1-2):**
- Launch avec Senior focus
- Ultra-simple interface
- Zero learning curve
- Free/freemium

**Phase 2 (Mois 2-3):**
- "Invite your family" feature
- Family dashboard unlocked with invitation
- Incentive: "Senior gets bonus points"

**Avantage:**
- Not invasive (Senior initiates)
- Organic growth via family network
- Quality user base (intrinsically motivated)

### Stratégie #2: Partenariat Institutionnel

**Approach:**
1. **Identify Champion** - Find progressive health worker/banker
2. **Pilot Program** - 50 seniors, 3 months
3. **Measure Impact** - Report results
4. **Scale** - Full deployment + white-label

**Metrics for Success:**
- Adoption >60%
- Engagement >3x/month
- Fraud detection >20%
- Satisfaction >4.5/5

### Stratégie #3: Family Activation Loop

```
Loop: Senior uses → Family sees → Family helps → Senior uses more

1. Senior enrolls (web/mobile)
   ↓
2. Senior analyzes message
   ↓
3. App shows: "Share with family?" (optional)
   ↓
4. Family sees analysis in dashboard
   ↓
5. Family sends check-in: "Saw that email - good catch!"
   ↓
6. Senior motivated, does more analyses
   ↓
→ Loop continues
```

### Stratégie #4: Institutional Trust

**Key Elements:**
- Certification from health/banking bodies
- Endorsement from organizations
- Compliance badges
- Privacy seal (Privacy by Design)

---

## Conclusion

**ScamGuard serves a complex ecosystem:**

1. **Seniors** get independence + confidence
2. **Families** get visibility + ability to help
3. **Institutions** get scale + documentation
4. **Fintech** gets liability reduction + customer loyalty

**Key Success Factors:**
- ✅ Ultra-accessible for lowest-literacy seniors
- ✅ Non-invasive family features (opt-in)
- ✅ Institutional-grade compliance
- ✅ Win-win for all personas
- ✅ Privacy-first approach throughout

**Next:** See Competitive Analysis & Feature Matrix for market positioning.

---

**Document créé:** 12 mars 2026
**Responsibility:** Product Strategy
**Version:** 1.0 Complete
