"""Data schemas, enums, and typed structures for CampusOne AI."""

from __future__ import annotations

import time
from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set


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
    OTHER = "Other"
    NEEDS_ASSESSMENT = "Needs Assessment"


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


class UncertaintyLevel(str, Enum):
    """Degrees of uncertainty in reports and extractions."""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class IncidentStatus(str, Enum):
    """Lifecycle state of an incident."""
    REPORTED = "Reported"
    UNDER_INVESTIGATION = "Under Investigation"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class RelationshipType(str, Enum):
    """Categorization of connections between multiple campus incidents."""
    DUPLICATE = "Duplicate"
    SHARED_CAUSE = "Shared Cause"
    CASCADING_FAILURE = "Cascading Failure"
    COMPETING_RESOURCES = "Competing Resources"
    GEOGRAPHIC_PROXIMITY = "Geographic Proximity"
    UNRELATED = "Unrelated"


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
    ComplaintCategory.OTHER: "Helpdesk General Triage",
    ComplaintCategory.NEEDS_ASSESSMENT: "Emergency Coordination Center",
}


@dataclass
class IncidentReport:
    """Incoming complaint or incident report input model."""
    title: str
    description: str
    incident_id: Optional[str] = None
    location: Optional[str] = None
    reporter_role: Optional[str] = None
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "incident_id": self.incident_id,
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "reporter_role": self.reporter_role,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }


@dataclass
class NLUStructuredExtraction:
    """Structured extraction from natural-language incident reports."""
    primary_problem: str
    identified_locations: List[str] = field(default_factory=list)
    affected_services: List[str] = field(default_factory=list)
    estimated_affected_count: Optional[int] = None
    urgency_indicators: List[str] = field(default_factory=list)
    known_facts: List[str] = field(default_factory=list)
    assumptions_or_inferences: List[str] = field(default_factory=list)
    conflicting_or_contradictory_elements: List[str] = field(default_factory=list)
    missing_critical_information: List[str] = field(default_factory=list)
    detected_entities: Dict[str, List[str]] = field(default_factory=dict)
    confidence: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "primary_problem": self.primary_problem,
            "identified_locations": self.identified_locations,
            "affected_services": self.affected_services,
            "estimated_affected_count": self.estimated_affected_count,
            "urgency_indicators": self.urgency_indicators,
            "known_facts": self.known_facts,
            "assumptions_or_inferences": self.assumptions_or_inferences,
            "conflicting_or_contradictory_elements": self.conflicting_or_contradictory_elements,
            "missing_critical_information": self.missing_critical_information,
            "detected_entities": self.detected_entities,
            "confidence": round(self.confidence, 2),
        }


@dataclass
class ClassificationResult:
    """Result of multi-category classification."""
    category: ComplaintCategory
    assigned_department: str
    confidence: float
    matched_keywords: List[str] = field(default_factory=list)
    secondary_categories: List[Dict[str, Any]] = field(default_factory=list)
    all_categories: List[str] = field(default_factory=list)
    is_ambiguous: bool = False
    is_unfamiliar: bool = False
    explanation: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category": self.category.value,
            "assigned_department": self.assigned_department,
            "confidence": round(self.confidence, 2),
            "matched_keywords": self.matched_keywords,
            "secondary_categories": self.secondary_categories,
            "all_categories": self.all_categories or [self.category.value],
            "is_ambiguous": self.is_ambiguous,
            "is_unfamiliar": self.is_unfamiliar,
            "explanation": self.explanation,
        }


@dataclass
class RiskAssessmentResult:
    """Comprehensive risk and urgency assessment output."""
    priority: PriorityLevel
    risk_score: int
    risk_factors: List[str]
    reasoning_summary: str
    uncertainty_level: UncertaintyLevel
    requires_human_review: bool
    missing_information: List[str] = field(default_factory=list)
    is_safety_critical: bool = False
    potential_harm_level: str = "Low"
    immediacy_of_danger: str = "Low"

    @property
    def priority_score(self) -> int:
        """Backwards-compatibility alias for priority_score."""
        return self.risk_score

    @property
    def reason(self) -> str:
        """Backwards-compatibility alias for reason string."""
        return self.reasoning_summary

    def to_dict(self) -> Dict[str, Any]:
        return {
            "priority": self.priority.value,
            "risk_score": self.risk_score,
            "priority_score": self.risk_score,
            "risk_factors": self.risk_factors,
            "reasoning_summary": self.reasoning_summary,
            "uncertainty_level": self.uncertainty_level.value,
            "requires_human_review": self.requires_human_review,
            "missing_information": self.missing_information,
            "is_safety_critical": self.is_safety_critical,
            "potential_harm_level": self.potential_harm_level,
            "immediacy_of_danger": self.immediacy_of_danger,
        }


# Backwards compatibility alias
PriorityResult = RiskAssessmentResult


@dataclass
class RecommendedAction:
    """Action item for incident response."""
    step: int
    action: str
    target_role_or_team: str
    prerequisites: List[str] = field(default_factory=list)
    required_capabilities: List[str] = field(default_factory=list)
    escalation_triggers: List[str] = field(default_factory=list)
    safe_alternatives: List[str] = field(default_factory=list)
    rationale: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step": self.step,
            "action": self.action,
            "target_role_or_team": self.target_role_or_team,
            "prerequisites": self.prerequisites,
            "required_capabilities": self.required_capabilities,
            "escalation_triggers": self.escalation_triggers,
            "safe_alternatives": self.safe_alternatives,
            "rationale": self.rationale,
        }


@dataclass
class EscalationInfo:
    """Escalation protocol recommendations."""
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
class DecisionSupportPlan:
    """Actionable decision support plan."""
    responsible_department: str
    immediate_next_steps: List[RecommendedAction]
    escalation: EscalationInfo
    required_capabilities: List[str] = field(default_factory=list)
    information_needed: List[str] = field(default_factory=list)
    policy_reference: str = "Campus Standard Operating Procedures"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "responsible_department": self.responsible_department,
            "immediate_next_steps": [a.to_dict() for a in self.immediate_next_steps],
            "escalation": self.escalation.to_dict(),
            "required_capabilities": self.required_capabilities,
            "information_needed": self.information_needed,
            "policy_reference": self.policy_reference,
        }


@dataclass
class ResourceRecord:
    """Campus staff, response team, or equipment resource model."""
    resource_id: str
    type: str
    team: str
    skills: List[str] = field(default_factory=list)
    availability: bool = True
    location: Optional[str] = None
    workload: int = 0
    readiness: str = "Ready"
    equipment: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "resource_id": self.resource_id,
            "type": self.type,
            "team": self.team,
            "skills": self.skills,
            "availability": self.availability,
            "location": self.location,
            "workload": self.workload,
            "readiness": self.readiness,
            "equipment": self.equipment,
        }


@dataclass
class ResourceMatchResult:
    """Outcome of resource recommendation matching."""
    matched_resources: List[Dict[str, Any]] = field(default_factory=list)
    unmet_requirements: List[str] = field(default_factory=list)
    status_summary: str = ""
    competing_demands: List[str] = field(default_factory=list)
    recommendation_note: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "matched_resources": self.matched_resources,
            "unmet_requirements": self.unmet_requirements,
            "status_summary": self.status_summary,
            "competing_demands": self.competing_demands,
            "recommendation_note": self.recommendation_note,
        }


@dataclass
class IncidentRelationship:
    """Relationship hypothesis between two campus incidents."""
    source_incident_id: str
    target_incident_id: str
    relationship_type: RelationshipType
    confidence: float
    evidence: List[str]
    is_hypothesis: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_incident_id": self.source_incident_id,
            "target_incident_id": self.target_incident_id,
            "relationship_type": self.relationship_type.value,
            "confidence": round(self.confidence, 2),
            "evidence": self.evidence,
            "is_hypothesis": self.is_hypothesis,
        }


@dataclass
class MultiIncidentAnalysisResult:
    """Multi-incident reasoning output detecting clusters and cascades."""
    identified_relationships: List[IncidentRelationship] = field(default_factory=list)
    suspected_shared_causes: List[Dict[str, Any]] = field(default_factory=list)
    potential_cascading_effects: List[str] = field(default_factory=list)
    competing_resource_conflicts: List[str] = field(default_factory=list)
    summary: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "identified_relationships": [r.to_dict() for r in self.identified_relationships],
            "suspected_shared_causes": self.suspected_shared_causes,
            "potential_cascading_effects": self.potential_cascading_effects,
            "competing_resource_conflicts": self.competing_resource_conflicts,
            "summary": self.summary,
        }


@dataclass
class EvacuationRoute:
    """Calculated path recommendation based on verified map data."""
    start_node: str
    destination_exit: str
    path: List[str]
    distance_units: float
    avoided_hazards: List[str]
    selection_reason: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "start_node": self.start_node,
            "destination_exit": self.destination_exit,
            "path": self.path,
            "distance_units": round(self.distance_units, 2),
            "avoided_hazards": self.avoided_hazards,
            "selection_reason": self.selection_reason,
        }


@dataclass
class EvacuationRecommendation:
    """Safety-constrained evacuation decision support."""
    is_evacuation_advised: bool
    routes: List[EvacuationRoute] = field(default_factory=list)
    safe_route_verified: bool = False
    blocked_or_hazardous_zones: List[str] = field(default_factory=list)
    accessibility_notes: List[str] = field(default_factory=list)
    limitations_and_disclaimers: List[str] = field(default_factory=list)
    rationale: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_evacuation_advised": self.is_evacuation_advised,
            "safe_route_verified": self.safe_route_verified,
            "routes": [r.to_dict() for r in self.routes],
            "blocked_or_hazardous_zones": self.blocked_or_hazardous_zones,
            "accessibility_notes": self.accessibility_notes,
            "limitations_and_disclaimers": self.limitations_and_disclaimers,
            "rationale": self.rationale,
        }


@dataclass
class SituationAnalysisResult:
    """Full comprehensive crisis coordination output."""
    incident_id: str
    categories: List[str]
    summary: str
    affected_location: Optional[str]
    risk_assessment: Dict[str, Any]
    recommended_department: str
    recommended_actions: List[Dict[str, Any]]
    resource_recommendations: Dict[str, Any]
    related_incidents: List[Dict[str, Any]]
    evacuation_recommendation: Dict[str, Any]
    uncertainty: Dict[str, Any]
    requires_human_review: bool
    explanation: List[str]
    assessment_version: int = 1
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "incident_id": self.incident_id,
            "categories": self.categories,
            "summary": self.summary,
            "affected_location": self.affected_location,
            "risk_assessment": self.risk_assessment,
            "recommended_department": self.recommended_department,
            "recommended_actions": self.recommended_actions,
            "resource_recommendations": self.resource_recommendations,
            "related_incidents": self.related_incidents,
            "evacuation_recommendation": self.evacuation_recommendation,
            "uncertainty": self.uncertainty,
            "requires_human_review": self.requires_human_review,
            "explanation": self.explanation,
            "assessment_version": self.assessment_version,
            "timestamp": self.timestamp,
        }


@dataclass
class AnalysisOutput:
    """Consolidated public output structure for simple complaint analysis."""
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
