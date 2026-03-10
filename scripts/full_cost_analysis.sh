#!/bin/bash

# ScamGuard MVP - Rapport Complet de Coûts et Optimisations
# Usage: ./full_cost_analysis.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../reports"

mkdir -p "$OUTPUT_DIR"

echo "🛡️ ScamGuard MVP - Analyse Complète des Coûts"
echo "=============================================="
echo ""

# Vérifications
if ! command -v python3 &> /dev/null || ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Prérequis manquants (Python3 ou AWS CLI)"
    exit 1
fi

# Installation des dépendances
if ! python3 -c "import boto3" &> /dev/null; then
    pip3 install boto3 > /dev/null 2>&1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
COMBINED_REPORT="$OUTPUT_DIR/full_cost_analysis_$TIMESTAMP.txt"

echo "📊 ÉTAPE 1/2: Génération du rapport de coûts actuels..."
echo "======================================================" > "$COMBINED_REPORT"
echo "🛡️ ScamGuard MVP - Analyse Complète des Coûts" >> "$COMBINED_REPORT"
echo "Généré le: $(date)" >> "$COMBINED_REPORT"
echo "======================================================" >> "$COMBINED_REPORT"
echo "" >> "$COMBINED_REPORT"

python3 "$SCRIPT_DIR/cost_report.py" >> "$COMBINED_REPORT" 2>/dev/null || echo "❌ Erreur rapport coûts"

echo "" >> "$COMBINED_REPORT"
echo "======================================================" >> "$COMBINED_REPORT"
echo "" >> "$COMBINED_REPORT"

echo "🔍 ÉTAPE 2/2: Analyse des optimisations possibles..."
python3 "$SCRIPT_DIR/cost_optimizer.py" >> "$COMBINED_REPORT" 2>/dev/null || echo "❌ Erreur optimisations"

echo ""
echo "✅ Analyse complète terminée!"
echo "📄 Rapport sauvegardé: $COMBINED_REPORT"
echo ""
echo "📋 RÉSUMÉ:"
echo "  - Coûts actuels par service"
echo "  - Projections mensuelles"
echo "  - Recommandations d'optimisation"
echo "  - Plan d'action prioritaire"
echo ""

# Afficher un résumé rapide
echo "🎯 ACTIONS IMMÉDIATES RECOMMANDÉES:"
echo "  1. Vérifier les tables DynamoDB (mode On-Demand)"
echo "  2. Optimiser la mémoire des fonctions Lambda"
echo "  3. Configurer la rétention des logs CloudWatch"
echo "  4. Implémenter un cache pour les appels IA"
echo ""

if [[ "$1" == "--open" ]]; then
    if command -v code &> /dev/null; then
        code "$COMBINED_REPORT"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        open "$COMBINED_REPORT"
    fi
fi