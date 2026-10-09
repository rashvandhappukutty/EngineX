"""CampusOne AI Intelligence Module for EngineX.

Public API providing classification, priority scoring, escalation recommendations,
and batch processing for college incident and complaint management.
"""

from ai.classifier import classify_complaint
from ai.engine import analyze_complaint, batch_analyze_complaints
from ai.escalation import evaluate_escalation
from ai.priority import calculate_priority
from ai.schemas import (
    ComplaintCategory,
    EscalationLevel,
    PriorityLevel,
    DEPARTMENT_MAPPING,
)

__all__ = [
    "analyze_complaint",
    "batch_analyze_complaints",
    "classify_complaint",
    "calculate_priority",
    "evaluate_escalation",
    "ComplaintCategory",
    "PriorityLevel",
    "EscalationLevel",
    "DEPARTMENT_MAPPING",
]
