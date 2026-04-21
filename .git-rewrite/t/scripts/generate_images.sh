#!/bin/bash
set -e

echo "🎨 Génération des diagrammes d'architecture"
echo "==========================================="

# Vérifier si mmdc est installé
if ! command -v mmdc &> /dev/null; then
    echo "❌ mermaid-cli (mmdc) n'est pas installé"
    echo ""
    echo "Installation:"
    echo "  npm install -g @mermaid-js/mermaid-cli"
    echo ""
    echo "Ou avec Homebrew:"
    echo "  brew install mermaid-cli"
    exit 1
fi

echo "✅ mermaid-cli trouvé"

# Créer le dossier images
mkdir -p docs/images

# Extraire et générer chaque diagramme
cd docs

echo ""
echo "📊 Génération des images..."
echo ""

# Alternative: Utiliser le script Python
if command -v python3 &> /dev/null; then
    python3 ../scripts/generate_diagrams.py
else
    echo "❌ Python3 requis"
    exit 1
fi

echo ""
echo "🎉 Terminé! Images disponibles dans docs/images/"
echo ""
echo "Fichiers générés:"
ls -lh images/*.png 2>/dev/null || echo "Aucune image PNG"
ls -lh images/*.svg 2>/dev/null || echo "Aucune image SVG"
