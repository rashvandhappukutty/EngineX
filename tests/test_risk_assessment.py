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


def test_benign_fire_drill_announcement():
    """Verify pure benign drill announcements do not trigger false emergency alarms."""
    classification = classify_complaint(
        title="Fire drill notice for Tuesday",
        description="Annual scheduled fire drill notice and fire safety awareness session next week.",
        location="Campus Administration",
    )
    res = assess_risk(
        title="Fire drill notice for Tuesday",
        description="Annual scheduled fire drill notice and fire safety awareness session next week.",
        classification=classification,
        location="Campus Administration",
    )
    assert res.is_safety_critical is False
    assert res.priority != PriorityLevel.CRITICAL


def test_actual_fire_during_drill_not_suppressed():
    """Defect 3 fix: Real fire during a drill MUST trigger Critical safety floor."""
    classification = classify_complaint(
        title="Fire drill in progress but actual fire broke out in Room 302",
        description="During the scheduled fire drill, an actual fire and heavy smoke erupted from the server rack!",
        location="Room 302",
    )
    res = assess_risk(
        title="Fire drill in progress but actual fire broke out in Room 302",
        description="During the scheduled fire drill, an actual fire and heavy smoke erupted from the server rack!",
        classification=classification,
        location="Room 302",
    )
    assert res.is_safety_critical is True
    assert res.priority == PriorityLevel.CRITICAL
    assert res.risk_score >= 85
    assert res.requires_human_review is True


def test_explicitly_negated_hazard_false_positive():
    """Defect 3 fix: Explicitly negated safety keywords do not trigger false critical safety alarms."""
    classification = classify_complaint(
        title="False alarm report: no fire and no smoke found",
        description="Security inspected room 104; no fire, without smoke, and no injuries detected.",
        location="Room 104",
    )
    res = assess_risk(
        title="False alarm report: no fire and no smoke found",
        description="Security inspected room 104; no fire, without smoke, and no injuries detected.",
        classification=classification,
        location="Room 104",
    )
    assert res.is_safety_critical is False
    assert res.priority != PriorityLevel.CRITICAL


def test_mixed_benign_and_dangerous_description():
    """Verify mixed reports with separate dangerous chemical spill are flagged critical."""
    classification = classify_complaint(
        title="Fire safety workshop question plus chemical reaction leak",
        description="Attended fire safety awareness class, but in chemistry lab there is an active acid spill and fumes right now.",
        location="Chemistry Lab",
    )
    res = assess_risk(
        title="Fire safety workshop question plus chemical reaction leak",
        description="Attended fire safety awareness class, but in chemistry lab there is an active acid spill and fumes right now.",
        classification=classification,
        location="Chemistry Lab",
    )
    assert res.is_safety_critical is True
    assert res.priority == PriorityLevel.CRITICAL
    assert res.requires_human_review is True
