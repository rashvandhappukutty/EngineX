"""Tests for multi-incident reasoning, duplicate detection, and shared infrastructure causes."""

import pytest
from ai.incident_graph import analyze_incident_relationships
from ai.schemas import IncidentReport, RelationshipType


def test_duplicate_incident_detection():
    """Verify detection of duplicate complaints from multiple students in the same room."""
    target = {
        "incident_id": "inc_001",
        "title": "Wi-Fi is completely broken in room 302",
        "description": "The internet connection has dropped and students cannot connect in Room 302.",
        "location": "Room 302",
    }
    existing = [
        {
            "incident_id": "inc_002",
            "title": "Wi-Fi not working in room 302",
            "description": "Internet connection down in Room 302, no connectivity.",
            "location": "Room 302",
        }
    ]

    result = analyze_incident_relationships(target, existing)
    assert len(result.identified_relationships) == 1
    rel = result.identified_relationships[0]
    assert rel.relationship_type == RelationshipType.DUPLICATE
    assert rel.is_hypothesis is True


def test_shared_cause_multi_building_blackout():
    """Verify that electrical outages across multiple blocks trigger a shared substation failure hypothesis."""
    target = {
        "incident_id": "inc_power_1",
        "title": "Power failure in Mechanical Block",
        "description": "All lights and machines went off suddenly due to blackout.",
        "location": "Mechanical Block",
    }
    existing = [
        {
            "incident_id": "inc_power_2",
            "title": "Electricity blackout in Science Block",
            "description": "Complete electrical power cut across all classrooms in Science Block.",
            "location": "Science Block",
        }
    ]

    result = analyze_incident_relationships(target, existing)
    assert len(result.suspected_shared_causes) >= 1
    cause = result.suspected_shared_causes[0]
    assert "Substation" in cause["inferred_cause"] or "Feeder" in cause["inferred_cause"]
    assert cause["confidence"] >= 0.75
