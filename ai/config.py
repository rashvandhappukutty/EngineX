"""Configuration settings and tuning parameters for CampusOne AI."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set


def _load_dotenv_if_present() -> None:
    """Load environment variables from .env or ai/.env if present."""
    base_dir = os.path.dirname(__file__)
    candidates = [
        os.path.join(base_dir, ".env"),
        os.path.join(os.path.dirname(base_dir), ".env"),
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.getcwd(), "ai", ".env"),
    ]
    for env_path in candidates:
        if os.path.isfile(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip("'\"")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass


_load_dotenv_if_present()


@dataclass
class ModelConfig:
    """Settings for language model provider and fallback policies."""
    provider: str = field(
        default_factory=lambda: os.environ.get("AI_NLU_PROVIDER", "rule_based_fallback")
    )  # Options: 'rule_based_fallback', 'gemini', 'mock', 'custom_llm'
    gemini_api_key: Optional[str] = field(
        default_factory=lambda: os.environ.get("GEMINI_API_KEY")
    )
    gemini_model: str = field(
        default_factory=lambda: os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    )
    timeout_seconds: float = field(
        default_factory=lambda: float(os.environ.get("GEMINI_REQUEST_TIMEOUT", "10.0"))
    )
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
