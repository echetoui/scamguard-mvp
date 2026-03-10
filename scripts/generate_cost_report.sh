#!/bin/bash

# ScamGuard MVP - Script de Rapport de Coûts
# Usage: ./generate_cost_report.sh [--json] [--save]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COST_SCRIPT="$SCRIPT_DIR/cost_report.py"
OUTPUT_DIR="$SCRIPT_DIR/../reports"

# Créer le dossier reports s'il n'existe pas
mkdir -p "$OUTPUT_DIR"

echo "🛡️ ScamGuard MVP - Générateur de Rapport de Coûts"
echo "=================================================="

# Vérifier les prérequis
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI n'est pas installé"
    exit 1
fi

# Vérifier la configuration AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI n'est pas configuré ou les credentials sont invalides"
    echo "Exécutez: aws configure"
    exit 1
fi

echo "✅ Prérequis validés"
echo ""

# Installer les dépendances Python si nécessaire
if ! python3 -c "import boto3" &> /dev/null; then
    echo "📦 Installation de boto3..."
    pip3 install boto3
fi

# Générer le rapport
echo "📊 Génération du rapport de coûts..."
echo ""

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$OUTPUT_DIR/cost_report_$TIMESTAMP.txt"

if [[ "$1" == "--json" ]]; then
    python3 "$COST_SCRIPT" --json | tee "$REPORT_FILE"
else
    python3 "$COST_SCRIPT" | tee "$REPORT_FILE"
fi

echo ""
echo "✅ Rapport généré et sauvegardé: $REPORT_FILE"

# Ouvrir le rapport si demandé
if [[ "$2" == "--open" ]]; then
    if command -v code &> /dev/null; then
        code "$REPORT_FILE"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        open "$REPORT_FILE"
    fi
fi

echo ""
echo "💡 Conseils:"
echo "  - Exécutez ce script quotidiennement pour suivre les coûts"
echo "  - Utilisez --json pour intégrer dans d'autres outils"
echo "  - Les rapports sont sauvegardés dans: $OUTPUT_DIR"