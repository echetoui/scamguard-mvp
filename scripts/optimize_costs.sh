#!/bin/bash

# ScamGuard MVP - Analyseur d'Optimisation des Coûts
# Usage: ./optimize_costs.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPTIMIZER_SCRIPT="$SCRIPT_DIR/cost_optimizer.py"
OUTPUT_DIR="$SCRIPT_DIR/../reports"

mkdir -p "$OUTPUT_DIR"

echo "🛡️ ScamGuard MVP - Analyseur d'Optimisation des Coûts"
echo "====================================================="

# Vérifications
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 requis"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI non configuré"
    exit 1
fi

# Installation des dépendances
if ! python3 -c "import boto3" &> /dev/null; then
    echo "📦 Installation boto3..."
    pip3 install boto3
fi

echo "✅ Prérequis validés"
echo ""

# Génération du rapport d'optimisation
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$OUTPUT_DIR/cost_optimization_$TIMESTAMP.txt"

echo "🔍 Analyse en cours..."
python3 "$OPTIMIZER_SCRIPT" | tee "$REPORT_FILE"

echo ""
echo "✅ Rapport d'optimisation sauvegardé: $REPORT_FILE"
echo ""
echo "🚀 PROCHAINES ÉTAPES:"
echo "  1. Réviser les recommandations prioritaires (🔴)"
echo "  2. Implémenter les optimisations par ordre de priorité"
echo "  3. Monitorer l'impact sur les coûts"
echo "  4. Répéter l'analyse mensuellement"