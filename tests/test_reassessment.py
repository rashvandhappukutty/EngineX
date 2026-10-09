"""Tests for dynamic incident reassessment and versioned audit history."""

import pytest
from ai.engine import analyze_situation
from ai.reassessment import reassess_situation


def test_dynamic_reassessment_escalation():
    """Verify that an initial minor smoke report escalates to Critical when active flames are confirmed."""
    initial_report = {
        "incident_id": "inc_reassess_01",
        "title": "Slight burning smell in Chemistry Lab",
        "description": "Someone noticed a faint burning smell near the back storage.",
        "location": "Chemistry Lab",
    }
    initial_analysis = analyze_situation(initial_report)
    assert initial_analysis["assessment_version"] == 1

    # New report update: Active flames and chemical reaction
    updated_report = {
        "incident_id": "inc_reassess_01",
        "title": "Active fire and chemical spill in Chemistry Lab",
        "description": "Active flames on chemical rack and acid bottle spilled on floor!",
        "location": "Chemistry Lab",
    }
    reassessed = reassess_situation(
        previous_assessment=initial_analysis,
        updated_report=updated_report,
    )

    assert reassessed["assessment_version"] == 2
    assert reassessed["risk_assessment"]["priority"] == "Critical"
    assert any("Dynamic Reassessment v2" in exp for exp in reassessed["explanation"])
