"""End-to-end integration and schema conformance tests for CampusOne AI engine."""

import pytest
from ai.engine import analyze_complaint, batch_analyze_complaints


def test_contract_shape_wifi_outage():
    """Verify exact JSON schema compliance for Wi-Fi outage complaint."""
    res = analyze_complaint(
        title="Campus Wi-Fi Outage in Block C",
        description="The Wi-Fi router is offline and internet access has stopped across the entire block.",
        location="Block C 3rd Floor",
    )

    # Required contract fields
    assert "category" in res
    assert "assigned_department" in res
    assert "classification_confidence" in res
    assert "priority" in res
    assert "priority_score" in res
    assert "reason" in res
    assert "requires_human_review" in res
    assert "escalation" in res
    assert "explanation" in res

    # Types and values
    assert res["category"] == "IT and Network"
    assert res["assigned_department"] == "IT Support"
    assert isinstance(res["classification_confidence"], float)
    assert 0.0 <= res["classification_confidence"] <= 1.0
    assert res["priority"] in ["Critical", "High", "Medium", "Low"]
    assert isinstance(res["priority_score"], int)
    assert 0 <= res["priority_score"] <= 100
    assert isinstance(res["requires_human_review"], bool)
    assert isinstance(res["explanation"], list)
    assert len(res["explanation"]) >= 3

    # Escalation sub-dictionary
    esc = res["escalation"]
    assert isinstance(esc["escalate"], bool)
    assert "level" in esc
    assert "reason" in esc
    assert "recommended_action" in esc


def test_scenario_broken_fan_electrical():
    """Verify broken fan or electrical issue analysis."""
    res = analyze_complaint(
        title="Ceiling fan sparking in classroom 204",
        description="The ceiling fan switchboard has loose wiring and is sparking when turned on.",
        location="Mechanical Block Room 204",
    )
    assert res["category"] == "Maintenance and Electrical"
    assert res["assigned_department"] == "Estate & Maintenance"
    assert res["priority"] in ["Critical", "High"]
    assert res["requires_human_review"] is True


def test_scenario_sanitation():
    """Verify sanitation and housekeeping complaint."""
    res = analyze_complaint(
        title="Restroom cleanliness issue",
        description="The washrooms on the 1st floor have overflowing dustbins and need mopping.",
        location="Main Building 1st floor",
    )
    assert res["category"] == "Housekeeping and Sanitation"
    assert res["assigned_department"] == "Housekeeping & Sanitation"
    assert res["priority"] in ["Medium", "Low"]


def test_scenario_bus_delay():
    """Verify transport delay complaint."""
    res = analyze_complaint(
        title="Bus route 12 delayed by 1 hour",
        description="The morning shuttle bus for students from Gandhipuram was delayed due to route breakdown.",
        location="Campus Bus Stop",
    )
    assert res["category"] == "Transport"
    assert res["assigned_department"] == "Transport Office"


def test_scenario_lab_safety_incident():
    """Verify laboratory incident report."""
    res = analyze_complaint(
        title="Acid reagent spill in Chemistry Lab",
        description="A student accidentally knocked over a bottle of concentrated hydrochloric acid near the fume hood.",
        location="Chemistry Lab",
    )
    assert res["priority"] == "Critical"
    assert res["priority_score"] >= 85
    assert res["requires_human_review"] is True
    assert res["escalation"]["escalate"] is True
    assert res["escalation"]["level"] == "Emergency review"


def test_scenario_possible_fire():
    """Verify fire emergency triage."""
    res = analyze_complaint(
        title="Flames and smoke near electrical panel",
        description="Fire detected near the generator room behind the boys hostel!",
        location="Generator Room",
    )
    assert res["priority"] == "Critical"
    assert res["priority_score"] >= 88
    assert res["requires_human_review"] is True
    assert res["escalation"]["escalate"] is True


def test_scenario_ambiguous_and_conflicting():
    """Verify ambiguous report with conflicting category keywords."""
    res = analyze_complaint(
        title="Hostel water leakage near electrical switchboard and internet router",
        description="Plumbing pipe is leaking water directly onto the Wi-Fi router and electrical switch.",
        location="Hostel Block A",
    )
    assert res["requires_human_review"] is True
    assert len(res["explanation"]) > 0


def test_scenario_unknown_category():
    """Verify unclassifiable text defaults to General / Unknown with review required."""
    res = analyze_complaint(
        title="General inquiry",
        description="Lorem ipsum dolor sit amet consectetur adipiscing elit.",
        location="Campus",
    )
    assert res["category"] == "General / Unknown"
    assert res["assigned_department"] == "Helpdesk General Triage"
    assert res["classification_confidence"] == 0.0
    assert res["requires_human_review"] is True


def test_empty_and_invalid_inputs():
    """Verify engine handles None, empty strings, and special characters cleanly."""
    res_none = analyze_complaint(title=None, description=None, location=None)
    assert res_none["category"] == "General / Unknown"
    assert res_none["classification_confidence"] == 0.0

    res_empty = analyze_complaint(title="   ", description="", location=" ")
    assert res_empty["category"] == "General / Unknown"


def test_batch_processing():
    """Verify batch complaint processing."""
    batch_input = [
        {
            "title": "Wi-Fi disconnected in library",
            "description": "Internet connection drops every 5 minutes in the digital library.",
            "location": "Library 2nd Floor",
        },
        {
            "title": "Medical clinic first aid needed",
            "description": "Student injured knee on football ground, bleeding needs dressing.",
            "location": "Football Ground",
        },
        {
            "title": "Bus pass renewal queue",
            "description": "Transport office counter for bus pass renewal is crowded.",
            "location": "Transport Office",
        },
    ]

    results = batch_analyze_complaints(batch_input)
    assert len(results) == 3
    assert results[0]["category"] == "IT and Network"
    assert results[1]["category"] == "Medical and Safety"
    assert results[1]["priority"] in ["Critical", "High"]
    assert results[2]["category"] == "Transport"


def test_batch_processing_malformed():
    """Verify batch processing gracefully handles non-dict items and empty list."""
    assert batch_analyze_complaints([]) == []
    results = batch_analyze_complaints([None, "invalid", {"title": "broken chair", "description": "chair leg broken"}])
    assert len(results) == 3
    assert results[2]["category"] == "Maintenance and Electrical"
