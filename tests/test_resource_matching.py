"""Tests for resource matching, workload scoring, and unavailable resource constraints."""

import pytest
from ai.resource_matcher import match_resources
from ai.schemas import PriorityLevel, ResourceRecord


def test_successful_resource_match():
    """Verify ranking of available response personnel matching required capabilities and location."""
    resources = [
        {
            "resource_id": "tech_01",
            "type": "personnel",
            "team": "IT Support",
            "skills": ["network diagnostics", "wi-fi repair", "router configuration"],
            "availability": True,
            "location": "Main Block Room 101",
            "workload": 0,
            "readiness": "Ready",
        },
        {
            "resource_id": "tech_02",
            "type": "personnel",
            "team": "IT Support",
            "skills": ["printer repair"],
            "availability": True,
            "location": "Hostel",
            "workload": 2,
            "readiness": "Ready",
        },
    ]

    result = match_resources(
        required_department="IT Support",
        required_capabilities=["network diagnostics", "wi-fi repair"],
        location="Main Block Room 102",
        available_resources=resources,
        priority=PriorityLevel.HIGH,
    )

    assert len(result.matched_resources) > 0
    assert result.matched_resources[0]["resource_id"] == "tech_01"
    assert "Found" in result.status_summary


def test_no_suitable_resource_confirmed():
    """Verify explicit 'No suitable resource confirmed' status when no resources meet criteria."""
    resources = [
        {
            "resource_id": "guard_01",
            "type": "personnel",
            "team": "Campus Security",
            "skills": ["patrol"],
            "availability": False,
            "workload": 3,
            "readiness": "Busy",
        }
    ]

    result = match_resources(
        required_department="Laboratory Management",
        required_capabilities=["Chemical Hazard Containment"],
        location="Chemistry Lab",
        available_resources=resources,
        priority=PriorityLevel.CRITICAL,
    )

    assert result.status_summary == "No suitable resource confirmed"
    assert len(result.unmet_requirements) > 0
    assert "Escalate" in result.recommendation_note or "Recommend" in result.recommendation_note


def test_empty_resource_list():
    """Verify safe handling when resource list is empty or None."""
    result = match_resources(
        required_department="Estate & Maintenance",
        required_capabilities=["High Voltage Electrical"],
        location="Substation",
        available_resources=[],
    )
    assert result.status_summary == "No suitable resource confirmed"
