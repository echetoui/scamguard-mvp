"""
LLM Provider Manager

Manages multiple LLM provider integrations with load balancing,
fallback logic, health checking, and performance comparison.

Supported Providers:
- Claude (Anthropic)
- GPT (OpenAI)
- Gemini (Google)
- Keyword Detection (Fallback)

Author: ScamGuard LLM Team
Date: February 18, 2026
Version: 1.0
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ProviderType(Enum):
    """Supported LLM providers."""
    CLAUDE = "claude"
    OPENAI = "openai"
    GEMINI = "gemini"
    KEYWORD = "keyword"


@dataclass
class ProviderConfig:
    """Configuration for a single LLM provider."""
    name: str
    type: ProviderType
    enabled: bool = True
    priority: int = 0  # Lower = higher priority
    api_key_secret: str = ""
    model_name: str = ""
    temperature: float = 0.3
    max_tokens: int = 500
    timeout_seconds: int = 10
    retry_count: int = 3
    cost_per_1k_tokens: float = 0.0
    healthcheck_interval_minutes: int = 60


@dataclass
class ProviderMetrics:
    """Performance metrics for a provider."""
    provider_name: str
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_latency_ms: float = 0.0
    average_latency_ms: float = 0.0
    success_rate: float = 1.0
    last_health_check: Optional[str] = None
    is_healthy: bool = True
    cost_accumulated: float = 0.0
    tokens_used: int = 0


@dataclass
class ProviderResponse:
    """Standardized response from any provider."""
    provider: str
    success: bool
    data: Dict = field(default_factory=dict)
    error: Optional[str] = None
    latency_ms: float = 0.0
    tokens_used: int = 0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


class LLMProviderManager:
    """
    Central manager for multiple LLM provider integrations.

    Handles provider selection, fallback, health checking,
    metrics tracking, and load balancing.
    """

    def __init__(self, config_path: str = None):
        """
        Initialize provider manager.

        Args:
            config_path: Path to provider configuration JSON
        """
        self.providers: Dict[str, ProviderConfig] = {}
        self.metrics: Dict[str, ProviderMetrics] = {}
        self.request_history: List[ProviderResponse] = []

        # Initialize default providers
        self._initialize_default_providers()

        # Load config if provided
        if config_path:
            self._load_config(config_path)

        logger.info(f"Initialized LLMProviderManager with {len(self.providers)} providers")

    def _initialize_default_providers(self):
        """Initialize with default provider configurations."""
        providers = [
            ProviderConfig(
                name="Claude (Anthropic)",
                type=ProviderType.CLAUDE,
                priority=0,
                api_key_secret="scamguard/claude-key",
                model_name="claude-3-sonnet-20240229",
                temperature=0.3,
                max_tokens=500,
                cost_per_1k_tokens=0.003,
                enabled=True
            ),
            ProviderConfig(
                name="GPT-3.5 (OpenAI)",
                type=ProviderType.OPENAI,
                priority=1,
                api_key_secret="scamguard/openai-key",
                model_name="gpt-3.5-turbo",
                temperature=0.3,
                max_tokens=500,
                cost_per_1k_tokens=0.0005,
                enabled=True
            ),
            ProviderConfig(
                name="Gemini (Google)",
                type=ProviderType.GEMINI,
                priority=2,
                api_key_secret="scamguard/gemini-key",
                model_name="gemini-pro",
                temperature=0.3,
                max_tokens=500,
                cost_per_1k_tokens=0.0,
                enabled=True
            ),
            ProviderConfig(
                name="Keyword Detection",
                type=ProviderType.KEYWORD,
                priority=999,  # Last resort
                enabled=True
            )
        ]

        for provider in providers:
            self.providers[provider.name] = provider
            self.metrics[provider.name] = ProviderMetrics(
                provider_name=provider.name
            )

    def _load_config(self, config_path: str):
        """Load provider configuration from JSON file."""
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)

            for provider_config in config.get('providers', []):
                provider = ProviderConfig(
                    name=provider_config['name'],
                    type=ProviderType[provider_config['type'].upper()],
                    enabled=provider_config.get('enabled', True),
                    priority=provider_config.get('priority', 0),
                    api_key_secret=provider_config.get('api_key_secret', ''),
                    model_name=provider_config.get('model_name', ''),
                    temperature=provider_config.get('temperature', 0.3),
                    max_tokens=provider_config.get('max_tokens', 500),
                    cost_per_1k_tokens=provider_config.get('cost_per_1k_tokens', 0.0)
                )

                self.providers[provider.name] = provider
                if provider.name not in self.metrics:
                    self.metrics[provider.name] = ProviderMetrics(
                        provider_name=provider.name
                    )

            logger.info(f"Loaded {len(self.providers)} providers from config")
        except Exception as e:
            logger.warning(f"Failed to load config: {e}")

    def get_provider_priority_list(self) -> List[str]:
        """
        Get ordered list of provider names by priority.

        Returns:
            List of provider names, highest priority first
        """
        enabled = [
            (name, config.priority)
            for name, config in self.providers.items()
            if config.enabled
        ]

        # Sort by priority (lower number = higher priority)
        enabled.sort(key=lambda x: x[1])

        return [name for name, _ in enabled]

    def get_best_provider(self, exclude_providers: List[str] = None) -> Optional[str]:
        """
        Get best available provider considering health and priority.

        Args:
            exclude_providers: List of provider names to skip

        Returns:
            Provider name or None if none available
        """
        exclude_providers = exclude_providers or []

        priority_list = self.get_provider_priority_list()

        for provider_name in priority_list:
            if provider_name in exclude_providers:
                continue

            metrics = self.metrics.get(provider_name)
            if metrics and metrics.is_healthy:
                return provider_name

        return None

    def record_request(
        self,
        provider: str,
        success: bool,
        latency_ms: float = 0.0,
        tokens_used: int = 0,
        error: str = None,
        data: Dict = None
    ):
        """
        Record request metrics for provider.

        Args:
            provider: Provider name
            success: Whether request succeeded
            latency_ms: Request latency in milliseconds
            tokens_used: Tokens consumed by request
            error: Error message if failed
            data: Response data
        """
        if provider not in self.metrics:
            return

        metrics = self.metrics[provider]
        metrics.total_requests += 1

        if success:
            metrics.successful_requests += 1
            metrics.total_latency_ms += latency_ms
            metrics.average_latency_ms = metrics.total_latency_ms / metrics.successful_requests
        else:
            metrics.failed_requests += 1

        metrics.success_rate = metrics.successful_requests / metrics.total_requests if metrics.total_requests > 0 else 0.0
        metrics.tokens_used += tokens_used

        # Update cost
        if tokens_used > 0 and self.providers[provider].cost_per_1k_tokens > 0:
            cost = (tokens_used / 1000) * self.providers[provider].cost_per_1k_tokens
            metrics.cost_accumulated += cost

        # Store in history
        response = ProviderResponse(
            provider=provider,
            success=success,
            data=data or {},
            error=error,
            latency_ms=latency_ms,
            tokens_used=tokens_used
        )
        self.request_history.append(response)

        logger.debug(f"Recorded {provider}: success={success}, latency={latency_ms}ms")

    def check_provider_health(self, provider: str) -> bool:
        """
        Check health of provider (based on recent success rate).

        Args:
            provider: Provider name

        Returns:
            Health status
        """
        if provider not in self.metrics:
            return False

        metrics = self.metrics[provider]

        # Provider is healthy if success rate > 80% and has recent activity
        is_healthy = metrics.success_rate > 0.8 and metrics.total_requests > 0

        metrics.is_healthy = is_healthy
        metrics.last_health_check = datetime.now().isoformat()

        return is_healthy

    def get_provider_metrics(self, provider: str = None) -> Dict:
        """
        Get metrics for specific provider or all providers.

        Args:
            provider: Provider name (or None for all)

        Returns:
            Metrics dictionary
        """
        if provider:
            metrics = self.metrics.get(provider)
            if metrics:
                return {
                    'provider': metrics.provider_name,
                    'total_requests': metrics.total_requests,
                    'successful_requests': metrics.successful_requests,
                    'failed_requests': metrics.failed_requests,
                    'success_rate': round(metrics.success_rate * 100, 2),
                    'average_latency_ms': round(metrics.average_latency_ms, 2),
                    'is_healthy': metrics.is_healthy,
                    'tokens_used': metrics.tokens_used,
                    'cost_accumulated': round(metrics.cost_accumulated, 4)
                }
            return {}

        # Return all metrics
        all_metrics = {}
        for provider_name, metrics in self.metrics.items():
            all_metrics[provider_name] = {
                'total_requests': metrics.total_requests,
                'success_rate': round(metrics.success_rate * 100, 2),
                'average_latency_ms': round(metrics.average_latency_ms, 2),
                'is_healthy': metrics.is_healthy,
                'cost_accumulated': round(metrics.cost_accumulated, 4)
            }

        return all_metrics

    def compare_providers(self) -> Dict:
        """
        Compare performance across all providers.

        Returns:
            Comparison report
        """
        comparison = {
            'timestamp': datetime.now().isoformat(),
            'providers': self.get_provider_metrics(),
            'best_by_latency': None,
            'best_by_cost': None,
            'best_by_reliability': None
        }

        # Find best by latency
        fastest = min(
            self.metrics.items(),
            key=lambda x: x[1].average_latency_ms if x[1].total_requests > 0 else float('inf')
        )
        comparison['best_by_latency'] = fastest[0]

        # Find best by cost
        cheapest = min(
            self.metrics.items(),
            key=lambda x: x[1].cost_accumulated
        )
        comparison['best_by_cost'] = cheapest[0]

        # Find most reliable
        most_reliable = max(
            self.metrics.items(),
            key=lambda x: x[1].success_rate
        )
        comparison['best_by_reliability'] = most_reliable[0]

        return comparison

    def enable_provider(self, provider: str) -> bool:
        """Enable a provider."""
        if provider in self.providers:
            self.providers[provider].enabled = True
            logger.info(f"Enabled provider: {provider}")
            return True
        return False

    def disable_provider(self, provider: str) -> bool:
        """Disable a provider."""
        if provider in self.providers:
            self.providers[provider].enabled = False
            logger.info(f"Disabled provider: {provider}")
            return True
        return False

    def set_provider_priority(self, provider: str, priority: int) -> bool:
        """Set priority for a provider (lower = higher priority)."""
        if provider in self.providers:
            self.providers[provider].priority = priority
            logger.info(f"Set priority for {provider}: {priority}")
            return True
        return False

    def get_provider_config(self, provider: str) -> Optional[ProviderConfig]:
        """Get configuration for a provider."""
        return self.providers.get(provider)

    def list_providers(self) -> List[Dict]:
        """List all providers and their configuration."""
        return [
            {
                'name': config.name,
                'type': config.type.value,
                'enabled': config.enabled,
                'priority': config.priority,
                'model': config.model_name,
                'is_healthy': self.metrics[config.name].is_healthy
            }
            for config in self.providers.values()
        ]


if __name__ == '__main__':
    manager = LLMProviderManager()
    print("LLM Provider Manager initialized")
    print(f"Providers: {[p['name'] for p in manager.list_providers()]}")
