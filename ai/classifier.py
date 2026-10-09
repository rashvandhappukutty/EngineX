"""Complaint category classification engine with explainability and typo tolerance."""

from __future__ import annotations

import difflib
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from ai.rules import CATEGORY_KEYWORDS
from ai.schemas import (
    DEPARTMENT_MAPPING,
    ClassificationResult,
    ComplaintCategory,
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
    # Only applied to keywords of length >= 5 on unmatched tokens of similar length
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
) -> ClassificationResult:
    """
    Classify a college complaint report into one of the designated categories.

    Args:
        title: Short subject/title of the incident or complaint.
        description: Detailed explanation of the issue.
        location: Optional campus building, room, or area.

    Returns:
        ClassificationResult with predicted category, department, confidence, and explanation.
    """
    title_norm = _normalize_text(title)
    desc_norm = _normalize_text(description)
    loc_norm = _normalize_text(location)

    combined_text = f"{title_norm} {title_norm} {desc_norm} {loc_norm}".strip()
    tokens = _extract_tokens(combined_text)

    if not combined_text or not tokens:
        return ClassificationResult(
            category=ComplaintCategory.GENERAL_UNKNOWN,
            assigned_department=DEPARTMENT_MAPPING[ComplaintCategory.GENERAL_UNKNOWN],
            confidence=0.0,
            matched_keywords=[],
            secondary_categories=[],
            is_ambiguous=False,
            explanation="Insufficient or empty report text provided. Routed to General Triage for manual categorization.",
        )

    category_scores: Dict[ComplaintCategory, float] = {}
    category_matches: Dict[ComplaintCategory, List[str]] = {}

    for category, kw_dict in CATEGORY_KEYWORDS.items():
        score, matches = _match_keywords(combined_text, tokens, kw_dict)
        if score > 0:
            category_scores[category] = score
            category_matches[category] = matches

    if not category_scores:
        return ClassificationResult(
            category=ComplaintCategory.GENERAL_UNKNOWN,
            assigned_department=DEPARTMENT_MAPPING[ComplaintCategory.GENERAL_UNKNOWN],
            confidence=0.0,
            matched_keywords=[],
            secondary_categories=[],
            is_ambiguous=False,
            explanation="No domain-specific indicators matched in report text. Assigned to Helpdesk General Triage for staff review.",
        )

    # Sort categories by score descending
    sorted_categories = sorted(
        category_scores.items(), key=lambda item: item[1], reverse=True
    )

    top_category, top_score = sorted_categories[0]
    top_matches = category_matches[top_category]

    # Evaluate runner-up category for ambiguity
    secondary_categories: List[Dict[str, Any]] = []
    is_ambiguous = False
    margin = 1.0

    if len(sorted_categories) > 1:
        second_category, second_score = sorted_categories[1]
        margin = (top_score - second_score) / top_score if top_score > 0 else 0.0

        for cat, sc in sorted_categories[1:3]:
            secondary_categories.append({
                "category": cat.value,
                "score": round(sc, 2),
                "matched_keywords": category_matches.get(cat, []),
            })

        # If runner-up score is >= 2.0 and within 30% of top score, mark as ambiguous
        if margin <= 0.30 and second_score >= 2.0:
            is_ambiguous = True

    # Calculate transparent rule-based confidence heuristic (0.0 to 1.0)
    signal_factor = min(1.0, top_score / 6.0)
    separation_factor = min(1.0, margin + 0.3)
    raw_confidence = 0.4 * signal_factor + 0.6 * separation_factor

    if is_ambiguous:
        confidence = min(0.60, max(0.40, raw_confidence * 0.75))
    else:
        confidence = max(0.40, min(0.95, raw_confidence))

    # Formulate explanation
    dept = DEPARTMENT_MAPPING[top_category]
    matched_str = ", ".join(top_matches[:5])
    if is_ambiguous:
        runner_up_name = sorted_categories[1][0].value
        explanation = (
            f"Classified as '{top_category.value}' (matches: {matched_str}), "
            f"with substantial overlap from '{runner_up_name}'. Human verification recommended."
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
        is_ambiguous=is_ambiguous,
        explanation=explanation,
    )
