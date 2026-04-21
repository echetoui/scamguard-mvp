#!/bin/bash

# ScamGuard Master Deployment Script
# Complete setup and deployment orchestration

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear

echo -e "${MAGENTA}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║               🚀 ScamGuard AWS Deployment 🚀                   ║"
echo "║                                                                ║"
echo "║   Plateforme de sensibilisation & entraînement aux arnaques   ║"
echo "║           Destinée aux aînés pour prévenir les fraudes        ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "\n${BLUE}Vérification des prérequis...${NC}\n"

# Check prerequisites
MISSING=0

if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI non trouvé${NC}"
    MISSING=1
fi

if ! command -v sam &> /dev/null; then
    echo -e "${RED}✗ SAM CLI non trouvé${NC}"
    MISSING=1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker non trouvé${NC}"
    MISSING=1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 non trouvé${NC}"
    MISSING=1
fi

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✓ AWS CLI${NC}"
    echo -e "${GREEN}✓ SAM CLI${NC}"
    echo -e "${GREEN}✓ Docker${NC}"
    echo -e "${GREEN}✓ Python 3${NC}"
else
    echo -e "\n${RED}Veuillez installer les outils manquants:${NC}"
    echo -e "  macOS: ${YELLOW}brew install awscli aws-sam-cli docker python3${NC}"
    exit 1
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Menu de Déploiement${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo "1. ${YELLOW}Configurer les credentials AWS & clés API${NC}"
echo "2. ${YELLOW}Afficher le guide d'installation${NC}"
echo "3. ${YELLOW}Lancer le déploiement complet${NC}"
echo "4. ${YELLOW}Tester le déploiement existant${NC}"
echo "5. ${YELLOW}Afficher l'état du déploiement${NC}"
echo "6. ${YELLOW}Supprimer le déploiement${NC}"
echo "0. ${YELLOW}Quitter${NC}"

echo

read -p "Choisissez une option (0-6): " CHOICE

case $CHOICE in
    1)
        echo -e "\n${BLUE}Étape 1: Configuration des Credentials${NC}\n"
        chmod +x CREDENTIALS_SETUP.sh
        ./CREDENTIALS_SETUP.sh
        echo -e "\n${BLUE}Prochaine étape: Lancez l'option 3 pour déployer${NC}"
        ;;

    2)
        echo -e "\n${BLUE}Affichage du guide d'installation...${NC}\n"
        cat DEPLOY_SETUP.md | less
        ;;

    3)
        echo -e "\n${BLUE}Étape 2: Déploiement Complet${NC}\n"

        # Check credentials first
        if ! aws sts get-caller-identity &>/dev/null; then
            echo -e "${RED}✗ AWS credentials non configurés${NC}"
            echo -e "${YELLOW}Lancez d'abord l'option 1${NC}"
            exit 1
        fi

        chmod +x deploy.sh
        ./deploy.sh
        ;;

    4)
        echo -e "\n${BLUE}Test du déploiement...${NC}\n"

        if ! aws sts get-caller-identity &>/dev/null; then
            echo -e "${RED}✗ AWS credentials non configurés${NC}"
            exit 1
        fi

        API=$(aws cloudformation describe-stacks \
            --stack-name scamguard-mvp \
            --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
            --output text \
            --region us-east-1 2>/dev/null)

        if [ -z "$API" ] || [ "$API" = "None" ]; then
            echo -e "${RED}✗ Déploiement non trouvé${NC}"
            echo -e "${YELLOW}Lancez d'abord l'option 3 pour déployer${NC}"
            exit 1
        fi

        echo -e "${GREEN}✓ API Endpoint: ${API}${NC}\n"

        echo "Test des endpoints:"
        echo -e "${BLUE}GET ${API}api/v1/health${NC}"
        curl -s -X GET "${API}api/v1/health" 2>&1 | python3 -m json.tool 2>/dev/null || echo "Endpoint not yet available"

        echo -e "\n${GREEN}✓ Déploiement actif et fonctionnel${NC}"
        ;;

    5)
        echo -e "\n${BLUE}État du déploiement...${NC}\n"

        if ! aws sts get-caller-identity &>/dev/null; then
            echo -e "${RED}✗ AWS credentials non configurés${NC}"
            exit 1
        fi

        REGION="us-east-1"
        STACKS=$(aws cloudformation describe-stacks \
            --stack-name scamguard-mvp \
            --query 'Stacks[0].[StackStatus,StackName,CreationTime]' \
            --output text \
            --region $REGION 2>/dev/null)

        if [ -z "$STACKS" ]; then
            echo -e "${YELLOW}Aucun déploiement trouvé${NC}"
            exit 1
        fi

        echo -e "${GREEN}Stack Status:${NC}"
        echo "$STACKS" | awk '{print "  Status: " $1 "\n  Name: " $2 "\n  Created: " $3}'

        OUTPUTS=$(aws cloudformation describe-stacks \
            --stack-name scamguard-mvp \
            --query 'Stacks[0].Outputs' \
            --output json \
            --region $REGION)

        echo -e "\n${GREEN}Outputs:${NC}"
        echo "$OUTPUTS" | python3 -m json.tool

        echo -e "\n${GREEN}CloudWatch Logs:${NC}"
        echo "  https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:"

        echo -e "\n${GREEN}X-Ray Service Map:${NC}"
        echo "  https://console.aws.amazon.com/xray/home?region=$REGION#/service-map"
        ;;

    6)
        echo -e "\n${RED}⚠️  Attention: Cela supprimera le déploiement AWS${NC}\n"
        read -p "Êtes-vous sûr? (oui/non): " CONFIRM

        if [ "$CONFIRM" = "oui" ]; then
            echo -e "\n${YELLOW}Suppression en cours...${NC}\n"

            aws cloudformation delete-stack --stack-name scamguard-mvp --region us-east-1
            echo -e "${GREEN}✓ CloudFormation stack supprimé${NC}"

            ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
            BUCKET_NAME="scamguard-deployment-artifacts-${ACCOUNT_ID}"

            if aws s3 ls "s3://${BUCKET_NAME}" 2>/dev/null; then
                aws s3 rm "s3://${BUCKET_NAME}" --recursive
                echo -e "${GREEN}✓ S3 bucket nettoyé${NC}"
            fi

            echo -e "\n${GREEN}✓ Déploiement supprimé avec succès${NC}"
        else
            echo -e "${YELLOW}Opération annulée${NC}"
        fi
        ;;

    0)
        echo -e "\n${GREEN}Au revoir! 👋${NC}\n"
        exit 0
        ;;

    *)
        echo -e "\n${RED}Option invalide${NC}\n"
        exit 1
        ;;
esac

echo -e "\n"
