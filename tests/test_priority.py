"""Tests for priority scoring and safety risk assessment."""

import pytest
from ai.classifier import classify_complaint
from ai.priority import calculate_priority
from ai.schemas import PriorityLevel


def test_priority_critical_fire_hazard():
    """Verify that fire and life-safety hazards trigger Critical priority and human review."""
    classification = classify_complaint(
        title="Fire and heavy smoke in Chemistry Lab",
        description="There are active flames and smoke coming from the chemical storage rack in Chemistry Lab 3!",
        location="Chemistry Lab 3",
    )
    res = calculate_priority(
        title="Fire and heavy smoke in Chemistry Lab",
        description="There are active flames and smoke coming from the chemical storage rack in Chemistry Lab 3!",
        classification=classification,
        location="Chemistry Lab 3",
    )
    assert res.priority == PriorityLevel.CRITICAL
    assert res.priority_score >= 85
    assert res.requires_human_review is True
    assert res.is_safety_critical is True
    assert "safety" in res.reason.lower() or "emergency" in res.reason.lower()


def test_priority_high_electrical_sparking():
    """Verify that sparking / short circuit hazards trigger High or Critical priority."""
    classification = classify_complaint(
        title="Switchboard sparking near student desks",
        description="Live wires are exposed and sparking on the wall.",
        location="Hostel Block B Room 204",
    )
    res = calculate_priority(
        title="Switchboard sparking near student desks",
        description="Live wires are exposed and sparking on the wall.",
        classification=classification,
        location="Hostel Block B Room 204",
    )
    assert res.priority in (PriorityLevel.CRITICAL, PriorityLevel.HIGH)
    assert res.priority_score >= 68
    assert res.requires_human_review is True


def test_priority_high_exam_disruption():
    """Verify that service disruption during exams elevates priority to High."""
    classification = classify_complaint(
        title="Wi-Fi network down during ongoing exam",
        description="Campus-wide internet outage affecting online semester exam in the exam hall right now.",
        location="Examination Center",
    )
    res = calculate_priority(
        title="Wi-Fi network down during ongoing exam",
        description="Campus-wide internet outage affecting online semester exam in the exam hall right now.",
        classification=classification,
        location="Examination Center",
    )
    assert res.priority in (PriorityLevel.CRITICAL, PriorityLevel.HIGH)
    assert res.priority_score >= 60
    assert res.requires_human_review is True


def test_priority_medium_routine_maintenance():
    """Verify that standard operational maintenance requests evaluate to Medium or Low."""
    classification = classify_complaint(
        title="Flickering tube light in Room 102",
        description="One of the tube lights in the corner is flickering occasionally.",
        location="Block B Room 102",
    )
    res = calculate_priority(
        title="Flickering tube light in Room 102",
        description="One of the tube lights in the corner is flickering occasionally.",
        classification=classification,
        location="Block B Room 102",
    )
    assert res.priority in (PriorityLevel.MEDIUM, PriorityLevel.LOW)
    assert res.is_safety_critical is False


def test_priority_low_minor_cosmetic_request():
    """Verify that minor suggestions and cosmetic requests get Low priority."""
    classification = classify_complaint(
        title="Minor suggestion for canteen paint touchup",
        description="A small paint touchup feedback for the cafeteria wall whenever possible, no rush.",
        location="Cafeteria",
    )
    res = calculate_priority(
        title="Minor suggestion for canteen paint touchup",
        description="A small paint touchup feedback for the cafeteria wall whenever possible, no rush.",
        classification=classification,
        location="Cafeteria",
    )
    assert res.priority == PriorityLevel.LOW
    assert res.priority_score < 40


def test_safety_floor_prevents_suppression():
    """Safety floor test: Short report with critical keyword cannot result in low priority."""
    classification = classify_complaint(
        title="Chemical spill",
        description="acid spill in lab",
        location="Lab",
    )
    res = calculate_priority(
        title="Chemical spill",
        description="acid spill in lab",
        classification=classification,
        location="Lab",
    )
    assert res.priority == PriorityLevel.CRITICAL
    assert res.priority_score >= 85
    assert res.requires_human_review is True


def test_benign_safety_phrase_false_positive_prevention():
    """Ensure routine fire drill notices do not trigger false emergency alarms."""
    classification = classify_complaint(
        title="Routine fire drill notice",
        description="Notice regarding annual fire drill schedule next week.",
        location="Admin Office",
    )
    res = calculate_priority(
        title="Routine fire drill notice",
        description="Notice regarding annual fire drill schedule next week.",
        classification=classification,
        location="Admin Office",
    )
    assert res.is_safety_critical is False
    assert res.priority != PriorityLevel.CRITICAL


def test_priority_score_boundaries():
    """Ensure priority scores are strictly bounded between 0 and 100."""
    classification = classify_complaint(title="test", description="test")
    res = calculate_priority(
        title="Huge massive critical emergency disaster fire campus-wide blackout during exam danger immediately right now",
        description="emergency urgent critical fire flames explosion gas leak entire campus",
        classification=classification,
        location="Chemistry Lab",
    )
    assert 0 <= res.priority_score <= 100
