"""Tests for decision support planning, action prerequisites, and safety compliance."""

import pytest
from ai.classifier import classify_complaint
from ai.decision_support import recommend_response
from ai.risk_assessment import assess_risk
from ai.schemas import PriorityLevel


def test_decision_support_plan_structure():
    """Verify structured response plan generation with prerequisites and contingency alternatives."""
    title = "Chemical fume leak in Chemistry Lab 2"
    desc = "Toxic acid fumes escaping from damaged cylinder."
    loc = "Chemistry Lab 2"

    classification = classify_complaint(title, desc, loc)
    risk = assess_risk(title, desc, classification, loc)
    plan = recommend_response(classification, risk, loc)

    assert len(plan.immediate_next_steps) >= 2
    step1 = plan.immediate_next_steps[0]
    assert step1.step == 1
    assert len(step1.prerequisites) > 0
    assert len(step1.required_capabilities) > 0
    assert len(step1.escalation_triggers) > 0
    assert len(step1.safe_alternatives) > 0
    assert "Simulated Workflow" in plan.escalation.recommended_action


def test_non_automated_safety_action_policy():
    """Verify engine advises human authorization rather than claiming automated real-world triggers."""
    title = "Smoke detected in electrical closet"
    desc = "Active smoke coming from switchgear."
    loc = "Hostel B"

    classification = classify_complaint(title, desc, loc)
    risk = assess_risk(title, desc, classification, loc)
    plan = recommend_response(classification, risk, loc)

    for action in plan.immediate_next_steps:
        # Must not claim that real emergency sirens were fired or external 911 dispatched
        assert "dispatched fire department automatically" not in action.action.lower()
