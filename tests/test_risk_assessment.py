"""Tests for adaptive risk scoring, safety floors, and uncertainty dynamics."""

import pytest
from ai.classifier import classify_complaint
from ai.risk_assessment import assess_risk
from ai.schemas import PriorityLevel, UncertaintyLevel


def test_high_risk_low_certainty_report():
    """Verify that severe reports with incomplete facts retain high priority and mandate human review."""
    classification = classify_complaint(
        title="Possible smoke or gas leak reported",
        description="Someone said they might have smelled gas or seen smoke somewhere in the basement.",
        location=None,
    )
    res = assess_risk(
        title="Possible smoke or gas leak reported",
        description="Someone said they might have smelled gas or seen smoke somewhere in the basement.",
        classification=classification,
        location=None,
    )
    assert res.priority in [PriorityLevel.CRITICAL, PriorityLevel.HIGH]
    assert res.requires_human_review is True
    assert res.uncertainty_level in [UncertaintyLevel.HIGH, UncertaintyLevel.MEDIUM]
    assert len(res.missing_information) > 0


def test_safety_floor_unconscious_student():
    """Verify safety floor for medical emergency with student fainted in crowded hall."""
    classification = classify_complaint(
        title="Student fainted in crowded corridor",
        description="Student collapsed and is unconscious in Main Block 2nd floor hallway.",
        location="Main Block Corridor",
    )
    res = assess_risk(
        title="Student fainted in crowded corridor",
        description="Student collapsed and is unconscious in Main Block 2nd floor hallway.",
        classification=classification,
        location="Main Block Corridor",
    )
    assert res.priority == PriorityLevel.CRITICAL
    assert res.risk_score >= 85
    assert res.is_safety_critical is True
    assert res.requires_human_review is True


def test_disruption_power_outage_during_exam():
    """Verify disruption weighting during active examination."""
    classification = classify_complaint(
        title="Blackout during ongoing exam",
        description="Complete blackout and server down in exam hall right now.",
        location="Examination Center",
    )
    res = assess_risk(
        title="Blackout during ongoing exam",
        description="Complete blackout and server down in exam hall right now.",
        classification=classification,
        location="Examination Center",
    )
    assert res.priority in [PriorityLevel.CRITICAL, PriorityLevel.HIGH]
    assert res.risk_score >= 60
