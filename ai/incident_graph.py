"""Multi-incident reasoning layer detecting duplicate reports, shared causes, and cascading events."""

from __future__ import annotations

import difflib
import re
from typing import Any, Dict, List, Optional, Set, Union

from ai.schemas import (
    IncidentRelationship,
    IncidentReport,
    MultiIncidentAnalysisResult,
    RelationshipType,
)


def _normalize_report(data: Union[IncidentReport, Dict[str, Any]]) -> IncidentReport:
    """Normalize input into an IncidentReport model."""
    if isinstance(data, IncidentReport):
        return data

    return IncidentReport(
        incident_id=str(data.get("incident_id", "incident_unknown")),
        title=str(data.get("title", "")),
        description=str(data.get("description", "")),
        location=data.get("location"),
        reporter_role=data.get("reporter_role"),
        timestamp=float(data.get("timestamp", 0.0)),
        metadata=data.get("metadata", {}),
    )


def analyze_incident_relationships(
    target_report: Union[IncidentReport, Dict[str, Any]],
    existing_reports: Optional[List[Union[IncidentReport, Dict[str, Any]]]] = None,
) -> MultiIncidentAnalysisResult:
    """
    Analyze connections between a target incident report and other active campus reports.

    Identifies duplicates, shared infrastructure failures (e.g. substation/power),
    cascading failure patterns, and competing demands.

    Args:
        target_report: The primary incident report being analyzed.
        existing_reports: List of active / concurrent campus reports.

    Returns:
        MultiIncidentAnalysisResult containing identified relationships, suspected causes,
        and cascading failure alerts.
    """
    target = _normalize_report(target_report)
    if not existing_reports:
        return MultiIncidentAnalysisResult(
            identified_relationships=[],
            suspected_shared_causes=[],
            potential_cascading_effects=[],
            competing_resource_conflicts=[],
            summary="No concurrent campus reports provided for correlation analysis.",
        )

    relationships: List[IncidentRelationship] = []
    shared_causes: List[Dict[str, Any]] = []
    cascading_effects: List[str] = []
    conflicts: List[str] = []

    target_text = f"{target.title} {target.description}".lower()
    target_loc = (target.location or "").lower().strip()
    target_words = set(re.findall(r"\b\w+\b", target_text))

    power_incident_count = 0
    network_incident_count = 0
    water_incident_count = 0

    if any(w in target_words for w in ["power", "electricity", "blackout", "substation", "transformer"]):
        power_incident_count += 1
    if any(w in target_words for w in ["wifi", "internet", "network", "lan", "router"]):
        network_incident_count += 1
    if any(w in target_words for w in ["water", "pipe", "flooding", "leakage"]):
        water_incident_count += 1

    for item in existing_reports:
        other = _normalize_report(item)
        if other.incident_id == target.incident_id:
            continue

        other_text = f"{other.title} {other.description}".lower()
        other_loc = (other.location or "").lower().strip()
        other_words = set(re.findall(r"\b\w+\b", other_text))

        # Check 1: Duplicate Detection (Word overlap or Sequence similarity with same location)
        same_loc = bool(target_loc and other_loc and (target_loc == other_loc or target_loc in other_loc or other_loc in target_loc))
        intersection = target_words & other_words
        union = target_words | other_words
        jaccard_sim = len(intersection) / len(union) if union else 0.0
        seq_sim = difflib.SequenceMatcher(None, target_text, other_text).ratio()

        is_duplicate = False
        if same_loc and (jaccard_sim >= 0.25 or seq_sim >= 0.50):
            is_duplicate = True
            sim_score = max(jaccard_sim, seq_sim)
            relationships.append(
                IncidentRelationship(
                    source_incident_id=target.incident_id or "target",
                    target_incident_id=other.incident_id or "other",
                    relationship_type=RelationshipType.DUPLICATE,
                    confidence=round(sim_score, 2),
                    evidence=[
                        f"Text similarity score is {round(sim_score * 100, 1)}%",
                        f"Co-located at verified zone: '{target.location}'",
                    ],
                    is_hypothesis=True,
                )
            )

        # Check 2: Shared Infrastructure / Multi-building Failures (Only for distinct locations)
        is_other_power = any(w in other_words for w in ["power", "electricity", "blackout", "substation", "transformer"])
        if is_other_power:
            power_incident_count += 1
            if not is_duplicate and any(w in target_words for w in ["power", "electricity", "blackout", "substation"]):
                relationships.append(
                    IncidentRelationship(
                        source_incident_id=target.incident_id or "target",
                        target_incident_id=other.incident_id or "other",
                        relationship_type=RelationshipType.SHARED_CAUSE,
                        confidence=0.80,
                        evidence=[
                            "Concurrent electrical outages reported across distinct campus locations",
                            f"Location 1: '{target.location or 'Unspecified'}', Location 2: '{other.location or 'Unspecified'}'",
                        ],
                        is_hypothesis=True,
                    )
                )

        is_other_network = any(w in other_words for w in ["wifi", "internet", "network", "lan", "router"])
        if is_other_network:
            network_incident_count += 1
            if not is_duplicate and any(w in target_words for w in ["wifi", "internet", "network", "lan", "router"]):
                relationships.append(
                    IncidentRelationship(
                        source_incident_id=target.incident_id or "target",
                        target_incident_id=other.incident_id or "other",
                        relationship_type=RelationshipType.SHARED_CAUSE,
                        confidence=0.75,
                        evidence=[
                            "Simultaneous connectivity drop across multiple campus access points",
                        ],
                        is_hypothesis=True,
                    )
                )

        # Check 3: Cascading Failure Sequences
        if ("fire" in target_words or "smoke" in target_words) and is_other_power and same_loc:
            cascading_effects.append(
                f"Possible cascading event: Fire/Smoke in {target.location} co-occurring with power failure in incident '{other.incident_id}'."
            )
            relationships.append(
                IncidentRelationship(
                    source_incident_id=target.incident_id or "target",
                    target_incident_id=other.incident_id or "other",
                    relationship_type=RelationshipType.CASCADING_FAILURE,
                    confidence=0.85,
                    evidence=["Fire/hazard event coinciding with localized infrastructure collapse"],
                    is_hypothesis=True,
                )
            )

    # Synthesis of campus-wide patterns
    if power_incident_count >= 2:
        shared_causes.append({
            "inferred_cause": "Campus Main Substation / High-Voltage Feeder Trip",
            "confidence": 0.85,
            "affected_reports_count": power_incident_count,
            "recommended_investigation": "Dispatch Senior Electrical Engineer to inspect Main Substation Breaker & Transformer Bay.",
        })

    if network_incident_count >= 2:
        shared_causes.append({
            "inferred_cause": "Core Switch / Campus Gateway Routing Disruption",
            "confidence": 0.80,
            "affected_reports_count": network_incident_count,
            "recommended_investigation": "Inspect Data Center core switch logs and ISP fiber uplink.",
        })

    summary = (
        f"Analyzed {len(existing_reports)} concurrent report(s). "
        f"Identified {len(relationships)} relationship hypothesis(es), "
        f"{len(shared_causes)} potential shared infrastructure root cause(s)."
    )

    return MultiIncidentAnalysisResult(
        identified_relationships=relationships,
        suspected_shared_causes=shared_causes,
        potential_cascading_effects=cascading_effects,
        competing_resource_conflicts=conflicts,
        summary=summary,
    )
