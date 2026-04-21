#!/bin/bash
# scripts/cleanup-aws-phase1.sh
# Nettoyage AWS Phase 1 - Supprimer ressources orphelines

set -e

echo "🧹 ScamGuard AWS Cleanup - Phase 1"
echo "===================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Supprimer Cognito Pool Orpheline
echo -e "${YELLOW}1️⃣  Suppression Cognito Pool Orpheline...${NC}"
COGNITO_POOL_ID="us-east-1_UdaQ4evwD"

# Vérifier si le pool existe
if aws cognito-idp describe-user-pool --user-pool-id $COGNITO_POOL_ID &>/dev/null; then
    echo "   Pool trouvé: $COGNITO_POOL_ID"
    read -p "   Confirmer suppression? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        aws cognito-idp delete-user-pool --user-pool-id $COGNITO_POOL_ID
        echo -e "   ${GREEN}✅ Pool supprimé${NC}"
    else
        echo -e "   ${YELLOW}⏭️  Ignoré${NC}"
    fi
else
    echo -e "   ${GREEN}✅ Pool déjà supprimé${NC}"
fi

echo ""

# 2. Supprimer Stack Staging
echo -e "${YELLOW}2️⃣  Suppression Stack Staging...${NC}"
STAGING_STACK="scamguard-staging"

# Vérifier si le stack existe
if aws cloudformation describe-stacks --stack-name $STAGING_STACK &>/dev/null; then
    STACK_STATUS=$(aws cloudformation describe-stacks --stack-name $STAGING_STACK --query 'Stacks[0].StackStatus' --output text)
    echo "   Stack trouvé: $STAGING_STACK (Status: $STACK_STATUS)"
    
    if [[ "$STACK_STATUS" == "DELETE_FAILED" ]]; then
        echo "   ⚠️  Stack en DELETE_FAILED, tentative de suppression forcée..."
        read -p "   Confirmer suppression forcée? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            aws cloudformation delete-stack --stack-name $STAGING_STACK
            echo "   ⏳ Suppression en cours..."
            aws cloudformation wait stack-delete-complete --stack-name $STAGING_STACK 2>/dev/null || true
            echo -e "   ${GREEN}✅ Stack supprimé${NC}"
        else
            echo -e "   ${YELLOW}⏭️  Ignoré${NC}"
        fi
    else
        read -p "   Confirmer suppression? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            aws cloudformation delete-stack --stack-name $STAGING_STACK
            echo "   ⏳ Suppression en cours..."
            aws cloudformation wait stack-delete-complete --stack-name $STAGING_STACK 2>/dev/null || true
            echo -e "   ${GREEN}✅ Stack supprimé${NC}"
        else
            echo -e "   ${YELLOW}⏭️  Ignoré${NC}"
        fi
    fi
else
    echo -e "   ${GREEN}✅ Stack déjà supprimé${NC}"
fi

echo ""

# 3. Évaluer Bucket Staging
echo -e "${YELLOW}3️⃣  Évaluation Bucket Staging...${NC}"
STAGING_BUCKET="scamguard-artifacts-034362029181-staging"

# Vérifier si le bucket existe
if aws s3 ls s3://$STAGING_BUCKET &>/dev/null; then
    echo "   Bucket trouvé: $STAGING_BUCKET"
    
    # Vérifier la taille
    SIZE=$(aws s3 ls s3://$STAGING_BUCKET --recursive --summarize | grep "Total Size" | awk '{print $3}')
    SIZE_MB=$((SIZE / 1024 / 1024))
    
    echo "   Taille: ${SIZE_MB} MB"
    
    if [ $SIZE_MB -eq 0 ]; then
        echo "   ✅ Bucket vide"
        read -p "   Supprimer bucket vide? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            aws s3 rb s3://$STAGING_BUCKET --force
            echo -e "   ${GREEN}✅ Bucket supprimé${NC}"
        else
            echo -e "   ${YELLOW}⏭️  Ignoré${NC}"
        fi
    else
        echo "   ⚠️  Bucket non vide (${SIZE_MB} MB)"
        echo "   Contenu:"
        aws s3 ls s3://$STAGING_BUCKET --recursive | head -10
        read -p "   Supprimer bucket et contenu? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            aws s3 rb s3://$STAGING_BUCKET --force
            echo -e "   ${GREEN}✅ Bucket supprimé${NC}"
        else
            echo -e "   ${YELLOW}⏭️  Ignoré${NC}"
        fi
    fi
else
    echo -e "   ${GREEN}✅ Bucket déjà supprimé${NC}"
fi

echo ""
echo "===================================="
echo -e "${GREEN}✅ Phase 1 Terminée!${NC}"
echo ""
echo "Économies estimées: -\$1-2/mois"
echo ""
echo "Prochaines étapes:"
echo "  1. Vérifier les coûts dans 24h"
echo "  2. Passer à Phase 2 (Optimisation DynamoDB)"
echo ""
