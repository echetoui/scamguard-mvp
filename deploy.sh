#!/bin/bash

# Script de déploiement Frontend pour ScamGuard
# Met à jour le site sur S3 et invalide le cache CloudFront

set -e # Arrêter le script en cas d'erreur

# --- Configuration ---
# Remplacez ces valeurs par les vôtres ou utilisez des variables d'environnement
BUCKET_NAME="scamguardstack-frontendbucketefe2e19c-5zt0alq9uprw"
DISTRIBUTION_ID="E1C54UEBEPD83U"
REGION="us-east-1"

# Couleurs pour la sortie console
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Démarrage du déploiement de ScamGuard Frontend...${NC}"

# 1. Vérification des prérequis
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Erreur: AWS CLI n'est pas installé.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Erreur: npm n'est pas installé.${NC}"
    exit 1
fi

# 2. Installation des dépendances et Build
echo -e "\n${BLUE}📦 Construction de l'application (Build)...${NC}"
npm install
npm run build

if [ ! -d "build" ]; then
    echo -e "${RED}Erreur: Le dossier 'build' n'a pas été créé.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build terminé avec succès.${NC}"

# 3. Synchronisation avec S3
echo -e "\n${BLUE}☁️  Synchronisation avec S3 ($BUCKET_NAME)...${NC}"
aws s3 sync build/ s3://$BUCKET_NAME --delete --region $REGION

echo -e "${GREEN}✅ Fichiers uploadés sur S3.${NC}"

# 4. Invalidation CloudFront
echo -e "\n${BLUE}🔄 Invalidation du cache CloudFront ($DISTRIBUTION_ID)...${NC}"
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --region $REGION

echo -e "${GREEN}✅ Cache invalidé.${NC}"

echo -e "\n${GREEN}🎉 Déploiement terminé !${NC}"
echo -e "Le site devrait être à jour dans quelques minutes sur votre URL CloudFront."