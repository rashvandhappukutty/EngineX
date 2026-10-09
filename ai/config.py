"""Configuration settings and tuning parameters for CampusOne AI."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set


@dataclass
class ModelConfig:
    """Settings for language model provider and fallback policies."""
    provider: str = "rule_based_fallback"  # Options: 'rule_based_fallback', 'mock', 'custom_llm'
    timeout_seconds: float = 3.0
    fallback_on_failure: bool = True
    confidence_threshold: float = 0.50
    strict_schema_validation: bool = True
    custom_callable: Optional[Callable[[str], Dict[str, Any]]] = None


@dataclass
class RiskScoringConfig:
    """Weights and thresholds for risk scoring."""
    critical_threshold: int = 80
    high_threshold: int = 60
    medium_threshold: int = 35
    safety_floor_critical: int = 88
    safety_floor_high: int = 68
    low_confidence_uncertainty_threshold: float = 0.45


@dataclass
class ResourceMatchingConfig:
    """Weights for ranking response teams and personnel."""
    skill_match_weight: float = 0.40
    proximity_weight: float = 0.25
    availability_weight: float = 0.20
    workload_weight: float = 0.15


@dataclass
class CampusAIConfig:
    """Global system configuration for CampusOne AI."""
    model: ModelConfig = field(default_factory=ModelConfig)
    risk: RiskScoringConfig = field(default_factory=RiskScoringConfig)
    resource: ResourceMatchingConfig = field(default_factory=ResourceMatchingConfig)
    enable_human_override_audit: bool = True
    allow_automated_external_dispatch: bool = False  # Strict safety policy: Always False


DEFAULT_CONFIG = CampusAIConfig()
