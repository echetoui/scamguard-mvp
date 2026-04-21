# Resources Tab - Manuel de Test Interactif

**Phase:** 5E.1 (Jour 2)
**Date:** 28 février 2026
**Statut:** Test checklist ready

---

## 🎯 Guide de Test - Comment Tester

### 1. Démarrer l'application
```bash
cd frontend
npm start
# Ouvre http://localhost:3000
```

### 2. Naviguer vers Ressources
```
Cliquer sur l'onglet "📚 Ressources" en bas
```

### 3. Suivre les tests ci-dessous

---

## 🧪 Tests Interactifs

### Groupe 1: Navigation par Catégories

#### Test 1.1: Navigation Buttons
```
ACTION:
1. Cliquer sur "🛡️ Guides de Blocage"
2. Vérifier que le bouton change de couleur
3. Vérifier que le contenu change

RÉSULTAT ATTENDU:
✓ Bouton devient vert (#4CAF50)
✓ Contenu change immédiatement
✓ Animation fade-in visible
✓ Pas de white flash
```

#### Test 1.2: Tab Navigation Complète
```
ACTION:
1. Cliquer sur chaque onglet:
   - 🛡️ Guides de Blocage
   - 📞 Par Type
   - 🎓 Conseils
   - 📹 Vidéos
   - ❓ FAQ
   - 🔗 Ressources

RÉSULTAT ATTENDU:
✓ Chaque onglet a du contenu unique
✓ Transition fluide entre onglets
✓ Aucun contenu mal affiché
✓ Pas d'erreurs console
```

#### Test 1.3: Keyboard Navigation
```
ACTION:
1. Appuyer sur la touche Tab
2. Navigation à travers les boutons
3. Appuyer sur Enter sur un bouton

RÉSULTAT ATTENDU:
✓ Focus outline visible autour des boutons
✓ Outline vert (#4CAF50)
✓ Espace de 2px autour du bouton
✓ Clic sur Enter fonctionne
```

---

### Groupe 2: Guides de Blocage

#### Test 2.1: Expansion/Collapse
```
ACTION:
1. Cliquer sur une guide card (ex: "Bloquer sur Android")
2. Vérifier l'expansion
3. Cliquer à nouveau pour fermer

RÉSULTAT ATTENDU:
✓ Card s'ouvre avec animation
✓ Flèche ▼ tourne 180°
✓ Contenu animé vers le bas
✓ Card se referme sans accroc
✓ Animation fluide
```

#### Test 2.2: Méthodes Multiples
```
ACTION:
1. Ouvrir une guide avec plusieurs méthodes
2. Vérifier qu'on voit toutes les méthodes
3. Lire les instructions

RÉSULTAT ATTENDU:
✓ Tous les numéros d'étape visibles
✓ Chaque étape numérotée (1, 2, 3...)
✓ Numéros verts sur fond blanc
✓ Instructions claires
```

#### Test 2.3: Platform Grouping
```
ACTION:
1. Onglet "Guides de Blocage"
2. Vérifier les sections

RÉSULTAT ATTENDU:
✓ Section "🤖 Android" en haut
✓ Section "🍎 iPhone (iOS)" dessous
✓ Guides correctement groupés
✓ Cards responsive
```

---

### Groupe 3: Blocage par Type

#### Test 3.1: Type Grouping
```
ACTION:
1. Cliquer sur "📞 Par Type"
2. Vérifier les groupes:
   - ☎️ Appels Téléphoniques
   - 💬 SMS et Messages
   - 📱 Applications Populaires

RÉSULTAT ATTENDU:
✓ Tous les groupes visibles
✓ Cards bien organisées
✓ Icons affichées
```

#### Test 3.2: App Quick Links
```
ACTION:
1. Scroller pour voir "Applications Populaires"
2. Vérifier les 4 apps

RÉSULTAT ATTENDU:
✓ 4 cartes visibles:
  - 💚 WhatsApp
  - ✈️ Telegram
  - 👥 Messenger
  - 📧 Gmail
✓ Hover effect fonctionne
✓ Icons visibles
```

---

### Groupe 4: Conseils de Sécurité

#### Test 4.1: Checklist Expansion
```
ACTION:
1. Cliquer sur "🎓 Conseils"
2. Cliquer sur "⚠️ AVANT de Bloquer"
3. Vérifier l'expansion

RÉSULTAT ATTENDU:
✓ Card s'ouvre
✓ Contient 9 items
✓ Checkboxes visibles (grisées)
✓ Texte lisible
```

#### Test 4.2: Emergency Card
```
ACTION:
1. Scroller pour voir "En Cas d'Arnaque"
2. Vérifier la card orange

RÉSULTAT ATTENDU:
✓ Card visible avec gradient orange
✓ Title "🆘 En Cas d'Arnaque"
✓ Timeline en 2 colonnes
✓ Texte blanc lisible
✓ Points clés en rouge (urgent)
```

#### Test 4.3: Signaling Cards
```
ACTION:
1. Voir les 4 cartes de signalement
2. Cliquer sur chaque

RÉSULTAT ATTENDU:
✓ 4 cartes:
  - 🚨 À la POLICE
  - 🏦 À votre BANQUE
  - 📱 À l'OPÉRATEUR
  - 🛡️ À ScamGuard
✓ Instructions visibles
✓ Liens avec href correct
```

---

### Groupe 5: FAQ

#### Test 5.1: Search Box
```
ACTION:
1. Cliquer sur "❓ FAQ"
2. Cliquer dans "Rechercher dans la FAQ..."
3. Taper "bloquer"

RÉSULTAT ATTENDU:
✓ Search box focus (outline vert)
✓ Questions filtrées en temps réel
✓ Seulement questions avec "bloquer"
✓ Catégories s'adaptent
```

#### Test 5.2: FAQ Expansion
```
ACTION:
1. Cliquer sur une question (ex: "Qu'est-ce qui se passe...")
2. Vérifier l'expansion

RÉSULTAT ATTENDU:
✓ Question sélectionnée
✓ Réponse apparaît avec animation
✓ Flèche tourne
✓ Cliquer à nouveau ferme
```

#### Test 5.3: Search Clear
```
ACTION:
1. Effacer le texte de recherche
2. Vérifier que toutes les questions réapparaissent

RÉSULTAT ATTENDU:
✓ Toutes les 10 questions visibles
✓ Pas de "No results"
✓ Catégories restaurées
```

---

### Groupe 6: Vidéos

#### Test 6.1: Filter Buttons
```
ACTION:
1. Cliquer sur "📹 Vidéos"
2. Cliquer sur "Blocage"
3. Cliquer sur "Tous"

RÉSULTAT ATTENDU:
✓ "Blocage" filtre les vidéos
✓ 2 vidéos Android/iOS
✓ "Tous" affiche 6 vidéos
✓ Boutons highlighting change
```

#### Test 6.2: Video Cards Hover
```
ACTION:
1. Voir les cartes vidéos
2. Passer la souris sur une carte

RÉSULTAT ATTENDU:
✓ Card s'élève (shadow)
✓ Bouton play ▶️ apparaît
✓ Animation smooth
✓ Tout reste cliquable
```

#### Test 6.3: Modal Video
```
ACTION:
1. Cliquer sur une vidéo
2. Vérifier le modal

RÉSULTAT ATTENDU:
✓ Modal apparaît avec animation
✓ Fond sombre semi-transparent
✓ Placeholder vidéo visible
✓ Titre et description affichés
✓ Bouton X en haut à droite
```

#### Test 6.4: Modal Close
```
ACTION:
1. Modal ouvert
2. Cliquer sur X
3. Cliquer sur le fond sombre

RÉSULTAT ATTENDU:
✓ X ferme le modal
✓ Clic ailleurs sur fond sombre aussi
✓ Modal disparaît avec animation
```

---

### Groupe 7: Ressources Externes

#### Test 7.1: Emergency Cards
```
ACTION:
1. Cliquer sur "🔗 Ressources"
2. Voir les cartes pays

RÉSULTAT ATTENDU:
✓ 5 cartes pays visibles:
  - 🇧🇪 Belgique
  - 🇫🇷 France
  - 🇪🇸 Espagne
  - 🇨🇭 Suisse
  - 🇨🇦 Canada
✓ Border orange (#ff9800)
```

#### Test 7.2: Country Selection
```
ACTION:
1. Cliquer sur "🇧🇪 Belgique"
2. Vérifier l'expansion
3. Cliquer à nouveau

RÉSULTAT ATTENDU:
✓ Détails apparaissent
✓ 📞 Police: numéro affiché
✓ 🏦 Banque: instruction
✓ 📋 Signaler: lien
✓ Cliquer à nouveau referme
```

#### Test 7.3: Link Categories
```
ACTION:
1. Scroller après emergency section
2. Voir les 4 catégories:
   - 🚨 Signaler à la Police
   - 💳 Récupération de Fraude
   - ⚖️ Support Juridique
   - 📱 Signaler à Opérateur

RÉSULTAT ATTENDU:
✓ Toutes les catégories visibles
✓ Cards bien organisées
✓ Links avec href correct
✓ Icons affichées
```

#### Test 7.4: External Links
```
ACTION:
1. Cliquer sur un lien (ex: www.police.be)
2. Vérifier l'ouverture

RÉSULTAT ATTENDU:
✓ Lien s'ouvre dans nouvel onglet
✓ Pas de redirection
✓ Pas d'erreur 404
```

---

## 📱 Responsive Design Tests

### Mobile (< 480px)
```
ACTIONS:
1. Ouvrir DevTools (F12)
2. Activer responsive design (Ctrl+Shift+M)
3. Mettre dimension: 375x667 (iPhone SE)

TESTS:
☐ Navigation buttons affichés
☐ Aucune scroll horizontal
☐ Buttons >= 44x44px
☐ Text >= 14px
☐ Cards pleins écran
☐ Modals visibles
☐ Tout cliquable
```

### Tablet (768px)
```
ACTIONS:
1. Dimension: 768x1024

TESTS:
☐ 2-column layout pour cartes
☐ Navigation visible
☐ Content readable
☐ Spacing correct
```

### Desktop (1200px)
```
ACTIONS:
1. Dimension: 1200x800

TESTS:
☐ 3-column layout
☐ Full width content
☐ Sidebar navigation possible
☐ Hover effects smooth
☐ Animations 60fps
```

---

## ♿ Accessibility Tests

```
KEYBOARD NAVIGATION:
☐ Tab - Navigate through all elements
☐ Enter/Space - Activate buttons
☐ Arrow keys - Navigate within lists (optional)
☐ Escape - Close modals

SCREEN READER (VoiceOver macOS):
☐ All buttons have accessible names
☐ Icons have aria-hidden="true"
☐ Role attributes correct
☐ Labels clear and descriptive

VISUAL:
☐ Color contrast >= 4.5:1
☐ No small text
☐ Icons supplemented with text
☐ Focus indicators visible

TOUCH:
☐ Min 44x44px target size
☐ Touch spacing adequate
☐ No accidental taps
```

---

## 🐛 Bug Report Template

Si vous trouvez un bug:

```
### Bug Title: [Brief description]

**Expected:**
What should happen

**Actual:**
What actually happens

**Steps:**
1. Do this
2. Then this
3. Then that

**Platform:**
- Browser: Chrome/Safari/Firefox
- Device: Desktop/Mobile/Tablet
- Screen size: (if mobile)

**Console Errors:**
(Any JS errors?)

**Screenshot:**
(If possible)
```

---

## ✅ Test Completion Checklist

- [ ] Tous les tests Groupe 1 passés
- [ ] Tous les tests Groupe 2 passés
- [ ] Tous les tests Groupe 3 passés
- [ ] Tous les tests Groupe 4 passés
- [ ] Tous les tests Groupe 5 passés
- [ ] Tous les tests Groupe 6 passés
- [ ] Tous les tests Groupe 7 passés
- [ ] Mobile tests passés
- [ ] Tablet tests passés
- [ ] Desktop tests passés
- [ ] Accessibility tests passés
- [ ] Aucun bug critique

---

## 📝 Notes de Test

```
Date de test: ___________
Testeur: ________________
Navigateur: _____________
Appareil: _______________
Résolution: _____________

Problèmes trouvés:
1. _____________________
2. _____________________
3. _____________________

Notes générales:
_____________________
_____________________
```

---

**Jour 2 - Testing Complete! 🎉**
