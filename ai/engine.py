"""Main CampusOne AI Intelligence Engine orchestrating hybrid reasoning layers."""

from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List, Optional, Union

from ai.classifier import classify_complaint
from ai.config import CampusAIConfig, DEFAULT_CONFIG
from ai.decision_support import recommend_response
from ai.escalation import evaluate_escalation
from ai.evacuation import recommend_evacuation_routes
from ai.incident_graph import analyze_incident_relationships
from ai.language_model import get_language_model_adapter
from ai.reassessment import reassess_situation
from ai.resource_matcher import match_resources
from ai.risk_assessment import assess_risk
from ai.schemas import (
    AnalysisOutput,
    IncidentReport,
    SituationAnalysisResult,
)


def _normalize_incoming_report(
    report: Union[IncidentReport, Dict[str, Any], str],
    location_fallback: Optional[str] = None,
) -> IncidentReport:
    """Normalize various report input types into an IncidentReport."""
    if isinstance(report, IncidentReport):
        return report

    if isinstance(report, dict):
        return IncidentReport(
            incident_id=str(report.get("incident_id") or f"inc_{uuid.uuid4().hex[:8]}"),
            title=str(report.get("title", "")),
            description=str(report.get("description", "")),
            location=report.get("location") or location_fallback,
            reporter_role=report.get("reporter_role"),
            timestamp=float(report.get("timestamp") or time.time()),
            metadata=report.get("metadata", {}),
        )

    # If report is passed as plain string
    return IncidentReport(
        incident_id=f"inc_{uuid.uuid4().hex[:8]}",
        title=str(report)[:60],
        description=str(report),
        location=location_fallback,
        timestamp=time.time(),
    )


def analyze_situation(
    report: Union[IncidentReport, Dict[str, Any], str],
    campus_context: Optional[Dict[str, Any]] = None,
    resources: Optional[List[Dict[str, Any]]] = None,
    related_incidents: Optional[List[Dict[str, Any]]] = None,
    map_data: Optional[Dict[str, Any]] = None,
    config: Optional[CampusAIConfig] = None,
) -> Dict[str, Any]:
    """
    Primary multi-layer crisis coordination and situation analysis entry point.

    Orchestrates NLU extraction, multi-category classification, multi-dimensional risk scoring,
    decision support planning, resource matching, multi-incident correlation, and safe evacuation.

    Args:
        report: Incident report object, dictionary, or text.
        campus_context: Context dictionary (e.g. hazard zones, occupancy, weather, active exams).
        resources: Available campus response teams and equipment.
        related_incidents: Active concurrent reports for correlation.
        map_data: Approved campus topology graph data.
        config: System configuration overrides.

    Returns:
        A JSON-serializable dictionary adhering to the SituationAnalysisResult schema contract.
    """
    cfg = config or DEFAULT_CONFIG
    context = campus_context or {}

    # Step 0: Input Normalization
    inc_report = _normalize_incoming_report(report)

    # Step 1: Language Understanding Layer (NLU)
    nlu_adapter = get_language_model_adapter(cfg.model)
    nlu_extraction = nlu_adapter.extract_structured_information(inc_report)

    # Step 2: Situation Classification Layer
    classification = classify_complaint(
        title=inc_report.title,
        description=inc_report.description,
        location=inc_report.location,
        nlu_extraction=nlu_extraction,
    )

    # Step 3: Adaptive Risk & Urgency Assessment Layer
    risk_res = assess_risk(
        title=inc_report.title,
        description=inc_report.description,
        classification=classification,
        location=inc_report.location,
        nlu_extraction=nlu_extraction,
        config=cfg.risk,
    )

    # Step 4: Decision Support & Action Planning Layer
    decision_plan = recommend_response(
        classification=classification,
        risk_assessment=risk_res,
        location=inc_report.location,
        nlu_extraction=nlu_extraction,
    )

    # Step 5: Resource Coordination Layer
    resource_res = match_resources(
        required_department=decision_plan.responsible_department,
        required_capabilities=decision_plan.required_capabilities,
        location=inc_report.location,
        available_resources=resources,
        priority=risk_res.priority,
        config=cfg.resource,
    )

    # Step 6: Multi-Incident Reasoning Layer
    multi_inc_res = analyze_incident_relationships(
        target_report=inc_report,
        existing_reports=related_incidents,
    )

    # Step 7: Safe Evacuation Decision Support Layer
    hazard_zones = context.get("hazard_zones", [])
    if risk_res.is_safety_critical and inc_report.location:
        if inc_report.location not in hazard_zones:
            hazard_zones = list(hazard_zones) + [inc_report.location]

    evac_res = recommend_evacuation_routes(
        start_location=inc_report.location,
        map_data=map_data,
        hazard_zones=hazard_zones,
        blocked_paths=context.get("blocked_paths", []),
        requires_accessible=bool(context.get("requires_accessible", False)),
    )

    # Step 8: Synthesize Explanations & Uncertainty Summary
    explanation_points: List[str] = [
        classification.explanation,
        risk_res.reasoning_summary,
        f"Recommended Action: {decision_plan.escalation.level.value} — {decision_plan.escalation.reason}.",
        f"Resource Coordination: {resource_res.status_summary}. {resource_res.recommendation_note}",
    ]

    if multi_inc_res.identified_relationships:
        explanation_points.append(
            f"Cross-Incident Correlation: {len(multi_inc_res.identified_relationships)} relationship(s) flagged."
        )

    if risk_res.requires_human_review:
        explanation_points.append(
            f"Human Oversight Required: Uncertainty is {risk_res.uncertainty_level.value}; staff review is mandatory."
        )

    uncertainty_dict = {
        "level": risk_res.uncertainty_level.value,
        "nlu_confidence": nlu_extraction.confidence,
        "classification_confidence": classification.confidence,
        "missing_information": risk_res.missing_information,
        "conflicting_elements": nlu_extraction.conflicting_or_contradictory_elements,
        "is_unfamiliar": classification.is_unfamiliar,
    }

    result = SituationAnalysisResult(
        incident_id=inc_report.incident_id or f"inc_{uuid.uuid4().hex[:8]}",
        categories=classification.all_categories or [classification.category.value],
        summary=inc_report.title or nlu_extraction.primary_problem,
        affected_location=inc_report.location,
        risk_assessment=risk_res.to_dict(),
        recommended_department=decision_plan.responsible_department,
        recommended_actions=[a.to_dict() for a in decision_plan.immediate_next_steps],
        resource_recommendations=resource_res.to_dict(),
        related_incidents=multi_inc_res.to_dict()["identified_relationships"],
        evacuation_recommendation=evac_res.to_dict(),
        uncertainty=uncertainty_dict,
        requires_human_review=risk_res.requires_human_review,
        explanation=explanation_points,
        assessment_version=1,
    )

    return result.to_dict()


def analyze_complaint(
    title: Optional[str],
    description: Optional[str],
    location: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Backwards-compatible public interface for simple complaint analysis.

    Returns the exact 9-field schema dictionary expected by existing consumers and test suites.
    """
    safe_title = str(title).strip() if title is not None else ""
    safe_desc = str(description).strip() if description is not None else ""
    safe_loc = str(location).strip() if location is not None else None

    # Run situation analysis
    situation_res = analyze_situation(
        report={"title": safe_title, "description": safe_desc, "location": safe_loc}
    )

    risk_dict = situation_res["risk_assessment"]
    conf = situation_res["uncertainty"]["classification_confidence"]

    # Map to classic AnalysisOutput format
    output = AnalysisOutput(
        category=situation_res["categories"][0],
        assigned_department=situation_res["recommended_department"],
        classification_confidence=conf,
        priority=risk_dict["priority"],
        priority_score=risk_dict["risk_score"],
        reason=risk_dict["reasoning_summary"].split(".")[1].strip() if "." in risk_dict["reasoning_summary"] else risk_dict["reasoning_summary"],
        requires_human_review=situation_res["requires_human_review"],
        escalation={
            "escalate": risk_dict["priority"] in ["Critical", "High"],
            "level": "Emergency review" if risk_dict["priority"] == "Critical" else ("Urgent review" if risk_dict["priority"] == "High" else ("Standard review" if risk_dict["priority"] == "Medium" else "No escalation")),
            "reason": risk_dict["reasoning_summary"],
            "recommended_action": situation_res["recommended_actions"][0]["action"] if situation_res["recommended_actions"] else "",
        },
        explanation=situation_res["explanation"],
    )

    return output.to_dict()


def batch_analyze_complaints(
    complaints: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Process a list of complaints in batch and return structured analysis for each.
    """
    if not isinstance(complaints, list):
        return []

    results: List[Dict[str, Any]] = []
    for item in complaints:
        if not isinstance(item, dict):
            results.append(analyze_complaint(title="", description="", location=None))
            continue

        analysis = analyze_complaint(
            title=item.get("title"),
            description=item.get("description"),
            location=item.get("location"),
        )
        results.append(analysis)

    return results
