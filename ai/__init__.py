"""CampusOne AI: Adaptive Campus Intelligence and Crisis Coordination Engine for EngineX.

Provides multi-layer natural language understanding, multi-category situation classification,
adaptive risk and priority scoring, context-aware decision support, resource coordination,
multi-incident reasoning, safe evacuation routing, and dynamic reassessment.
"""

from ai.classifier import classify_complaint
from ai.config import CampusAIConfig, DEFAULT_CONFIG, ModelConfig, ResourceMatchingConfig, RiskScoringConfig
from ai.decision_support import recommend_response
from ai.engine import analyze_complaint, analyze_situation, batch_analyze_complaints
from ai.escalation import evaluate_escalation
from ai.evacuation import recommend_evacuation_routes
from ai.incident_graph import analyze_incident_relationships
from ai.language_model import (
    BaseLanguageModelAdapter,
    ConfigurableLLMAdapter,
    GeminiLanguageModelAdapter,
    MockLanguageModelAdapter,
    RuleBasedFallbackAdapter,
    get_language_model_adapter,
)
from ai.reassessment import reassess_situation
from ai.resource_matcher import match_resources
from ai.risk_assessment import assess_risk, calculate_priority
from ai.schemas import (
    ComplaintCategory,
    DecisionSupportPlan,
    DEPARTMENT_MAPPING,
    EscalationInfo,
    EscalationLevel,
    EvacuationRecommendation,
    EvacuationRoute,
    GeminiIncidentExtractionSchema,
    IncidentRelationship,
    IncidentReport,
    IncidentStatus,
    MultiIncidentAnalysisResult,
    NLUStructuredExtraction,
    PriorityLevel,
    RelationshipType,
    ResourceMatchResult,
    ResourceRecord,
    RiskAssessmentResult,
    SituationAnalysisResult,
    UncertaintyLevel,
)


__all__ = [
    # Primary public interface
    "analyze_situation",
    "analyze_complaint",
    "batch_analyze_complaints",
    # Layer specific functions
    "assess_risk",
    "calculate_priority",
    "classify_complaint",
    "recommend_response",
    "evaluate_escalation",
    "match_resources",
    "analyze_incident_relationships",
    "recommend_evacuation_routes",
    "reassess_situation",
    "get_language_model_adapter",
    # Adapters
    "BaseLanguageModelAdapter",
    "RuleBasedFallbackAdapter",
    "GeminiLanguageModelAdapter",
    "MockLanguageModelAdapter",
    "ConfigurableLLMAdapter",
    # Configurations
    "CampusAIConfig",
    "DEFAULT_CONFIG",
    "ModelConfig",
    "RiskScoringConfig",
    "ResourceMatchingConfig",
    # Schemas and Enums
    "ComplaintCategory",
    "PriorityLevel",
    "EscalationLevel",
    "UncertaintyLevel",
    "IncidentStatus",
    "RelationshipType",
    "DEPARTMENT_MAPPING",
    "IncidentReport",
    "NLUStructuredExtraction",
    "GeminiIncidentExtractionSchema",
    "RiskAssessmentResult",
    "DecisionSupportPlan",
    "ResourceRecord",
    "ResourceMatchResult",
    "IncidentRelationship",
    "MultiIncidentAnalysisResult",
    "EvacuationRoute",
    "EvacuationRecommendation",
    "SituationAnalysisResult",
]
