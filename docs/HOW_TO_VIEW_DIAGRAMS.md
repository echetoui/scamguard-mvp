# 🎨 Comment Voir les Diagrammes d'Architecture

## ✅ Méthode 1: GitHub (Le plus simple!)

1. Push le fichier sur GitHub:
```bash
git add docs/architecture-diagram.md
git commit -m "docs: add architecture diagrams"
git push
```

2. Ouvrir dans le navigateur:
```
https://github.com/echetoui/scamguard-mvp/blob/main/docs/architecture-diagram.md
```

Les diagrammes Mermaid s'affichent automatiquement! ✨

## ✅ Méthode 2: Mermaid Live Editor

1. Ouvrir https://mermaid.live/
2. Copier-coller un bloc Mermaid du fichier `architecture-diagram.md`
3. Télécharger l'image (PNG/SVG)

## ✅ Méthode 3: VS Code

1. Installer l'extension "Markdown Preview Mermaid Support"
2. Ouvrir `docs/architecture-diagram.md`
3. Appuyer sur `Cmd+Shift+V` (macOS) ou `Ctrl+Shift+V` (Windows)

## ✅ Méthode 4: Générer des Images Localement

### Installation

```bash
# Installer mermaid-cli
npm install -g @mermaid-js/mermaid-cli
```

### Générer toutes les images

```bash
./scripts/generate_images.sh
```

Les images seront dans `docs/images/`:
- architecture-complete.png
- flux-scenario.png
- flux-analyse.png
- rate-limiting.png
- dynamodb-schema.png
- monitoring.png
- costs.png
- security-layers.png

---

**Recommandation:** Utiliser GitHub (Méthode 1) - Aucune installation requise! 🚀
