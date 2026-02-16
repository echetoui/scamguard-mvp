# 🎨 Génération des Diagrammes d'Architecture

## Options pour visualiser/générer les images

### Option 1: Visualiser sur GitHub (Recommandé ✅)

Les diagrammes Mermaid s'affichent automatiquement sur GitHub:

```bash
git add docs/architecture-diagram.md
git commit -m "docs: add architecture diagrams"
git push
```

Puis ouvrir: `https://github.com/echetoui/scamguard-mvp/blob/main/docs/architecture-diagram.md`

### Option 2: VS Code avec Extension

1. Installer l'extension "Markdown Preview Mermaid Support"
2. Ouvrir `docs/architecture-diagram.md`
3. Cliquer sur "Preview" (Cmd+Shift+V)

### Option 3: Générer des Images PNG/SVG

#### Installation de mermaid-cli

```bash
# Avec npm
npm install -g @mermaid-js/mermaid-cli

# Ou avec Homebrew
brew install mermaid-cli
```

#### Générer les images

```bash
# Méthode automatique
./scripts/generate_images.sh

# Ou avec Python
python3 scripts/generate_diagrams.py
```

Les images seront générées dans `docs/images/`:
- `architecture-complete.png/svg`
- `flux-scenario.png/svg`
- `flux-analyse.png/svg`
- `rate-limiting.png/svg`
- `dynamodb-schema.png/svg`
- `monitoring.png/svg`
- `costs.png/svg`
- `security-layers.png/svg`

### Option 4: Outils en Ligne

Copier-coller le code Mermaid dans:
- https://mermaid.live/
- https://mermaid.ink/

Puis télécharger l'image.

## Exemple: Générer une image manuellement

```bash
# Créer un fichier .mmd
cat > architecture.mmd << 'EOF'
graph TB
    USER[User] --> API[API Gateway]
    API --> LAMBDA[Lambda]
    LAMBDA --> DDB[(DynamoDB)]
EOF

# Générer PNG
mmdc -i architecture.mmd -o architecture.png -b white

# Générer SVG
mmdc -i architecture.mmd -o architecture.svg
```

## Formats supportés

- **PNG** - Pour documentation, présentations
- **SVG** - Pour web, scalable
- **PDF** - Pour impression (via SVG)

## Résolution recommandée

- PNG: 2000x1500px (haute qualité)
- SVG: Vectoriel (scalable)

## Troubleshooting

### Erreur: "mmdc: command not found"

```bash
npm install -g @mermaid-js/mermaid-cli
```

### Erreur: "Puppeteer Chrome not found"

```bash
# Réinstaller avec Chromium
npm install -g @mermaid-js/mermaid-cli --force
```

### Erreur: Permission denied

```bash
chmod +x scripts/generate_images.sh
```

## Intégration CI/CD

Pour générer automatiquement les images lors du push:

```yaml
# .github/workflows/diagrams.yml
name: Generate Diagrams
on: [push]
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @mermaid-js/mermaid-cli
      - run: ./scripts/generate_images.sh
      - uses: actions/upload-artifact@v3
        with:
          name: diagrams
          path: docs/images/
```

---

**Recommandation:** Utiliser GitHub pour visualiser directement les diagrammes Mermaid sans générer d'images! 🚀
