"""Decision support layer generating structured response plans and escalation protocols."""

from __future__ import annotations

from typing import List, Optional

from ai.schemas import (
    ClassificationResult,
    ComplaintCategory,
    DecisionSupportPlan,
    EscalationInfo,
    EscalationLevel,
    NLUStructuredExtraction,
    PriorityLevel,
    RecommendedAction,
    RiskAssessmentResult,
)


def recommend_response(
    classification: ClassificationResult,
    risk_assessment: RiskAssessmentResult,
    location: Optional[str] = None,
    nlu_extraction: Optional[NLUStructuredExtraction] = None,
) -> DecisionSupportPlan:
    """
    Generate a context-aware decision support plan and recommended action sequence.

    Args:
        classification: Classification result.
        risk_assessment: Risk and priority evaluation.
        location: Optional location.
        nlu_extraction: Optional NLU extractions.

    Returns:
        DecisionSupportPlan with structured immediate next steps, escalation rules,
        required capabilities, and contingency alternatives.
    """
    dept = classification.assigned_department
    cat = classification.category
    priority = risk_assessment.priority

    actions: List[RecommendedAction] = []
    capabilities: List[str] = []
    info_needed: List[str] = list(risk_assessment.missing_information)

    # 1. Critical Emergency Scenario
    if priority == PriorityLevel.CRITICAL or risk_assessment.is_safety_critical:
        capabilities.extend(["Emergency Triage", "First Aid / CPR", "Hazard Containment", "Campus Incident Command"])
        actions.append(
            RecommendedAction(
                step=1,
                action=f"Alert {dept} Lead and Campus Security Duty Officer to initiate immediate on-site safety verification.",
                target_role_or_team="Duty Officer / Security Lead",
                prerequisites=["Verify physical location coordinates", "Confirm personnel on duty"],
                required_capabilities=["Rapid Response", "Radio Communication"],
                escalation_triggers=["Report of spreading hazard", "Casualties or entrapment reported", "No responder check-in within 5 minutes"],
                safe_alternatives=["Engage backup Security patrol team in adjacent sector if primary team is unavailable"],
                rationale="Life-safety hazards require immediate human-authorized verification and on-scene containment.",
            )
        )
        actions.append(
            RecommendedAction(
                step=2,
                action="Secure the perimeter around the affected area and restrict student/faculty entry.",
                target_role_or_team="Campus Security Patrol",
                prerequisites=["On-site arrival"],
                required_capabilities=["Perimeter Control", "Crowd Management"],
                escalation_triggers=["Hostile crowd", "Spill/Fire expanding beyond room perimeter"],
                safe_alternatives=["Cordon off hallway and post warning signs if physical barriers are delayed"],
                rationale="Prevents bystander injuries and preserves safe ingress for designated responders.",
            )
        )
        escalation_info = EscalationInfo(
            escalate=True,
            level=EscalationLevel.EMERGENCY_REVIEW,
            reason="Critical incident or life-safety hazard flagged for immediate staff attention",
            recommended_action=(
                f"Notify {dept} and Campus Security Duty Officer immediately "
                "(Simulated Workflow: Requires authorized human verification and physical dispatch)."
            ),
        )

    # 2. High Priority Operational / Safety Scenario
    elif priority == PriorityLevel.HIGH:
        capabilities.extend(["Diagnostic Assessment", "Rapid Repair", "Departmental Dispatch"])
        actions.append(
            RecommendedAction(
                step=1,
                action=f"Dispatch senior technician or supervisor from {dept} to assess and isolate the fault.",
                target_role_or_team=f"{dept} Rapid Response",
                prerequisites=["Assign available technician with relevant domain skill"],
                required_capabilities=["Domain Diagnostics", "System Isolation"],
                escalation_triggers=["Safety hazard escalates to critical", "Outage spreads to adjacent campus zones", "No technician assigned within 30 minutes"],
                safe_alternatives=["Reroute traffic or supply through redundant lines where available"],
                rationale="High-priority disruptions require expedited diagnostics to minimize operational loss.",
            )
        )
        actions.append(
            RecommendedAction(
                step=2,
                action="Notify affected stakeholders and post status bulletin on Campus Helpdesk Portal.",
                target_role_or_team="Helpdesk Communications",
                prerequisites=["Initial fault diagnosis confirmed"],
                required_capabilities=["Stakeholder Communication"],
                escalation_triggers=["Estimated resolution exceeds 4 hours"],
                safe_alternatives=["Broadcast SMS/email notice to department heads if portal is impacted"],
                rationale="Provides transparency and reduces duplicate incoming complaint volume.",
            )
        )
        escalation_info = EscalationInfo(
            escalate=True,
            level=EscalationLevel.URGENT_REVIEW,
            reason="High-priority issue requires expedited staff assessment",
            recommended_action=(
                f"Route to {dept} priority queue. Staff assessment recommended within 1 to 2 hours."
            ),
        )

    # 3. Medium Priority Standard Request
    elif priority == PriorityLevel.MEDIUM:
        capabilities.extend(["Standard Maintenance / Support", "Ticket Resolution"])
        actions.append(
            RecommendedAction(
                step=1,
                action=f"Assign work order to {dept} standard queue and schedule field inspection.",
                target_role_or_team=dept,
                prerequisites=["Ticket categorization validated"],
                required_capabilities=["Standard Field Maintenance"],
                escalation_triggers=["Ticket remains unassigned past SLA window (24h)"],
                safe_alternatives=["Reprioritize during morning dispatch review if queue is backlogged"],
                rationale="Standard operational maintenance processed in scheduled queue.",
            )
        )
        escalation_info = EscalationInfo(
            escalate=False,
            level=EscalationLevel.STANDARD_REVIEW,
            reason="Standard priority incident within normal operational capacity",
            recommended_action=f"Dispatch ticket to {dept} standard queue according to standard SLA.",
        )

    # 4. Low Priority Routine Request
    else:
        capabilities.extend(["Routine Logging", "Scheduled Backlog"])
        actions.append(
            RecommendedAction(
                step=1,
                action=f"Log ticket in {dept} scheduled backlog for routine resolution.",
                target_role_or_team=dept,
                prerequisites=["Record intake details"],
                required_capabilities=["Routine Triage"],
                escalation_triggers=["Repeated reports submitted for same location"],
                safe_alternatives=["Batch with nearby scheduled maintenance activities"],
                rationale="Low-impact inquiry or cosmetic feedback with no immediate operational risk.",
            )
        )
        escalation_info = EscalationInfo(
            escalate=False,
            level=EscalationLevel.NO_ESCALATION,
            reason="Routine or low-impact inquiry with no immediate operational risk",
            recommended_action=f"Log ticket in {dept} backlog for scheduled maintenance.",
        )

    # If classification is ambiguous or unfamiliar, append triage action
    if classification.is_ambiguous or classification.is_unfamiliar:
        actions.insert(
            0,
            RecommendedAction(
                step=0,
                action="Perform manual intake review to verify scope, category, and department ownership.",
                target_role_or_team="Helpdesk General Triage",
                prerequisites=["Review student report text"],
                required_capabilities=["Multi-domain Intake Assessment"],
                escalation_triggers=["On-site inspection reveals undetected safety hazard"],
                safe_alternatives=["Contact reporting user for clarification"],
                rationale="Report exhibits domain ambiguity or unfamiliar scope requiring human verification.",
            )
        )

    return DecisionSupportPlan(
        responsible_department=dept,
        immediate_next_steps=actions,
        escalation=escalation_info,
        required_capabilities=capabilities,
        information_needed=info_needed,
        policy_reference="Campus Emergency & Helpdesk Standard Operating Procedures",
    )
