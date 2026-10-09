"""Priority scoring and safety risk assessment engine."""

from __future__ import annotations

import re
from typing import List, Optional, Set, Tuple

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
    PriorityLevel,
    PriorityResult,
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
    Check for critical and high life-safety threats.

    Returns:
        (is_critical_safety, is_high_safety, matched_safety_rules)
    """
    matched_rules: List[str] = []
    is_benign = _check_benign_context(combined_text)

    is_crit = False
    is_high = False

    if is_benign:
        return False, False, ["Safety keyword mentioned in routine/educational context (e.g. fire drill)"]

    # 1. Critical safety threats (direct keyword/phrase matches)
    for kw in CRITICAL_SAFETY_KEYWORDS:
        if " " in kw:
            if kw in combined_text:
                is_crit = True
                matched_rules.append(f"Critical safety hazard detected: '{kw}'")
        else:
            if kw in tokens:
                is_crit = True
                matched_rules.append(f"Critical safety hazard detected: '{kw}'")

    # 2. Compound critical safety hazards (e.g., acid + spill, chemical + burn)
    chemical_terms = {"acid", "chemical", "chemicals", "reagent", "gas"}
    hazard_actions = {"spill", "leak", "burn", "explosion", "fumes"}
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

    # 4. Compound elevator / entrapment risks
    elevator_terms = {"elevator", "lift"}
    entrapment_terms = {"stuck", "trapped", "unresponsive", "broken"}
    if (elevator_terms & tokens) and (entrapment_terms & tokens):
        is_high = True
        matched_rules.append("High-risk infrastructure entrapment/failure detected (elevator issue)")

    return is_crit, is_high, matched_rules


def calculate_priority(
    title: str,
    description: str,
    classification: ClassificationResult,
    location: Optional[str] = None,
) -> PriorityResult:
    """
    Calculate incident priority level and numeric urgency score (0-100).

    Args:
        title: Complaint title.
        description: Complaint description.
        classification: Output from classification engine.
        location: Optional location string.

    Returns:
        PriorityResult containing priority tier, numeric score, human review flag, and reasons.
    """
    title_clean = (title or "").lower()
    desc_clean = (description or "").lower()
    loc_clean = (location or "").lower()

    combined_text = f"{title_clean} {desc_clean} {loc_clean}".strip()
    words = set(re.findall(r"\b\w+\b", combined_text))

    triggered_rules: List[str] = []
    score_adjustments: List[int] = []

    # 1. Base score from category
    base_score = CATEGORY_BASE_SCORES.get(classification.category, 30)
    score_adjustments.append(base_score)
    triggered_rules.append(f"Base priority for '{classification.category.value}': {base_score} pts")

    # 2. Safety Threat Assessment (Safety Floor)
    is_crit_safety, is_high_safety, safety_matches = _evaluate_safety_threats(
        combined_text, words
    )
    triggered_rules.extend(safety_matches)

    # 3. Disruption Modifiers
    disruption_score = 0
    for pattern, weight in DISRUPTION_KEYWORDS.items():
        if pattern in combined_text:
            disruption_score += weight
            triggered_rules.append(f"Service disruption trigger '{pattern}': +{weight} pts")
    score_adjustments.append(disruption_score)

    # 4. Urgency Tone Modifiers
    urgency_score = 0
    for term, weight in URGENCY_MODIFIERS.items():
        if " " in term:
            if term in combined_text:
                urgency_score += weight
                triggered_rules.append(f"Urgency indicator '{term}': +{weight} pts")
        else:
            if term in words:
                urgency_score += weight
                triggered_rules.append(f"Urgency indicator '{term}': +{weight} pts")

    # 5. Low-urgency Modifiers
    low_urgency_score = 0
    for term, weight in LOW_URGENCY_MODIFIERS.items():
        if " " in term:
            if term in combined_text:
                low_urgency_score += weight
                triggered_rules.append(f"Low-urgency modifier '{term}': {weight} pts")
        else:
            if term in words:
                low_urgency_score += weight
                triggered_rules.append(f"Low-urgency modifier '{term}': {weight} pts")

    score_adjustments.append(urgency_score + low_urgency_score)

    # 6. Critical Location Multipliers
    location_score = 0
    for crit_loc, weight in CRITICAL_LOCATIONS.items():
        if crit_loc in combined_text:
            location_score += weight
            triggered_rules.append(f"High-risk campus location '{crit_loc}': +{weight} pts")
            break
    score_adjustments.append(location_score)

    # Calculate raw score
    raw_score = sum(score_adjustments)

    # Apply Safety Floor (Never allow low scores on serious safety reports)
    if is_crit_safety:
        raw_score = max(raw_score, 88)
        triggered_rules.append("Safety Floor applied: Guaranteed score >= 88 for critical life-safety hazard")
    elif is_high_safety:
        raw_score = max(raw_score, 68)
        triggered_rules.append("Safety Floor applied: Guaranteed score >= 68 for high safety risk")

    # Clamp score between 0 and 100
    final_score = max(0, min(100, raw_score))

    # Map score to Priority Level
    if final_score >= SCORE_THRESHOLDS[PriorityLevel.CRITICAL]:
        priority = PriorityLevel.CRITICAL
    elif final_score >= SCORE_THRESHOLDS[PriorityLevel.HIGH]:
        priority = PriorityLevel.HIGH
    elif final_score >= SCORE_THRESHOLDS[PriorityLevel.MEDIUM]:
        priority = PriorityLevel.MEDIUM
    else:
        priority = PriorityLevel.LOW

    # Determine if human review is required
    requires_human_review = False
    if is_crit_safety or is_high_safety:
        requires_human_review = True
    elif priority in (PriorityLevel.CRITICAL, PriorityLevel.HIGH):
        requires_human_review = True
    elif classification.is_ambiguous or classification.category == ComplaintCategory.GENERAL_UNKNOWN:
        requires_human_review = True
    elif classification.confidence < 0.50:
        requires_human_review = True

    # Build primary reason summary
    if is_crit_safety:
        reason = "Immediate safety threat detected requiring emergency human intervention"
    elif is_high_safety:
        reason = "High-risk safety hazard detected requiring staff inspection"
    elif disruption_score > 0:
        reason = "Substantial service disruption indicators detected"
    elif urgency_score > 0:
        reason = "Time-sensitive urgency indicators detected"
    elif priority == PriorityLevel.HIGH:
        reason = "High priority operational requirement"
    elif priority == PriorityLevel.MEDIUM:
        reason = "Standard service request for scheduled department queue"
    else:
        reason = "Routine request with no immediate operational or safety impact"

    explanation = (
        f"Priority evaluated as {priority.value} (Score: {final_score}/100). "
        f"{reason}. Triggered rules: {'; '.join(triggered_rules[:4])}."
    )

    return PriorityResult(
        priority=priority,
        priority_score=final_score,
        reason=reason,
        requires_human_review=requires_human_review,
        is_safety_critical=is_crit_safety,
        triggered_rules=triggered_rules,
        explanation=explanation,
    )
