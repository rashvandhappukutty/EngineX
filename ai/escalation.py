"""Escalation logic and human review recommendation engine."""

from __future__ import annotations

from ai.schemas import (
    ClassificationResult,
    EscalationInfo,
    EscalationLevel,
    PriorityLevel,
    PriorityResult,
)


def evaluate_escalation(
    classification: ClassificationResult,
    priority: PriorityResult,
) -> EscalationInfo:
    """
    Determine escalation tier and human review protocol for a complaint.

    Note on Safety / Simulated Workflows:
        This engine NEVER claims to automatically dispatch emergency responders or
        trigger real-world external services. All escalation paths advise immediate
        action for authorized campus personnel to review and execute in accordance
        with institutional standard operating procedures.

    Args:
        classification: Output from classification engine.
        priority: Output from priority engine.

    Returns:
        EscalationInfo with escalation flag, escalation level, reason, and recommended action.
    """
    # Case 1: Critical Priority or Life-Safety Threat
    if priority.priority == PriorityLevel.CRITICAL or priority.is_safety_critical:
        return EscalationInfo(
            escalate=True,
            level=EscalationLevel.EMERGENCY_REVIEW,
            reason="Critical incident or life-safety hazard flagged for immediate staff attention",
            recommended_action=(
                f"Notify {classification.assigned_department} and Campus Security Duty Officer immediately "
                "(Simulated Workflow: Requires authorized human verification and physical dispatch)."
            ),
        )

    # Case 2: High Priority / Major Disruption
    if priority.priority == PriorityLevel.HIGH:
        return EscalationInfo(
            escalate=True,
            level=EscalationLevel.URGENT_REVIEW,
            reason="High-priority issue requires expedited staff assessment",
            recommended_action=(
                f"Route to {classification.assigned_department} priority queue. "
                "Staff assessment recommended within 1 to 2 hours."
            ),
        )

    # Case 3: Ambiguous or Low Confidence Classification
    if classification.is_ambiguous or classification.confidence < 0.45:
        return EscalationInfo(
            escalate=False,
            level=EscalationLevel.STANDARD_REVIEW,
            reason="Classification certainty is below threshold; manual triage required",
            recommended_action=(
                "Queue in Helpdesk Triage for human verification of assigned department and scope."
            ),
        )

    # Case 4: Medium Priority
    if priority.priority == PriorityLevel.MEDIUM:
        return EscalationInfo(
            escalate=False,
            level=EscalationLevel.STANDARD_REVIEW,
            reason="Standard priority incident within normal operational capacity",
            recommended_action=(
                f"Dispatch ticket to {classification.assigned_department} standard queue according to standard SLA."
            ),
        )

    # Case 5: Low Priority
    return EscalationInfo(
        escalate=False,
        level=EscalationLevel.NO_ESCALATION,
        reason="Routine or low-impact inquiry with no immediate operational risk",
        recommended_action=(
            f"Log ticket in {classification.assigned_department} backlog for scheduled maintenance."
        ),
    )
