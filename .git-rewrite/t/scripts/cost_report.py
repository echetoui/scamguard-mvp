#!/usr/bin/env python3
"""
ScamGuard MVP - Rapport de Coûts AWS
Génère un rapport détaillé des coûts basé sur les données réelles du compte AWS
"""

import boto3
import json
from datetime import datetime, timedelta
from decimal import Decimal
import argparse

class AWSCostReporter:
    def __init__(self, region='us-east-1'):
        self.ce_client = boto3.client('ce', region_name=region)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region)
        
    def get_monthly_costs(self, months=3):
        """Récupère les coûts des derniers mois"""
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=months * 30)
        
        response = self.ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            },
            Granularity='MONTHLY',
            Metrics=['BlendedCost'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'}
            ]
        )
        return response
    
    def get_daily_costs(self, days=30):
        """Récupère les coûts quotidiens"""
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        response = self.ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            },
            Granularity='DAILY',
            Metrics=['BlendedCost']
        )
        return response
    
    def get_service_costs(self):
        """Récupère les coûts par service pour le mois en cours"""
        today = datetime.now().date()
        start_of_month = today.replace(day=1)
        
        response = self.ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start_of_month.strftime('%Y-%m-%d'),
                'End': today.strftime('%Y-%m-%d')
            },
            Granularity='MONTHLY',
            Metrics=['BlendedCost'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'}
            ]
        )
        return response
    
    def generate_report(self):
        """Génère le rapport complet"""
        print("🛡️ ScamGuard MVP - Rapport de Coûts AWS")
        print("=" * 50)
        print(f"📅 Généré le: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🏢 Compte AWS: 034362029181")
        print(f"🌍 Région: us-east-1")
        print()
        
        # Coûts du mois en cours
        print("💰 COÛTS DU MOIS EN COURS")
        print("-" * 30)
        service_costs = self.get_service_costs()
        
        total_month = Decimal('0')
        services_data = {}
        
        for result in service_costs['ResultsByTime']:
            for group in result['Groups']:
                service = group['Keys'][0]
                cost = Decimal(group['Metrics']['BlendedCost']['Amount'])
                if cost > 0:
                    services_data[service] = cost
                    total_month += cost
        
        # Trier par coût décroissant
        sorted_services = sorted(services_data.items(), key=lambda x: x[1], reverse=True)
        
        for service, cost in sorted_services:
            print(f"  {service:<25} ${cost:.2f}")
        
        print(f"\n  {'TOTAL MOIS':<25} ${total_month:.2f}")
        
        # Estimation mensuelle
        today = datetime.now().date()
        days_in_month = (today.replace(month=today.month+1, day=1) - timedelta(days=1)).day
        days_elapsed = today.day
        
        if days_elapsed > 0:
            estimated_monthly = total_month * (days_in_month / days_elapsed)
            print(f"  {'ESTIMATION MENSUELLE':<25} ${estimated_monthly:.2f}")
        
        print()
        
        # Coûts quotidiens récents
        print("📊 TENDANCE (7 DERNIERS JOURS)")
        print("-" * 30)
        daily_costs = self.get_daily_costs(7)
        
        daily_data = []
        for result in daily_costs['ResultsByTime']:
            date = result['TimePeriod']['Start']
            cost = Decimal(result['Total']['BlendedCost']['Amount'])
            daily_data.append((date, cost))
            print(f"  {date} ${cost:.2f}")
        
        if daily_data:
            avg_daily = sum(cost for _, cost in daily_data) / len(daily_data)
            print(f"\n  {'MOYENNE QUOTIDIENNE':<15} ${avg_daily:.2f}")
        
        print()
        
        # Comparaison avec budget estimé
        print("🎯 COMPARAISON BUDGET")
        print("-" * 30)
        estimated_budget = Decimal('10.00')  # Budget estimé du README
        
        if total_month <= estimated_budget:
            status = "✅ DANS LE BUDGET"
        else:
            status = "⚠️  DÉPASSEMENT"
        
        print(f"  Budget estimé:     ${estimated_budget:.2f}")
        print(f"  Coût actuel:       ${total_month:.2f}")
        print(f"  Statut:            {status}")
        
        if days_elapsed > 0:
            print(f"  Projection:        ${estimated_monthly:.2f}")
        
        print()
        
        # Services ScamGuard spécifiques
        print("🛡️ SERVICES SCAMGUARD")
        print("-" * 30)
        scamguard_services = {
            'AWS Lambda': 'Fonctions backend',
            'Amazon API Gateway': 'API REST',
            'Amazon DynamoDB': 'Base de données',
            'Amazon CloudFront': 'CDN Frontend',
            'Amazon S3': 'Stockage statique',
            'Amazon Cognito': 'Authentification',
            'AWS Secrets Manager': 'Gestion secrets',
            'Amazon CloudWatch': 'Monitoring'
        }
        
        scamguard_total = Decimal('0')
        for service, description in scamguard_services.items():
            cost = services_data.get(service, Decimal('0'))
            if cost > 0:
                print(f"  {service:<20} ${cost:.2f} ({description})")
                scamguard_total += cost
        
        print(f"\n  {'TOTAL SCAMGUARD':<20} ${scamguard_total:.2f}")
        
        return {
            'total_month': float(total_month),
            'estimated_monthly': float(estimated_monthly) if days_elapsed > 0 else 0,
            'services': {k: float(v) for k, v in services_data.items()},
            'scamguard_total': float(scamguard_total),
            'within_budget': total_month <= estimated_budget
        }

def main():
    parser = argparse.ArgumentParser(description='Générer un rapport de coûts AWS pour ScamGuard')
    parser.add_argument('--json', action='store_true', help='Sortie en format JSON')
    parser.add_argument('--region', default='us-east-1', help='Région AWS')
    
    args = parser.parse_args()
    
    try:
        reporter = AWSCostReporter(region=args.region)
        data = reporter.generate_report()
        
        if args.json:
            print("\n" + "="*50)
            print("JSON OUTPUT:")
            print(json.dumps(data, indent=2))
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        print("\nVérifiez que:")
        print("- AWS CLI est configuré")
        print("- Vous avez les permissions Cost Explorer")
        print("- La région est correcte")

if __name__ == "__main__":
    main()