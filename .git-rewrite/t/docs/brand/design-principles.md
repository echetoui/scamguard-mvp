---
name: Design Principles
description: 5 non-negotiable principles guiding all ScamGuard design decisions
type: reference
---

# Design Principles

These 5 principles are non-negotiable. When in conflict, they're ordered by priority below.

---

## 1. **Seniors First** (Priority: HIGHEST)

Every design decision must be defensible with someone 70+ years old with reduced vision and tremors.

### Means:
- 18px minimum body text (16px only in truly critical mobile scenarios)
- 48–60px touch targets (not the standard 44px)
- High contrast: 7:1 minimum on important content
- Clear, thick iconography (Material Symbols Rounded, weight 600+)
- Simple color psychology (green = good, red = danger, no purple for action)
- One idea per screen
- No animated transitions that obscure content (respect prefers-reduced-motion)
- Large error messages with yellow/red background + icon + text

### Example ✅
A forgot-password flow with:
- 20px button text
- 56px height button
- Clear: "Envoyer un code par courriel" (not "Reset via email")
- Large input fields, no floating labels
- Progress bar (not step counter)

### Counter-Example ❌
A forgot-password flow with:
- 14px text
- 44px button
- Icon-only buttons
- Floating labels on input
- No feedback during submission
- Micro-interaction animations

---

## 2. **Clarity Over Elegance** (Priority: HIGH)

Good design is invisible. Great design for seniors is OBVIOUS.

### Means:
- No hidden functionality (no hamburger menu for primary navigation)
- All actions visible by default
- Error messages explain WHAT and HOW TO FIX
- Color-blind safe (never red/green alone)
- Plain language (no jargon, no idioms)
- Redundant encoding (color + icon + text)

### Example ✅
Error message:
```
❌ Votre code a expiré.

Nous avons envoyé un nouveau code à votre cellulaire.
Entrez le nouveau code ci-dessous.
```

### Counter-Example ❌
Error message:
```
⚠️ 401 Unauthorized
```

---

## 3. **Trust Through Transparency** (Priority: HIGH)

Users should always know what ScamGuard is doing, why, and what happens to their data.

### Means:
- No dark patterns (no disabled unsubscribe, no buried privacy controls)
- Explicit consent for every data use
- "Why does ScamGuard show this?" links on every alert
- Visible data retention: "We keep your SMS history for 30 days, then delete"
- Explain AI limitations: "Our AI is 92% accurate for phishing. Always double-check"
- No algorithmic opacity (if we hide you something, we say why)

### Example ✅
Suspicious email alert with:
```
🛡️ Probable Arnaque: Compte Bancaire en Danger

Pourquoi ScamGuard pense ceci:
- Demande urgente de vérification
- URL raccourcie (masque vrai domaine)
- Pas d'accueil personnalisé

Ce que vous devez faire:
1. Ne cliquez PAS le lien
2. Appelez votre banque au +1-555-REAL-BANK (le vrai numéro)
3. Signalez ce message aux autorités
```

### Counter-Example ❌
```
🚨 DANGER

Action required. Click here immediately.
```

---

## 4. **Consistency Across Context** (Priority: MEDIUM)

The same action should always look, feel, and work the same way.

### Means:
- Same button style = same action type (primary button always = main action)
- Same terminology throughout (we say "courriel" OR "email", never both)
- Same error recovery pattern on every screen
- Same success feedback (color + icon + text consistently)
- Responsive, not different (same design logic scaled to screen, not a "mobile app")

### Example ✅
"Cancel" button is always:
- Secondary styling (outline, not filled)
- Same position (right side, bottom-right)
- Same size (48–60px)
- Same wording ("Annuler", not "Quitter" or "Fermer")
- Same action (discard changes, return to previous screen)

### Counter-Example ❌
"Cancel" sometimes is:
- Text link (page 1)
- Gray button (page 2)
- Icon-only X (page 3)
- Position varies (sometimes left, sometimes right)

---

## 5. **Simplicity in Scope** (Priority: MEDIUM)

Each screen solves ONE problem. One idea per interaction.

### Means:
- No more than 3 main actions per screen
- Modal should have 2 buttons max
- One-step signup (email + password, nothing else)
- Forms have 1–3 fields per page (not 10 fields dumped at once)
- Cards show essential info only (expandable for details)

### Example ✅
SMS Simulator screen:
```
[Threat Level: 🔴 HIGH]
[SMS Message content]
"Est-ce une arnaque ou un vrai message?"
[🚨 C'est une arnaque] [✅ Vrai message]
```

### Counter-Example ❌
```
[Threat Level, Institution, Date, Category tags]
[SMS Full content with formatting]
[5 radio buttons: Arnaque, Probable, Pas sûr, Légitime, Pas classé]
[Confidence score slider]
[Share button] [Report button] [Save button] [Review button]
```

---

## Decision Hierarchy

**When two principles conflict, use this order:**

1. **Seniors First** — Always wins if there's a safety or accessibility conflict
2. **Clarity** — Wins over "pretty" design
3. **Trust** — Wins over convenience
4. **Consistency** — Wins over per-screen optimization
5. **Simplicity** — Wins if it means removing a feature

### Example Conflict Resolution

**Conflict**: "Should we add a 'social sharing' button to the SMS Simulator results?"

1. **Seniors First**: Will a 70-year-old use it? Probably not, might confuse them.
2. **Clarity**: Does it add clarity to the results? No, it's a distraction.
3. **Trust**: Does it help trust? No, it might seem like we're selling their data.
4. **Consistency**: Inconsistent with "one idea per screen."
5. **Simplicity**: Doesn't simplify, adds complexity.

**Decision**: ❌ Don't add the share button. Keep the screen focused on the score.

---

## Checklist for Every Design Proposal

- [ ] Does my senior (70+) grandparent understand this without explanation?
- [ ] Can they interact with this without tremors causing misclicks?
- [ ] Is the message in plain Quebec French?
- [ ] Did I use color + icon + text (redundant encoding)?
- [ ] Does every screen solve exactly one problem?
- [ ] Is every interactive element 48–60px?
- [ ] Did I explain why this design choice (not just that it looks nice)?
- [ ] Is there a high-contrast dark mode version?
- [ ] Did I test this with a screen reader?
- [ ] Did I get feedback from someone 60+ before shipping?
