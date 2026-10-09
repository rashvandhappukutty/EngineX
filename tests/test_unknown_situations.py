"""Tests for handling unfamiliar, novel, and open-ended campus incidents."""

import pytest
from ai.classifier import classify_complaint
from ai.engine import analyze_situation
from ai.schemas import ComplaintCategory, UncertaintyLevel


def test_unfamiliar_flooding_incident():
    """Verify that severe weather flooding is recognized as an unfamiliar/needs-assessment crisis."""
    report = {
        "title": "Heavy rain floods main campus entrance",
        "description": "Flash flooding has submerged the entrance gate with rising water levels blocking vehicles.",
        "location": "Main Entrance Gate",
    }
    result = analyze_situation(report)

    assert "Needs Assessment" in result["categories"] or "Other" in result["categories"] or "General / Unknown" in result["categories"]
    assert result["requires_human_review"] is True
    assert result["uncertainty"]["is_unfamiliar"] is True
    assert result["risk_assessment"]["priority"] in ["Critical", "High"]


def test_unfamiliar_drone_airspace_incident():
    """Verify that unexpected drone surveillance is not forced into unrelated categories."""
    report = {
        "title": "Unidentified drone hovering over examination hall",
        "description": "A strange drone without identification is flying low near the roof windows.",
        "location": "Examination Center",
    }
    result = analyze_situation(report)

    assert result["uncertainty"]["is_unfamiliar"] is True
    assert result["requires_human_review"] is True
    assert result["categories"] != ["IT and Network"]  # Must not force into IT


def test_unfamiliar_wildlife_courtyard():
    """Verify that a wildlife encounter is handled cautiously with high uncertainty."""
    res = classify_complaint(
        title="Venomous snake spotted near central courtyard",
        description="A large snake was seen slithering into the shrubbery near the student benches.",
        location="Central Courtyard",
    )
    assert res.is_unfamiliar is True
    assert res.category == ComplaintCategory.NEEDS_ASSESSMENT
    assert "Emergency Coordination Center" in res.assigned_department
