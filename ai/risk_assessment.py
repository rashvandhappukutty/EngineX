"""Adaptive risk and priority assessment layer evaluating multi-dimensional impact and uncertainty."""

from __future__ import annotations

import re
from typing import List, Optional, Set, Tuple

from ai.config import DEFAULT_CONFIG, RiskScoringConfig
from ai.rules import (
    BENIGN_SAFETY_CONTEXTS,
    CATEGORY_BASE_SCORES,
    CRITICAL_LOCATIONS,
    CRITICAL_SAFETY_KEYWORDS,
    DISRUPTION_KEYWORDS,
    HIGH_SAFETY_KEYWORDS,
    LOW_URGENCY_MODIFIERS,
    SCORE_THRESHOLDS,
    URGENCY_MODIFIERS,
)
from ai.schemas import (
    ClassificationResult,
    ComplaintCategory,
    NLUStructuredExtraction,
    PriorityLevel,
    RiskAssessmentResult,
    UncertaintyLevel,
)


def _check_benign_context(text: str) -> bool:
    """Check if safety keywords appear purely within routine or educational context."""
    text_lower = text.lower()
    for benign_phrase in BENIGN_SAFETY_CONTEXTS:
        if benign_phrase in text_lower:
            return True
    return False


def _evaluate_safety_threats(
    combined_text: str,
    tokens: Set[str],
) -> Tuple[bool, bool, List[str]]:
    """
    Evaluate immediate life-safety hazards and compound emergencies.
    """
    matched_rules: List[str] = []
    is_benign = _check_benign_context(combined_text)

    if is_benign:
        return False, False, ["Safety keyword mentioned in routine/educational context (e.g. fire drill)"]

    is_crit = False
    is_high = False

    # 1. Critical safety threats
    for kw in CRITICAL_SAFETY_KEYWORDS:
        if " " in kw:
            if kw in combined_text:
                is_crit = True
                matched_rules.append(f"Critical safety hazard detected: '{kw}'")
        else:
            if kw in tokens:
                is_crit = True
                matched_rules.append(f"Critical safety hazard detected: '{kw}'")

    # 2. Compound chemical/gas hazards
    chemical_terms = {"acid", "chemical", "chemicals", "reagent", "gas"}
    hazard_actions = {"spill", "leak", "burn", "explosion", "fumes", "reaction"}
    if (chemical_terms & tokens) and (hazard_actions & tokens):
        is_crit = True
        matched_rules.append("Critical laboratory chemical/gas hazard detected")

    # 3. High safety threats
    for kw in HIGH_SAFETY_KEYWORDS:
        if " " in kw:
            if kw in combined_text:
                is_high = True
                matched_rules.append(f"High-risk safety indicator detected: '{kw}'")
        else:
            if kw in tokens:
                is_high = True
                matched_rules.append(f"High-risk safety indicator detected: '{kw}'")

    # 4. Elevator / entrapment
    elevator_terms = {"elevator", "lift"}
    entrapment_terms = {"stuck", "trapped", "unresponsive", "broken"}
    if (elevator_terms & tokens) and (entrapment_terms & tokens):
        is_high = True
        matched_rules.append("High-risk infrastructure entrapment/failure detected (elevator issue)")

    return is_crit, is_high, matched_rules


def assess_risk(
    title: str,
    description: str,
    classification: ClassificationResult,
    location: Optional[str] = None,
    nlu_extraction: Optional[NLUStructuredExtraction] = None,
    config: Optional[RiskScoringConfig] = None,
) -> RiskAssessmentResult:
    """
    Perform a comprehensive multi-dimensional risk and urgency assessment.

    Evaluates potential harm, immediacy of danger, affected population, infrastructure
    disruption, report certainty, and missing critical details.

    Args:
        title: Complaint title.
        description: Complaint description.
        classification: Output from classification layer.
        location: Optional location string.
        nlu_extraction: Optional structured extraction from NLU layer.
        config: Optional risk scoring configuration.

    Returns:
        RiskAssessmentResult with priority level, numerical score (0-100), risk factors,
        uncertainty rating, and explainability summary.
    """
    cfg = config or DEFAULT_CONFIG.risk
    title_clean = (title or "").lower()
    desc_clean = (description or "").lower()
    loc_clean = (location or "").lower()

    combined_text = f"{title_clean} {desc_clean} {loc_clean}".strip()
    words = set(re.findall(r"\b\w+\b", combined_text))

    risk_factors: List[str] = []
    score_adjustments: List[int] = []

    # 1. Base score by category
    base_score = CATEGORY_BASE_SCORES.get(classification.category, 30)
    score_adjustments.append(base_score)
    risk_factors.append(f"Base operational category ({classification.category.value}): {base_score} pts")

    # 2. Safety Threat Assessment (Safety Floor)
    is_crit_safety, is_high_safety, safety_matches = _evaluate_safety_threats(
        combined_text, words
    )
    risk_factors.extend(safety_matches)

    # 3. Disruption Modifiers
    disruption_score = 0
    for pattern, weight in DISRUPTION_KEYWORDS.items():
        if pattern in combined_text:
            disruption_score += weight
            risk_factors.append(f"Disruption modifier '{pattern}': +{weight} pts")
    score_adjustments.append(disruption_score)

    # 4. Urgency Tone Modifiers
    urgency_score = 0
    for term, weight in URGENCY_MODIFIERS.items():
        if " " in term:
            if term in combined_text:
                urgency_score += weight
                risk_factors.append(f"Urgency cue '{term}': +{weight} pts")
        else:
            if term in words:
                urgency_score += weight
                risk_factors.append(f"Urgency cue '{term}': +{weight} pts")

    # 5. Low-urgency Modifiers
    low_urgency_score = 0
    for term, weight in LOW_URGENCY_MODIFIERS.items():
        if " " in term:
            if term in combined_text:
                low_urgency_score += weight
                risk_factors.append(f"Low-urgency modifier '{term}': {weight} pts")
        else:
            if term in words:
                low_urgency_score += weight
                risk_factors.append(f"Low-urgency modifier '{term}': {weight} pts")

    score_adjustments.append(urgency_score + low_urgency_score)

    # 6. Critical Location Multipliers
    location_score = 0
    for crit_loc, weight in CRITICAL_LOCATIONS.items():
        if crit_loc in combined_text:
            location_score += weight
            risk_factors.append(f"High-occupancy / high-risk zone '{crit_loc}': +{weight} pts")
            break
    score_adjustments.append(location_score)

    # 7. Population & Spreading Dynamics (from NLU if available)
    if nlu_extraction:
        if nlu_extraction.estimated_affected_count and nlu_extraction.estimated_affected_count > 50:
            score_adjustments.append(15)
            risk_factors.append(f"High population impact (~{nlu_extraction.estimated_affected_count} people affected): +15 pts")
        if any(w in words for w in ["spreading", "expanding", "escalating", "out of control"]):
            score_adjustments.append(20)
            risk_factors.append("Active incident escalation / spread detected: +20 pts")

    # Compute raw score
    raw_score = sum(score_adjustments)

    # Safety Floor enforcement
    if is_crit_safety:
        raw_score = max(raw_score, cfg.safety_floor_critical)
        risk_factors.append(f"Safety Floor enforced: Score guaranteed >= {cfg.safety_floor_critical} for life-safety hazard")
    elif is_high_safety:
        raw_score = max(raw_score, cfg.safety_floor_high)
        risk_factors.append(f"Safety Floor enforced: Score guaranteed >= {cfg.safety_floor_high} for high-risk hazard")

    # Clamp score 0 to 100
    final_score = max(0, min(100, raw_score))

    # Determine Priority Level
    if final_score >= SCORE_THRESHOLDS[PriorityLevel.CRITICAL]:
        priority = PriorityLevel.CRITICAL
    elif final_score >= SCORE_THRESHOLDS[PriorityLevel.HIGH]:
        priority = PriorityLevel.HIGH
    elif final_score >= SCORE_THRESHOLDS[PriorityLevel.MEDIUM]:
        priority = PriorityLevel.MEDIUM
    else:
        priority = PriorityLevel.LOW

    # Missing Information Analysis
    missing_info: List[str] = []
    if not location and not (nlu_extraction and nlu_extraction.identified_locations):
        missing_info.append("Precise campus location / room number")
    if not (nlu_extraction and nlu_extraction.estimated_affected_count) and final_score >= 60:
        missing_info.append("Verified count of individuals in immediate vicinity")
    if is_crit_safety:
        missing_info.append("Current hazard containment status and presence of casualties")

    # Uncertainty Analysis
    uncertainty_level = UncertaintyLevel.LOW
    if classification.confidence < 0.45 or classification.is_ambiguous or classification.is_unfamiliar:
        uncertainty_level = UncertaintyLevel.HIGH
    elif classification.confidence < 0.70 or len(missing_info) >= 2:
        uncertainty_level = UncertaintyLevel.MEDIUM

    # Determine Human Review Requirement
    # Uncertainty NEVER reduces priority for potential emergencies; it increases need for human review!
    requires_human_review = False
    if is_crit_safety or is_high_safety:
        requires_human_review = True
    elif priority in (PriorityLevel.CRITICAL, PriorityLevel.HIGH):
        requires_human_review = True
    elif uncertainty_level in (UncertaintyLevel.HIGH, UncertaintyLevel.MEDIUM):
        requires_human_review = True
    elif classification.category in (ComplaintCategory.GENERAL_UNKNOWN, ComplaintCategory.NEEDS_ASSESSMENT, ComplaintCategory.OTHER):
        requires_human_review = True

    # Qualitative harm & immediacy indicators
    if is_crit_safety:
        potential_harm = "Severe / Life Threatening"
        immediacy = "Immediate"
        reason = "Immediate safety threat detected requiring emergency human intervention"
    elif is_high_safety or priority == PriorityLevel.HIGH:
        potential_harm = "Moderate to Severe"
        immediacy = "Impending"
        reason = "High-risk safety or operational hazard requiring expedited staff assessment"
    elif priority == PriorityLevel.MEDIUM:
        potential_harm = "Minor / Operational"
        immediacy = "Delayed"
        reason = "Standard service request for scheduled department queue"
    else:
        potential_harm = "Negligible"
        immediacy = "Routine"
        reason = "Routine request with no immediate operational or safety risk"

    reasoning_summary = (
        f"Priority evaluated as {priority.value} (Risk Score: {final_score}/100, Uncertainty: {uncertainty_level.value}). "
        f"{reason}. Factors: {'; '.join(risk_factors[:4])}."
    )

    return RiskAssessmentResult(
        priority=priority,
        risk_score=final_score,
        risk_factors=risk_factors,
        reasoning_summary=reasoning_summary,
        uncertainty_level=uncertainty_level,
        requires_human_review=requires_human_review,
        missing_information=missing_info,
        is_safety_critical=is_crit_safety,
        potential_harm_level=potential_harm,
        immediacy_of_danger=immediacy,
    )


# Alias for backwards compatibility
calculate_priority = assess_risk
