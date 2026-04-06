#!/bin/bash
# Nettoyer le package Lambda pour respecter la limite de 250 MB

set -e

LAMBDA_DIR="/Users/echetoui/scamguard-mvp/backend/lambda_"
PACKAGE_DIR="$LAMBDA_DIR/lambda_package"

echo "🧹 Nettoyage du package Lambda..."
echo "Taille avant: $(du -sh $PACKAGE_DIR | cut -f1)"

# 1. Supprimer les fichiers inutiles
find "$PACKAGE_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$PACKAGE_DIR" -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find "$PACKAGE_DIR" -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find "$PACKAGE_DIR" -type d -name "test" -exec rm -rf {} + 2>/dev/null || true
find "$PACKAGE_DIR" -type f -name "*.pyc" -delete
find "$PACKAGE_DIR" -type f -name "*.pyo" -delete
find "$PACKAGE_DIR" -type f -name "*.so" -delete

# 2. Supprimer les dépendances non essentielles
rm -rf "$PACKAGE_DIR/googleapiclient" 2>/dev/null || true
rm -rf "$PACKAGE_DIR/grpc" 2>/dev/null || true
rm -rf "$PACKAGE_DIR/google" 2>/dev/null || true

# 3. Réduire les dépendances volumineuses
find "$PACKAGE_DIR/cryptography" -type f -name "*.so" -delete 2>/dev/null || true
find "$PACKAGE_DIR/botocore" -type d -name "data" -exec rm -rf {} + 2>/dev/null || true

echo "Taille après: $(du -sh $PACKAGE_DIR | cut -f1)"
echo "✅ Nettoyage terminé!"
