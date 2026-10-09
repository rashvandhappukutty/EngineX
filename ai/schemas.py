"""Data schemas and type definitions for the CampusOne AI Intelligence Module."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class ComplaintCategory(str, Enum):
    """Supported complaint and incident classification categories."""
    IT_AND_NETWORK = "IT and Network"
    MAINTENANCE_AND_ELECTRICAL = "Maintenance and Electrical"
    HOUSEKEEPING_AND_SANITATION = "Housekeeping and Sanitation"
    TRANSPORT = "Transport"
    SECURITY = "Security"
    ACADEMIC_ADMINISTRATION = "Academic Administration"
    LABORATORY = "Laboratory"
    MEDICAL_AND_SAFETY = "Medical and Safety"
    GENERAL_UNKNOWN = "General / Unknown"


class PriorityLevel(str, Enum):
    """Four-tier priority levels for incident triage."""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class EscalationLevel(str, Enum):
    """Escalation workflow tiers."""
    EMERGENCY_REVIEW = "Emergency review"
    URGENT_REVIEW = "Urgent review"
    STANDARD_REVIEW = "Standard review"
    NO_ESCALATION = "No escalation"


# Standard department mapping for each category
DEPARTMENT_MAPPING: Dict[ComplaintCategory, str] = {
    ComplaintCategory.IT_AND_NETWORK: "IT Support",
    ComplaintCategory.MAINTENANCE_AND_ELECTRICAL: "Estate & Maintenance",
    ComplaintCategory.HOUSEKEEPING_AND_SANITATION: "Housekeeping & Sanitation",
    ComplaintCategory.TRANSPORT: "Transport Office",
    ComplaintCategory.SECURITY: "Campus Security",
    ComplaintCategory.ACADEMIC_ADMINISTRATION: "Academic Affairs",
    ComplaintCategory.LABORATORY: "Laboratory Management",
    ComplaintCategory.MEDICAL_AND_SAFETY: "Campus Health & Safety",
    ComplaintCategory.GENERAL_UNKNOWN: "Helpdesk General Triage",
}


@dataclass
class ClassificationResult:
    """Result of classifying a complaint into a category."""
    category: ComplaintCategory
    assigned_department: str
    confidence: float
    matched_keywords: List[str] = field(default_factory=list)
    secondary_categories: List[Dict[str, Any]] = field(default_factory=list)
    is_ambiguous: bool = False
    explanation: str = ""


@dataclass
class PriorityResult:
    """Result of evaluating urgency, priority tier, and score."""
    priority: PriorityLevel
    priority_score: int
    reason: str
    requires_human_review: bool
    is_safety_critical: bool = False
    triggered_rules: List[str] = field(default_factory=list)
    explanation: str = ""


@dataclass
class EscalationInfo:
    """Escalation metadata and human review recommendation."""
    escalate: bool
    level: EscalationLevel
    reason: str
    recommended_action: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "escalate": self.escalate,
            "level": self.level.value,
            "reason": self.reason,
            "recommended_action": self.recommended_action,
        }


@dataclass
class AnalysisOutput:
    """Consolidated public output structure for complaint analysis."""
    category: str
    assigned_department: str
    classification_confidence: float
    priority: str
    priority_score: int
    reason: str
    requires_human_review: bool
    escalation: Dict[str, Any]
    explanation: List[str]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to a pure JSON-serializable dictionary matching integration contract."""
        return {
            "category": self.category,
            "assigned_department": self.assigned_department,
            "classification_confidence": round(self.classification_confidence, 2),
            "priority": self.priority,
            "priority_score": int(self.priority_score),
            "reason": self.reason,
            "requires_human_review": bool(self.requires_human_review),
            "escalation": self.escalation,
            "explanation": self.explanation,
        }
