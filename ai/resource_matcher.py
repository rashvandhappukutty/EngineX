"""Resource coordination layer for matching campus response teams and equipment."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set, Union

from ai.config import DEFAULT_CONFIG, ResourceMatchingConfig
from ai.schemas import (
    PriorityLevel,
    ResourceMatchResult,
    ResourceRecord,
)


def _parse_resource_record(data: Union[ResourceRecord, Dict[str, Any]]) -> ResourceRecord:
    """Normalize input into a strong ResourceRecord model."""
    if isinstance(data, ResourceRecord):
        return data

    return ResourceRecord(
        resource_id=str(data.get("resource_id", "unknown_resource")),
        type=str(data.get("type", "personnel")),
        team=str(data.get("team", "General")),
        skills=[str(s).lower() for s in data.get("skills", [])],
        availability=bool(data.get("availability", True)),
        location=data.get("location"),
        workload=int(data.get("workload", 0)),
        readiness=str(data.get("readiness", "Ready")),
        equipment=[str(e) for e in data.get("equipment", [])],
    )


def match_resources(
    required_department: str,
    required_capabilities: List[str],
    location: Optional[str] = None,
    available_resources: Optional[List[Union[ResourceRecord, Dict[str, Any]]]] = None,
    priority: Optional[PriorityLevel] = None,
    config: Optional[ResourceMatchingConfig] = None,
) -> ResourceMatchResult:
    """
    Evaluate and rank available campus resources for incident dispatch.

    Args:
        required_department: Department assigned to the incident.
        required_capabilities: Required capabilities/skills.
        location: Incident location.
        available_resources: List of candidate resource records.
        priority: Incident priority level.
        config: Matching weights configuration.

    Returns:
        ResourceMatchResult with ranked matched resources or explicit 'No suitable resource confirmed' status.
    """
    cfg = config or DEFAULT_CONFIG.resource

    if not available_resources:
        return ResourceMatchResult(
            matched_resources=[],
            unmet_requirements=required_capabilities or [f"{required_department} team"],
            status_summary="No suitable resource confirmed",
            competing_demands=[],
            recommendation_note=(
                f"No verified resources provided for '{required_department}'. "
                "Escalate to Campus Operations Center for manual dispatch assignment."
            ),
        )

    parsed_resources: List[ResourceRecord] = []
    for item in available_resources:
        try:
            parsed_resources.append(_parse_resource_record(item))
        except Exception:
            continue

    req_caps_lower = {c.lower() for c in required_capabilities}
    loc_clean = (location or "").lower()

    scored_candidates: List[Dict[str, Any]] = []
    competing_demands: List[str] = []

    for r in parsed_resources:
        # Check readiness / availability status
        if not r.availability or r.readiness in ["Busy", "Off Duty"]:
            if r.workload > 0:
                competing_demands.append(
                    f"Resource '{r.resource_id}' ({r.team}) is currently engaged with {r.workload} active task(s)."
                )
            continue

        score = 0.0
        match_details: List[str] = []

        # 1. Team / Department alignment
        dept_keywords = required_department.lower().split()
        team_lower = r.team.lower()
        if any(dk in team_lower for dk in dept_keywords):
            score += 30.0
            match_details.append(f"Team alignment with {r.team}")

        # 2. Skill match
        r_skills = {s.lower() for s in r.skills}
        matching_skills = req_caps_lower & r_skills
        if req_caps_lower:
            skill_ratio = len(matching_skills) / len(req_caps_lower)
            score += skill_ratio * (cfg.skill_match_weight * 100)
            if matching_skills:
                match_details.append(f"Matching capabilities: {', '.join(matching_skills)}")
        else:
            score += 20.0

        # 3. Location Proximity
        if r.location and loc_clean:
            r_loc_clean = r.location.lower()
            if r_loc_clean == loc_clean or r_loc_clean in loc_clean or loc_clean in r_loc_clean:
                score += cfg.proximity_weight * 100
                match_details.append(f"On-scene / Co-located in {r.location}")
            elif any(part in loc_clean for part in r_loc_clean.split()):
                score += (cfg.proximity_weight * 100) * 0.6
                match_details.append(f"Nearby zone: {r.location}")

        # 4. Workload penalty
        workload_score = max(0.0, 1.0 - (r.workload * 0.25)) * (cfg.workload_weight * 100)
        score += workload_score

        # 5. Readiness bonus
        if r.readiness == "Ready":
            score += cfg.availability_weight * 100

        scored_candidates.append({
            "resource_id": r.resource_id,
            "type": r.type,
            "team": r.team,
            "location": r.location,
            "workload": r.workload,
            "readiness": r.readiness,
            "suitability_score": round(score, 1),
            "match_details": match_details,
            "equipment": r.equipment,
        })

    # Sort candidates by suitability score descending
    scored_candidates.sort(key=lambda x: x["suitability_score"], reverse=True)

    # Viable candidates threshold
    viable_matches = [c for c in scored_candidates if c["suitability_score"] >= 25.0]

    if not viable_matches:
        return ResourceMatchResult(
            matched_resources=[],
            unmet_requirements=required_capabilities or [f"{required_department} team"],
            status_summary="No suitable resource confirmed",
            competing_demands=competing_demands,
            recommendation_note=(
                f"Candidate resources evaluated, but none met minimum availability or capability criteria for '{required_department}'. "
                "Recommend authorized human supervisor reassignment."
            ),
        )

    return ResourceMatchResult(
        matched_resources=viable_matches,
        unmet_requirements=[],
        status_summary=f"Found {len(viable_matches)} suitable candidate resource(s)",
        competing_demands=competing_demands,
        recommendation_note=f"Top recommended resource: {viable_matches[0]['resource_id']} ({viable_matches[0]['team']}).",
    )
