#!/bin/bash

# Script pour configurer les paramètres SSM après déploiement CDK

echo "Configuration des paramètres SSM pour ScamGuard..."

# Vérifier si les clés API sont définies
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  Variable GEMINI_API_KEY non définie"
    read -p "Entrez votre clé API Gemini: " GEMINI_API_KEY
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Variable OPENAI_API_KEY non définie"
    read -p "Entrez votre clé API OpenAI: " OPENAI_API_KEY
fi

# Mettre à jour les paramètres SSM
echo "Mise à jour du paramètre Gemini..."
aws ssm put-parameter \
    --name "/scamguard/gemini-key" \
    --value "$GEMINI_API_KEY" \
    --type "SecureString" \
    --overwrite

echo "Mise à jour du paramètre OpenAI..."
aws ssm put-parameter \
    --name "/scamguard/openai-key" \
    --value "$OPENAI_API_KEY" \
    --type "SecureString" \
    --overwrite

echo "✅ Configuration SSM terminée!"