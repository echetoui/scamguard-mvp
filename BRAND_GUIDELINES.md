# 🛡️ ScamGuard - Charte Graphique & Identité de Marque

**Version:** 1.0
**Date:** 22 février 2026
**Statut:** Officiel

---

## 1. Identité & Mission (Brand DNA)

### Mission
Protéger les populations vulnérables du Québec contre la fraude numérique grâce à une technologie bienveillante et accessible.

### Valeurs Clés
1.  **Accessibilité Radicale :** Tout doit être utilisable par une personne de 85 ans avec une vision réduite et des tremblements.
2.  **Confiance (Trust) :** Nous sommes le gardien, pas le policier.
3.  **Simplicité :** Pas de jargon technique. On ne dit pas "Phishing", on dit "Hameçonnage" ou "Tentative de vol".
4.  **Ancrage Local :** Nous parlons le français du Québec (fr-CA). Nous connaissons Desjardins, Hydro-Québec et la SAAQ.

### Slogan
*Principal :* **"Votre bouclier contre la fraude numérique."**
*Secondaire :* **"La sécurité, simplement."**

---

## 2. Palette de Couleurs (Color Palette)

La palette est conçue pour respecter les normes **WCAG AAA** (contraste maximal).

### Couleurs Primaires

| Couleur | Hex | Nom | Usage | Signification |
|---------|-----|-----|-------|---------------|
| !#1E40AF | `#1E40AF` | **Bleu Royal** | Boutons principaux, En-têtes, Marque | Sécurité bancaire et institutionnelle. |
| !#F3F4F6 | `#F3F4F6` | **Gris Clair** | Arrière-plan général | Fait ressortir les cartes blanches par contraste. |
| !#111827 | `#111827` | **Noir Encre** | Textes courants | Lisibilité maximale sans être agressif. |

### Couleurs Sémantiques (Feedback)

| Couleur | Hex | Nom | Usage | Signification |
|---------|-----|-----|-------|---------------|
| !#166534 | `#166534` | **Vert Sûr** | Validation, Scores élevés (>50), Succès | "C'est sécuritaire", "Action réussie". |
| !#B91C1C | `#B91C1C` | **Rouge Danger** | Erreur, Danger, Arnaque détectée | "Attention", "Ceci est une arnaque". |
| !#92400E | `#92400E` | **Ambre Alerte** | Avertissements, Scores moyens | "Soyez prudent", "Doute". |

### Couleurs Secondaires

| Couleur | Hex | Nom | Usage |
|---------|-----|-----|-------|
| !#e8f5e9 | `#e8f5e9` | **Vert Menthe** | Fonds des zones de succès/coaching. |
| !#ffebee | `#ffebee` | **Rouge Pâle** | Fonds des zones d'alerte. |

---

## 3. Typographie (Typography)

L'objectif est la lisibilité absolue.

### Police Principale : **Inter** ou **Roboto**
*Pourquoi ?* Sans-serif, grandes ouvertures, distinction claire entre les caractères (ex: I majuscule et l minuscule).

### Hiérarchie des Tailles (Mobile First)

*   **H1 (Titres Écrans) :** 32px (Bold) - *Bleu Gardien*
*   **H2 (Sous-titres) :** 26px (Semi-Bold) - *Noir Encre*
*   **H3 (Sections) :** 22px (Medium) - *Noir Encre*
*   **Body (Texte courant) :** 18px (Regular) - *Hauteur de ligne 1.6*
*   **Labels / Boutons :** 20px (Bold) - *Tout en majuscules ou Title Case*
*   **Captions :** 16px (Regular) - *Jamais plus petit que 16px*

> **Règle d'or :** Aucun texte ne doit être inférieur à 16px.

---

## 4. Iconographie & Logo

### Le Logo
*   **Symbole :** Un bouclier (Shield) simple avec une coche (Checkmark) ou une loupe au centre.
*   **Style :** Traits épais (Stroke width: 2px+), formes pleines. Pas de détails fins.
*   **Emoji associé :** 🛡️ (Utilisé dans l'interface textuelle).

### Style des Icônes
*   Utiliser des icônes **remplies (filled)** plutôt que des contours (outlined) pour une meilleure visibilité.
*   **Taille minimale :** 32x32px visuellement.

---

## 5. Règles UX/UI (Design System)

### La Règle des 60px
Tous les éléments interactifs (boutons, champs de saisie) doivent avoir une hauteur minimale de **60px**.
*Pourquoi ?* Pour accommoder les doigts moins précis ou les tremblements (Parkinson, arthrite).

### Espacement (Whitespace)
*   Utiliser des marges généreuses (min 20px).
*   Ne jamais entasser l'information. Un concept par écran si possible.

### Feedback Visuel & Sonore
*   Chaque action doit avoir une réaction immédiate.
*   Utiliser la double validation : Couleur + Icône + Texte (ex: Ne pas utiliser juste du rouge, mais Rouge + Icône Croix + Texte "Erreur").
*   **Focus Clavier (Accessibilité) :** Tout élément interactif doit avoir un contour visible au focus (`outline: 3px solid var(--color-focus)`).

---

## 6. Ton et Langage (Voice & Tone)

### Ce que nous sommes
*   **Bienveillant :** "Ne vous inquiétez pas, nous allons vérifier ensemble."
*   **Direct :** "Ceci est une arnaque." (Pas de "Il semblerait que...")
*   **Éducatif :** "Les banques ne demandent jamais votre mot de passe par SMS."

### Vocabulaire Québécois (Lexique)

| Anglais / Français de France | **ScamGuard (Québec)** |
|------------------------------|------------------------|
| Email | **Courriel** |
| Chat | **Clavardage** |
| Smartphone | **Cellulaire** ou **Téléphone** |
| Login | **Connexion** |
| Sign up | **M'inscrire** |
| Phishing | **Hameçonnage** ou **Fraude** |
| Scam | **Arnaque** |
| Dashboard | **Mon Suivi** ou **Mon Tableau de bord** |
| XP (Experience Points) | **Points** ou **Points de vigilance** |

---

## 7. Exemple d'Implémentation CSS (Variables)

```css
:root {
  /* Couleurs */
  --color-primary: #1E40AF;
  --color-primary-dark: #1e3a8a;
  --color-success: #166534;
  --color-danger: #B91C1C;
  --color-warning: #92400E;
  --color-background: #F3F4F6;
  --color-surface: #ffffff;
  --color-text-main: #111827;
  --color-text-secondary: #555555;

  /* Typographie */
  --font-family-base: 'Inter', 'Roboto', sans-serif;
  --font-size-base: 18px;
  --font-size-h1: 32px;
  --font-size-button: 20px;

  /* Espacement & Formes */
  --spacing-unit: 8px;
  --border-radius-lg: 16px;
  --border-radius-sm: 8px;
  --touch-target-min: 60px;
}
```