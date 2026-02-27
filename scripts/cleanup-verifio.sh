#!/bin/bash
set -e

echo "🧹 Nettoyage des ressources Verifio"
echo "===================================="
echo ""
echo "⚠️  ATTENTION: Cette action est IRRÉVERSIBLE"
echo ""
read -p "Confirmer la suppression? (tapez 'yes'): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Annulé"
    exit 1
fi

echo ""
echo "🗑️  Suppression en cours..."
echo ""

# 1. Supprimer les stacks CloudFormation
echo "1️⃣  Suppression des stacks CloudFormation..."
aws cloudformation delete-stack --stack-name verifio-backend-dev
echo "   ✅ verifio-backend-dev marqué pour suppression"

aws cloudformation delete-stack --stack-name verifio-core-prod
echo "   ✅ verifio-core-prod marqué pour suppression"

# 2. Attendre que les stacks soient supprimées
echo ""
echo "2️⃣  Attente de suppression des stacks (peut prendre 5-10 min)..."
aws cloudformation wait stack-delete-complete --stack-name verifio-backend-dev &
aws cloudformation wait stack-delete-complete --stack-name verifio-core-prod &
wait
echo "   ✅ Stacks supprimées"

# 3. Supprimer les API Gateway orphelines
echo ""
echo "3️⃣  Suppression des API Gateway Verifio..."
aws apigatewayv2 delete-api --api-id 99pu3hejr0 2>/dev/null || echo "   ⚠️  API 99pu3hejr0 déjà supprimée"
aws apigatewayv2 delete-api --api-id lnfbf6ephi 2>/dev/null || echo "   ⚠️  API lnfbf6ephi déjà supprimée"
aws apigatewayv2 delete-api --api-id lrilb4zgeg 2>/dev/null || echo "   ⚠️  API lrilb4zgeg déjà supprimée"
aws apigatewayv2 delete-api --api-id y3ac4a3xgj 2>/dev/null || echo "   ⚠️  API y3ac4a3xgj déjà supprimée"
echo "   ✅ API Gateway nettoyées"

# 4. Vérifier les ressources restantes
echo ""
echo "4️⃣  Vérification des ressources restantes..."
echo ""
echo "Stacks CloudFormation:"
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[*].[StackName,StackStatus]' --output table

echo ""
echo "API Gateway:"
aws apigatewayv2 get-apis --query 'Items[*].[Name,ApiId]' --output table

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "💰 Économie estimée: ~$5-10/mois"
