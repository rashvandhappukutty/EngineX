"""Adaptive situation classification layer supporting multi-category and unfamiliar incidents."""

from __future__ import annotations

import difflib
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from ai.rules import CATEGORY_KEYWORDS
from ai.schemas import (
    DEPARTMENT_MAPPING,
    ClassificationResult,
    ComplaintCategory,
    NLUStructuredExtraction,
)


def _normalize_text(text: Optional[str]) -> str:
    """Normalize input text by lowercasing and standardizing whitespace and punctuation."""
    if not text:
        return ""
    cleaned = text.lower()
    cleaned = re.sub(r"[\-/]", " ", cleaned)
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _extract_tokens(normalized_text: str) -> List[str]:
    """Extract individual words/tokens from normalized text."""
    return [t for t in normalized_text.split() if len(t) > 1]


def _match_keywords(
    normalized_text: str,
    tokens: List[str],
    keyword_dict: Dict[str, float],
) -> Tuple[float, List[str]]:
    """
    Match category keywords against normalized text and token list.
    Prioritizes exact phrase and exact token matches before cautious fuzzy matching.
    """
    score = 0.0
    matched: Set[str] = set()
    exact_matched_tokens: Set[str] = set()

    # 1. Exact phrase matching
    for kw, weight in keyword_dict.items():
        if " " in kw:
            if kw in normalized_text:
                score += weight
                matched.add(kw)
                for part in kw.split():
                    exact_matched_tokens.add(part)

    # 2. Exact token matching
    for kw, weight in keyword_dict.items():
        if " " not in kw:
            if kw in tokens:
                score += weight
                matched.add(kw)
                exact_matched_tokens.add(kw)

    # 3. Cautious fuzzy matching for spelling variations
    for kw, weight in keyword_dict.items():
        if " " not in kw and kw not in matched and len(kw) >= 5:
            unmatched_tokens = [
                t for t in tokens
                if t not in exact_matched_tokens and abs(len(t) - len(kw)) <= 1 and len(t) >= 4
            ]
            if unmatched_tokens:
                close_tokens = difflib.get_close_matches(kw, unmatched_tokens, n=1, cutoff=0.85)
                if close_tokens:
                    matched_token = close_tokens[0]
                    score += weight * 0.85
                    matched.add(f"{kw} (via '{matched_token}')")
                    exact_matched_tokens.add(matched_token)

    return score, sorted(list(matched))


def classify_complaint(
    title: str,
    description: str,
    location: Optional[str] = None,
    nlu_extraction: Optional[NLUStructuredExtraction] = None,
) -> ClassificationResult:
    """
    Classify a college incident report with support for multi-category and unfamiliar events.

    Args:
        title: Short title of the incident.
        description: Detailed narrative.
        location: Optional location string.
        nlu_extraction: Optional structured output from NLU layer.

    Returns:
        ClassificationResult with primary category, all detected categories, confidence, and explanation.
    """
    title_norm = _normalize_text(title)
    desc_norm = _normalize_text(description)
    loc_norm = _normalize_text(location)

    combined_text = f"{title_norm} {title_norm} {desc_norm} {loc_norm}".strip()
    tokens = _extract_tokens(combined_text)

    # Empty text handling
    if not combined_text or not tokens:
        return ClassificationResult(
            category=ComplaintCategory.GENERAL_UNKNOWN,
            assigned_department=DEPARTMENT_MAPPING[ComplaintCategory.GENERAL_UNKNOWN],
            confidence=0.0,
            matched_keywords=[],
            secondary_categories=[],
            all_categories=[ComplaintCategory.GENERAL_UNKNOWN.value],
            is_ambiguous=False,
            is_unfamiliar=False,
            explanation=f"Insufficient or empty report text provided. Assigned to {DEPARTMENT_MAPPING[ComplaintCategory.GENERAL_UNKNOWN]}.",
        )

    # Check for environmental / crisis / novel situations that don't fit fixed categories
    unfamiliar_signals = {
        "flood": "Campus Environmental Incident / Flooding",
        "flooding": "Campus Environmental Incident / Flooding",
        "floods": "Campus Environmental Incident / Flooding",
        "heavy rain": "Severe Weather Disruption",
        "storm": "Severe Weather Disruption",
        "earthquake": "Natural Disaster / Tremor",
        "tremor": "Natural Disaster / Tremor",
        "drone": "Airspace / Novel Security Incident",
        "wildlife": "Wildlife / Animal Control Incident",
        "snake": "Wildlife / Animal Control Incident",
        "suspicious package": "Hazardous Material / Unknown Object Investigation",
    }
    detected_unfamiliar = [
        desc for kw, desc in unfamiliar_signals.items() if kw in combined_text
    ]

    # Match against standard domain categories
    category_scores: Dict[ComplaintCategory, float] = {}
    category_matches: Dict[ComplaintCategory, List[str]] = {}

    for category, kw_dict in CATEGORY_KEYWORDS.items():
        score, matches = _match_keywords(combined_text, tokens, kw_dict)
        if score > 0:
            category_scores[category] = score
            category_matches[category] = matches

    # Handle unfamiliar crisis where standard matches are purely incidental location tokens (e.g., "examination hall" for drone)
    is_unfamiliar_event = bool(detected_unfamiliar)
    if is_unfamiliar_event:
        # If no standard matches OR the matches are only incidental location references (score <= 5.5)
        top_sc = max(category_scores.values()) if category_scores else 0.0
        if not category_scores or top_sc <= 5.5:
            unfamiliar_desc = "; ".join(detected_unfamiliar)
            dept = DEPARTMENT_MAPPING[ComplaintCategory.NEEDS_ASSESSMENT]
            return ClassificationResult(
                category=ComplaintCategory.NEEDS_ASSESSMENT,
                assigned_department=dept,
                confidence=0.55,
                matched_keywords=[f"unfamiliar_signal: {u}" for u in detected_unfamiliar],
                secondary_categories=[],
                all_categories=[ComplaintCategory.NEEDS_ASSESSMENT.value, "Unfamiliar Incident"],
                is_ambiguous=False,
                is_unfamiliar=True,
                explanation=(
                    f"Unfamiliar or multi-domain incident detected ({unfamiliar_desc}). "
                    f"Not forced into predefined service buckets; assigned to {dept} for direct assessment."
                ),
            )

    # Case: No standard domain keywords matched
    if not category_scores:
        dept = DEPARTMENT_MAPPING[ComplaintCategory.GENERAL_UNKNOWN]
        return ClassificationResult(
            category=ComplaintCategory.GENERAL_UNKNOWN,
            assigned_department=dept,
            confidence=0.0,
            matched_keywords=[],
            secondary_categories=[],
            all_categories=[ComplaintCategory.GENERAL_UNKNOWN.value],
            is_ambiguous=False,
            is_unfamiliar=False,
            explanation=f"No domain-specific indicators matched in report text. Assigned to {dept} for staff review.",
        )

    # Sort categories by score descending
    sorted_categories = sorted(
        category_scores.items(), key=lambda item: item[1], reverse=True
    )

    top_category, top_score = sorted_categories[0]
    top_matches = category_matches[top_category]

    # Multi-category detection & ambiguity
    secondary_categories: List[Dict[str, Any]] = []
    all_categories: List[str] = [top_category.value]
    is_ambiguous = False
    margin = 1.0

    if len(sorted_categories) > 1:
        second_category, second_score = sorted_categories[1]
        margin = (top_score - second_score) / top_score if top_score > 0 else 0.0

        for cat, sc in sorted_categories[1:]:
            if sc >= 2.0:
                all_categories.append(cat.value)
                secondary_categories.append({
                    "category": cat.value,
                    "score": round(sc, 2),
                    "matched_keywords": category_matches.get(cat, []),
                })

        if margin <= 0.30 and second_score >= 2.0:
            is_ambiguous = True

    # Calculate confidence heuristic
    signal_factor = min(1.0, top_score / 6.0)
    separation_factor = min(1.0, margin + 0.3)
    raw_confidence = 0.4 * signal_factor + 0.6 * separation_factor

    if is_ambiguous:
        confidence = min(0.60, max(0.40, raw_confidence * 0.75))
    else:
        confidence = max(0.40, min(0.95, raw_confidence))

    # Formulate explanation ensuring assigned department is always stated
    dept = DEPARTMENT_MAPPING[top_category]
    matched_str = ", ".join(top_matches[:5])
    if is_ambiguous:
        runner_up_name = sorted_categories[1][0].value
        explanation = (
            f"Classified primarily as '{top_category.value}' (matches: {matched_str}), "
            f"with substantial overlap from '{runner_up_name}'. Assigned to {dept}. Human verification recommended."
        )
    elif len(all_categories) > 1:
        other_cats = ", ".join(all_categories[1:])
        explanation = (
            f"Classified as '{top_category.value}' based on keyword signals: {matched_str}. "
            f"Additional relevant categories identified: {other_cats}. Assigned to {dept}."
        )
    else:
        explanation = (
            f"Classified as '{top_category.value}' based on strong keyword signals: {matched_str}. "
            f"Assigned to {dept}."
        )

    return ClassificationResult(
        category=top_category,
        assigned_department=dept,
        confidence=round(confidence, 2),
        matched_keywords=top_matches,
        secondary_categories=secondary_categories,
        all_categories=all_categories,
        is_ambiguous=is_ambiguous,
        is_unfamiliar=is_unfamiliar_event,
        explanation=explanation,
    )
