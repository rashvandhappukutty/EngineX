"""Tests for escalation engine and workflow recommendations."""

import pytest
from ai.classifier import classify_complaint
from ai.escalation import evaluate_escalation
from ai.priority import calculate_priority
from ai.schemas import EscalationLevel, PriorityLevel


def test_escalation_critical_emergency():
    """Verify that critical safety incidents escalate with Emergency review level."""
    classification = classify_complaint(
        title="Active gas leak in cafeteria",
        description="Strong smell of LPG gas leaking near kitchen stoves.",
        location="Campus Cafeteria",
    )
    priority = calculate_priority(
        title="Active gas leak in cafeteria",
        description="Strong smell of LPG gas leaking near kitchen stoves.",
        classification=classification,
        location="Campus Cafeteria",
    )
    escalation = evaluate_escalation(classification, priority)

    assert escalation.escalate is True
    assert escalation.level == EscalationLevel.EMERGENCY_REVIEW
    assert "Simulated Workflow" in escalation.recommended_action
    assert "authorized human" in escalation.recommended_action.lower() or "verification" in escalation.recommended_action.lower()


def test_escalation_high_priority_urgent_review():
    """Verify that high-priority operational issues escalate with Urgent review level."""
    classification = classify_complaint(
        title="Elevator stuck between 3rd and 4th floor",
        description="Main library elevator is unresponsive with students calling for assistance.",
        location="Central Library",
    )
    priority = calculate_priority(
        title="Elevator stuck between 3rd and 4th floor",
        description="Main library elevator is unresponsive with students calling for assistance.",
        classification=classification,
        location="Central Library",
    )
    escalation = evaluate_escalation(classification, priority)

    assert escalation.escalate is True
    assert escalation.level == EscalationLevel.URGENT_REVIEW
    assert "1 to 2 hours" in escalation.recommended_action


def test_escalation_medium_priority_standard_review():
    """Verify that medium priority issues do not escalate and route to standard review."""
    classification = classify_complaint(
        title="Classroom projector HDMI cable damaged",
        description="The HDMI cable connected to the projector is torn.",
        location="Room 205",
    )
    priority = calculate_priority(
        title="Classroom projector HDMI cable damaged",
        description="The HDMI cable connected to the projector is torn.",
        classification=classification,
        location="Room 205",
    )
    escalation = evaluate_escalation(classification, priority)

    assert escalation.escalate is False
    assert escalation.level == EscalationLevel.STANDARD_REVIEW


def test_escalation_low_priority_no_escalation():
    """Verify that low priority issues have No escalation level."""
    classification = classify_complaint(
        title="Request for additional trash can outside garden",
        description="Minor feedback to install a dustbin near the walkway bench.",
        location="Garden walkway",
    )
    priority = calculate_priority(
        title="Request for additional trash can outside garden",
        description="Minor feedback to install a dustbin near the walkway bench.",
        classification=classification,
        location="Garden walkway",
    )
    escalation = evaluate_escalation(classification, priority)

    assert escalation.escalate is False
    assert escalation.level == EscalationLevel.NO_ESCALATION


def test_escalation_no_automatic_external_dispatch_claim():
    """Verify system explicitly states human verification and never claims real 911 dispatch."""
    classification = classify_complaint(
        title="Fire alarm ringing",
        description="Fire alarm active on 4th floor.",
        location="Hostel 1",
    )
    priority = calculate_priority(
        title="Fire alarm ringing",
        description="Fire alarm active on 4th floor.",
        classification=classification,
        location="Hostel 1",
    )
    escalation = evaluate_escalation(classification, priority)

    # Should not claim that external fire brigade was auto-dispatched
    assert "dispatched responders in the real world" not in escalation.recommended_action.lower()
    assert "Simulated Workflow" in escalation.recommended_action
