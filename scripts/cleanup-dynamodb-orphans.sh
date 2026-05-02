#!/bin/bash
# scripts/cleanup-dynamodb-orphans.sh
# Supprimer les tables DynamoDB orphelines

set -e

echo "🧹 ScamGuard DynamoDB Cleanup"
echo "=============================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Tables à supprimer (orphelines)
ORPHAN_TABLES=(
    "threat_scenarios"
    "threats"
    "user_threats"
    "ScamGuardOTP"
)

# Tables à garder (actives)
KEEP_TABLES=(
    "ScamGuardStack-DataTable447BC44E-1AY6QZXNSPP8"
)

echo -e "${YELLOW}Tables à supprimer:${NC}"
for table in "${ORPHAN_TABLES[@]}"; do
    echo "  • $table"
done

echo ""
echo -e "${YELLOW}Tables à garder:${NC}"
for table in "${KEEP_TABLES[@]}"; do
    echo "  • $table"
done

echo ""
read -p "Confirmer suppression? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Annulé${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Suppression en cours...${NC}"

for table in "${ORPHAN_TABLES[@]}"; do
    echo -n "  Suppression $table... "
    
    # Vérifier si la table existe
    if aws dynamodb describe-table --table-name "$table" &>/dev/null; then
        # Supprimer la table
        aws dynamodb delete-table --table-name "$table" &>/dev/null
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${GREEN}✅ (déjà supprimée)${NC}"
    fi
done

echo ""
echo -e "${YELLOW}Vérification...${NC}"

# Lister les tables restantes
REMAINING=$(aws dynamodb list-tables --query 'TableNames' --output text)

echo "Tables restantes:"
for table in $REMAINING; do
    echo "  • $table"
done

echo ""
echo -e "${GREEN}✅ Nettoyage terminé!${NC}"
echo ""
echo "Économies estimées: -\$1.00/mois"
echo ""
