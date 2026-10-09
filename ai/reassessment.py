"""Dynamic situation monitoring and audit-tracked incident reassessment layer."""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional, Union

from ai.schemas import (
    IncidentReport,
    SituationAnalysisResult,
)


def reassess_situation(
    previous_assessment: Union[SituationAnalysisResult, Dict[str, Any]],
    updated_report: Optional[Union[IncidentReport, Dict[str, Any]]] = None,
    campus_context: Optional[Dict[str, Any]] = None,
    resources: Optional[List[Dict[str, Any]]] = None,
    map_data: Optional[Dict[str, Any]] = None,
    analyzer_callable: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Reassess an active incident when new evidence, hazard updates, or resource status changes occur.

    Maintains full auditability by bumping assessment version, logging changes, and preserving history.

    Args:
        previous_assessment: Prior SituationAnalysisResult or dictionary.
        updated_report: Newly updated report text or metadata.
        campus_context: Updated contextual info (occupancy, confirmed hazards, etc.).
        resources: Current available resource state.
        map_data: Campus map topology.
        analyzer_callable: Function to invoke for end-to-end analysis.

    Returns:
        New SituationAnalysisResult dictionary with bumped version and change diff audit trail.
    """
    from ai.engine import analyze_situation  # Avoid circular import

    analysis_fn = analyzer_callable or analyze_situation

    prev_dict = previous_assessment if isinstance(previous_assessment, dict) else previous_assessment.to_dict()
    prev_version = int(prev_dict.get("assessment_version", 1))

    # Determine report to evaluate
    if updated_report:
        report_to_use = updated_report
    else:
        # Reconstruct report from previous assessment
        report_to_use = {
            "incident_id": prev_dict.get("incident_id"),
            "title": prev_dict.get("summary", ""),
            "description": prev_dict.get("summary", ""),
            "location": prev_dict.get("affected_location"),
        }

    # Run fresh situation analysis
    new_result = analysis_fn(
        report=report_to_use,
        campus_context=campus_context,
        resources=resources,
        related_incidents=None,
        map_data=map_data,
    )

    # Bump version and compute audit diffs
    new_version = prev_version + 1
    new_result["assessment_version"] = new_version

    changes_logged: List[str] = []

    # Check Priority / Risk Score shifts
    prev_priority = prev_dict.get("risk_assessment", {}).get("priority")
    new_priority = new_result.get("risk_assessment", {}).get("priority")
    if prev_priority != new_priority:
        changes_logged.append(f"Priority shifted from '{prev_priority}' to '{new_priority}'.")

    prev_score = prev_dict.get("risk_assessment", {}).get("risk_score")
    new_score = new_result.get("risk_assessment", {}).get("risk_score")
    if prev_score != new_score:
        changes_logged.append(f"Risk score updated from {prev_score} to {new_score}.")

    # Check Department shifts
    prev_dept = prev_dict.get("recommended_department")
    new_dept = new_result.get("recommended_department")
    if prev_dept != new_dept:
        changes_logged.append(f"Assigned department updated from '{prev_dept}' to '{new_dept}'.")

    if not changes_logged:
        changes_logged.append("Reassessment confirmed existing priority and department assignments under current parameters.")

    # Append audit trail to explanation
    new_result["explanation"].insert(
        0,
        f"[Dynamic Reassessment v{new_version}] {'; '.join(changes_logged)}"
    )

    return new_result
