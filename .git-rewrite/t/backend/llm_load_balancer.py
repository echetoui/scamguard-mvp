"""
LLM Load Balancer

Distributes requests across multiple LLM providers based on various strategies:
priority, round-robin, cost-optimized, latency-optimized.

Features:
- Multiple load balancing strategies
- Request distribution tracking
- Provider health-based routing
- Cost-aware load balancing
- Performance optimization

Author: ScamGuard LLM Team
Date: February 18, 2026
Version: 1.0
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LoadBalancingStrategy(Enum):
    """Load balancing strategies."""
    PRIORITY = "priority"  # Use first available by priority
    ROUND_ROBIN = "round_robin"  # Rotate through providers
    COST_OPTIMIZED = "cost_optimized"  # Use cheapest first
    LATENCY_OPTIMIZED = "latency_optimized"  # Use fastest first
    HEALTH_AWARE = "health_aware"  # Distribute based on health


class LLMLoadBalancer:
    """
    Distributes LLM requests across multiple providers.

    Intelligently routes requests based on provider health,
    performance metrics, and cost considerations.
    """

    def __init__(self, provider_manager):
        """
        Initialize load balancer.

        Args:
            provider_manager: LLMProviderManager instance
        """
        self.provider_manager = provider_manager
        self.strategy = LoadBalancingStrategy.PRIORITY
        self.request_count = 0
        self.distribution_stats: Dict[str, int] = {}
        self.round_robin_index = 0

        logger.info("Initialized LLMLoadBalancer")

    def set_strategy(self, strategy: LoadBalancingStrategy):
        """Set load balancing strategy."""
        self.strategy = strategy
        logger.info(f"Load balancing strategy set to: {strategy.value}")

    def select_provider(self, exclude_providers: List[str] = None) -> Optional[str]:
        """
        Select next provider based on current strategy.

        Args:
            exclude_providers: Providers to exclude from selection

        Returns:
            Selected provider name or None
        """
        exclude_providers = exclude_providers or []

        if self.strategy == LoadBalancingStrategy.PRIORITY:
            return self._select_by_priority(exclude_providers)
        elif self.strategy == LoadBalancingStrategy.ROUND_ROBIN:
            return self._select_by_round_robin(exclude_providers)
        elif self.strategy == LoadBalancingStrategy.COST_OPTIMIZED:
            return self._select_by_cost(exclude_providers)
        elif self.strategy == LoadBalancingStrategy.LATENCY_OPTIMIZED:
            return self._select_by_latency(exclude_providers)
        elif self.strategy == LoadBalancingStrategy.HEALTH_AWARE:
            return self._select_by_health(exclude_providers)
        else:
            return self._select_by_priority(exclude_providers)

    def _select_by_priority(self, exclude: List[str]) -> Optional[str]:
        """Select by provider priority (default strategy)."""
        priority_list = self.provider_manager.get_provider_priority_list()

        for provider in priority_list:
            if provider not in exclude:
                metrics = self.provider_manager.metrics.get(provider)
                if metrics and metrics.is_healthy:
                    self._record_distribution(provider)
                    return provider

        # If no healthy provider found, try first available
        for provider in priority_list:
            if provider not in exclude:
                self._record_distribution(provider)
                return provider

        return None

    def _select_by_round_robin(self, exclude: List[str]) -> Optional[str]:
        """Select by round-robin rotation."""
        priority_list = self.provider_manager.get_provider_priority_list()
        healthy_providers = [
            p for p in priority_list
            if p not in exclude and self.provider_manager.metrics[p].is_healthy
        ]

        if not healthy_providers:
            # Fallback to any provider
            healthy_providers = [p for p in priority_list if p not in exclude]

        if not healthy_providers:
            return None

        # Rotate index
        provider = healthy_providers[self.round_robin_index % len(healthy_providers)]
        self.round_robin_index += 1

        self._record_distribution(provider)
        return provider

    def _select_by_cost(self, exclude: List[str]) -> Optional[str]:
        """Select cheapest provider."""
        candidates = [
            (name, self.provider_manager.providers[name])
            for name in self.provider_manager.get_provider_priority_list()
            if name not in exclude and self.provider_manager.metrics[name].is_healthy
        ]

        if not candidates:
            # Fallback to any healthy provider
            candidates = [
                (name, self.provider_manager.providers[name])
                for name in self.provider_manager.get_provider_priority_list()
                if name not in exclude
            ]

        if not candidates:
            return None

        # Sort by cost
        cheapest = min(candidates, key=lambda x: x[1].cost_per_1k_tokens)
        provider = cheapest[0]

        self._record_distribution(provider)
        return provider

    def _select_by_latency(self, exclude: List[str]) -> Optional[str]:
        """Select fastest provider."""
        candidates = [
            (name, self.provider_manager.metrics[name])
            for name in self.provider_manager.get_provider_priority_list()
            if name not in exclude and self.provider_manager.metrics[name].is_healthy
        ]

        if not candidates:
            candidates = [
                (name, self.provider_manager.metrics[name])
                for name in self.provider_manager.get_provider_priority_list()
                if name not in exclude
            ]

        if not candidates:
            return None

        # Sort by latency
        fastest = min(
            candidates,
            key=lambda x: x[1].average_latency_ms if x[1].total_requests > 0 else float('inf')
        )
        provider = fastest[0]

        self._record_distribution(provider)
        return provider

    def _select_by_health(self, exclude: List[str]) -> Optional[str]:
        """Select based on provider health and success rate."""
        candidates = [
            (name, self.provider_manager.metrics[name])
            for name in self.provider_manager.get_provider_priority_list()
            if name not in exclude
        ]

        if not candidates:
            return None

        # Sort by success rate (descending)
        healthiest = sorted(
            candidates,
            key=lambda x: x[1].success_rate,
            reverse=True
        )[0]

        provider = healthiest[0]

        self._record_distribution(provider)
        return provider

    def _record_distribution(self, provider: str):
        """Record that request was sent to provider."""
        self.request_count += 1
        if provider not in self.distribution_stats:
            self.distribution_stats[provider] = 0
        self.distribution_stats[provider] += 1

    def get_distribution_stats(self) -> Dict:
        """Get request distribution statistics."""
        stats = {
            'total_requests': self.request_count,
            'strategy': self.strategy.value,
            'distribution': self.distribution_stats,
            'percentages': {}
        }

        if self.request_count > 0:
            for provider, count in self.distribution_stats.items():
                percentage = (count / self.request_count) * 100
                stats['percentages'][provider] = round(percentage, 2)

        return stats

    def reset_stats(self):
        """Reset distribution statistics."""
        self.request_count = 0
        self.distribution_stats = {}
        self.round_robin_index = 0
        logger.info("Reset load balancer statistics")


class LoadBalancingMonitor:
    """
    Monitors load balancing effectiveness and optimizes strategy.

    Tracks distribution, cost, latency, and accuracy metrics to
    recommend optimal strategy.
    """

    def __init__(self, load_balancer: LLMLoadBalancer):
        """
        Initialize monitor.

        Args:
            load_balancer: LLMLoadBalancer instance
        """
        self.load_balancer = load_balancer
        self.metrics_history: List[Dict] = []

    def record_metrics(self, provider: str, latency_ms: float, cost: float, accuracy: float = 1.0):
        """Record metrics for request."""
        self.metrics_history.append({
            'timestamp': datetime.now().isoformat(),
            'provider': provider,
            'latency_ms': latency_ms,
            'cost': cost,
            'accuracy': accuracy
        })

    def recommend_strategy(self) -> Dict:
        """
        Recommend optimal load balancing strategy based on metrics.

        Returns:
            Recommendation with reasoning
        """
        if len(self.metrics_history) < 10:
            return {
                'recommendation': 'insufficient_data',
                'message': 'Need more metrics to recommend strategy',
                'samples': len(self.metrics_history)
            }

        # Calculate averages by provider
        provider_stats = {}
        for entry in self.metrics_history:
            provider = entry['provider']
            if provider not in provider_stats:
                provider_stats[provider] = {
                    'latencies': [],
                    'costs': [],
                    'accuracies': [],
                    'count': 0
                }

            provider_stats[provider]['latencies'].append(entry['latency_ms'])
            provider_stats[provider]['costs'].append(entry['cost'])
            provider_stats[provider]['accuracies'].append(entry['accuracy'])
            provider_stats[provider]['count'] += 1

        # Calculate averages
        for provider, stats in provider_stats.items():
            stats['avg_latency'] = sum(stats['latencies']) / len(stats['latencies'])
            stats['avg_cost'] = sum(stats['costs']) / len(stats['costs'])
            stats['avg_accuracy'] = sum(stats['accuracies']) / len(stats['accuracies'])

        # Recommend based on metrics
        has_cost_variation = any(s['avg_cost'] > 0 for s in provider_stats.values())
        has_latency_variation = max(s['avg_latency'] for s in provider_stats.values()) - \
                                min(s['avg_latency'] for s in provider_stats.values()) > 500

        if has_cost_variation:
            return {
                'recommendation': LoadBalancingStrategy.COST_OPTIMIZED.value,
                'reasoning': 'Significant cost variation between providers detected',
                'savings_potential': 'Could reduce costs by using cheaper providers'
            }
        elif has_latency_variation:
            return {
                'recommendation': LoadBalancingStrategy.LATENCY_OPTIMIZED.value,
                'reasoning': 'Significant latency variation between providers detected',
                'performance_potential': 'Could improve response times by using faster providers'
            }
        else:
            return {
                'recommendation': LoadBalancingStrategy.ROUND_ROBIN.value,
                'reasoning': 'Metrics are balanced across providers',
                'benefit': 'Distributes load evenly while maintaining resilience'
            }

    def get_efficiency_report(self) -> Dict:
        """Get efficiency report for current strategy."""
        return {
            'strategy': self.load_balancer.strategy.value,
            'distribution': self.load_balancer.get_distribution_stats(),
            'metrics_sample': len(self.metrics_history),
            'recommendation': self.recommend_strategy()
        }


if __name__ == '__main__':
    print("LLM Load Balancer")
    print("=" * 50)
    print("Distributes requests across multiple LLM providers")
