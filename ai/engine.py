"""Core intelligence engine orchestrating classification, priority scoring, and escalation."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ai.classifier import classify_complaint
from ai.escalation import evaluate_escalation
from ai.priority import calculate_priority
from ai.schemas import AnalysisOutput


def analyze_complaint(
    title: Optional[str],
    description: Optional[str],
    location: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Process a college complaint or incident report end-to-end.

    Performs category classification, department assignment, urgency & safety risk scoring,
    and escalation determination with complete explainability.

    Args:
        title: Short title or subject line of the complaint.
        description: Detailed explanation of the issue or incident.
        location: Optional campus building, room, or location.

    Returns:
        A JSON-serializable dictionary containing classification, priority,
        escalation status, human review flag, and step-by-step explanations.
    """
    # Safe input normalization
    safe_title = str(title).strip() if title is not None else ""
    safe_desc = str(description).strip() if description is not None else ""
    safe_loc = str(location).strip() if location is not None else None

    # Step 1: Classification
    classification = classify_complaint(
        title=safe_title,
        description=safe_desc,
        location=safe_loc,
    )

    # Step 2: Priority & Safety Assessment
    priority_res = calculate_priority(
        title=safe_title,
        description=safe_desc,
        classification=classification,
        location=safe_loc,
    )

    # Step 3: Escalation Evaluation
    escalation_info = evaluate_escalation(
        classification=classification,
        priority=priority_res,
    )

    # Step 4: Synthesize Explainability Bullet Points
    explanation_points: List[str] = []

    # Reason for category selection
    explanation_points.append(classification.explanation)

    # Urgency & Priority rules triggered
    explanation_points.append(priority_res.explanation)

    # Escalation decision rationale
    if escalation_info.escalate:
        explanation_points.append(
            f"Escalation flagged ({escalation_info.level.value}): {escalation_info.reason}."
        )
    else:
        explanation_points.append(
            f"Escalation not required ({escalation_info.level.value}): {escalation_info.reason}."
        )

    # Uncertainty / Human review status
    if priority_res.requires_human_review:
        if classification.is_ambiguous:
            explanation_points.append(
                "Human review required: Classification is ambiguous between competing categories."
            )
        elif classification.confidence < 0.50:
            explanation_points.append(
                "Human review required: Classification confidence is low."
            )
        elif priority_res.is_safety_critical:
            explanation_points.append(
                "Human review required: Potential safety threat requires manual intervention."
            )
        else:
            explanation_points.append(
                "Human review required: High priority or operational tier requires staff validation."
            )
    else:
        explanation_points.append(
            "Classification and priority are within confident operational limits; standard routing applied."
        )

    # Format output model
    output = AnalysisOutput(
        category=classification.category.value,
        assigned_department=classification.assigned_department,
        classification_confidence=classification.confidence,
        priority=priority_res.priority.value,
        priority_score=priority_res.priority_score,
        reason=priority_res.reason,
        requires_human_review=priority_res.requires_human_review,
        escalation=escalation_info.to_dict(),
        explanation=explanation_points,
    )

    return output.to_dict()


def batch_analyze_complaints(
    complaints: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Process a list of complaints in batch and return structured analysis for each.

    Args:
        complaints: A list of dictionaries, where each dict may contain 'title',
                    'description', and optionally 'location'.

    Returns:
        A list of analysis result dictionaries matching `analyze_complaint` output format.
    """
    if not isinstance(complaints, list):
        return []

    results: List[Dict[str, Any]] = []
    for item in complaints:
        if not isinstance(item, dict):
            # Graceful handling for non-dict items in batch
            results.append(analyze_complaint(title="", description="", location=None))
            continue

        title = item.get("title")
        description = item.get("description")
        location = item.get("location")

        analysis = analyze_complaint(
            title=title,
            description=description,
            location=location,
        )
        results.append(analysis)

    return results
