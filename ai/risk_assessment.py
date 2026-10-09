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


def _is_negated(text: str, keyword: str) -> bool:
    """
    Check if a specific hazard keyword is explicitly negated in the text.
    (e.g., 'no fire', 'without smoke', 'no chemical leak', 'false alarm - no injuries').
    """
    negation_patterns = [
        rf"\b(?:no|not|without|zero|false alarm|no sign of|clear of|no active)\s+(?:\w+\s+){{0,2}}{re.escape(keyword)}\b",
        rf"\b{re.escape(keyword)}\s+(?:is not|was not|not present|has been cleared|ruled out)\b",
    ]
    for pat in negation_patterns:
        if re.search(pat, text):
            return True
    return False


def _has_separate_active_emergency(text: str) -> bool:
    """
    Check if text contains explicit cues of a real, active emergency even if 'fire drill' is mentioned.
    """
    active_hazard_cues = [
        "actual fire", "real fire", "real smoke", "actual smoke", "actual flames",
        "smoke pouring", "chemical reaction", "uncontrolled", "flames erupted",
        "erupted", "out of control", "injured", "casualty", "fainted", "unconscious",
        "screaming", "explosion", "acid spill", "real emergency", "active fire",
    ]
    for cue in active_hazard_cues:
        if cue in text:
            return True
    return False


def _evaluate_safety_threats(
    combined_text: str,
    tokens: Set[str],
) -> Tuple[bool, bool, List[str]]:
    """
    Evaluate immediate life-safety hazards, accounting for fine-grained negation and drill contexts.

    Returns:
        (is_critical_safety, is_high_safety, matched_safety_rules)
    """
    matched_rules: List[str] = []
    text_lower = combined_text.lower()

    # Check benign context (e.g. fire drill notice)
    is_benign_phrase_present = any(bp in text_lower for bp in BENIGN_SAFETY_CONTEXTS)
    has_active_emergency = _has_separate_active_emergency(text_lower)

    # If it's a routine fire drill notice with NO separate active emergency cues, suppress false alarm
    if is_benign_phrase_present and not has_active_emergency:
        return False, False, ["Safety keyword mentioned in routine/educational context (e.g. fire drill notice)"]

    is_crit = False
    is_high = False

    # 1. Critical safety threats
    for kw in CRITICAL_SAFETY_KEYWORDS:
        if _is_negated(text_lower, kw):
            continue

        if " " in kw:
            if kw in text_lower:
                is_crit = True
                matched_rules.append(f"Critical safety hazard detected: '{kw}'")
        else:
            if kw in tokens:
                # If keyword is 'fire' or 'smoke' and in drill phrase, only trigger if active emergency verified
                if kw in ["fire", "smoke", "flames"] and is_benign_phrase_present and not has_active_emergency:
                    continue
                is_crit = True
                matched_rules.append(f"Critical safety hazard detected: '{kw}'")

    # 2. Compound chemical/gas hazards
    chemical_terms = {"acid", "chemical", "chemicals", "reagent", "gas"}
    hazard_actions = {"spill", "leak", "burn", "explosion", "fumes", "reaction"}
    active_chem = {t for t in chemical_terms if t in tokens and not _is_negated(text_lower, t)}
    active_hazard = {t for t in hazard_actions if t in tokens and not _is_negated(text_lower, t)}

    if active_chem and active_hazard:
        is_crit = True
        matched_rules.append("Critical laboratory chemical/gas hazard detected")

    # 3. High safety threats
    for kw in HIGH_SAFETY_KEYWORDS:
        if _is_negated(text_lower, kw):
            continue

        if " " in kw:
            if kw in text_lower:
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
        if not _is_negated(text_lower, "stuck") and not _is_negated(text_lower, "trapped"):
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
        if pattern in combined_text and not _is_negated(combined_text, pattern):
            disruption_score += weight
            risk_factors.append(f"Disruption modifier '{pattern}': +{weight} pts")
    score_adjustments.append(disruption_score)

    # 4. Urgency Tone Modifiers
    urgency_score = 0
    for term, weight in URGENCY_MODIFIERS.items():
        if _is_negated(combined_text, term):
            continue
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
        if any(w in words for w in ["spreading", "expanding", "escalating", "out of control"]) and not _is_negated(combined_text, "spreading"):
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


calculate_priority = assess_risk
