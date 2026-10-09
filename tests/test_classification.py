"""Tests for multi-category classification, typo tolerance, and ambiguity detection."""

import pytest
from ai.classifier import classify_complaint
from ai.schemas import ComplaintCategory


def test_multi_category_complex_incident():
    """Verify that complex reports spanning multiple domains record all relevant categories."""
    res = classify_complaint(
        title="Chemical reaction spill in laboratory caused switchboard short circuit",
        description="Hydrochloric acid beaker shattered near the power socket causing electrical sparks in Chemistry Lab.",
        location="Chemistry Lab 1",
    )
    assert len(res.all_categories) >= 2
    assert any("Laboratory" in c for c in res.all_categories)
    assert any("Maintenance and Electrical" in c or "Medical and Safety" in c for c in res.all_categories)
    assert len(res.matched_keywords) > 0


def test_classification_spelling_variation():
    """Verify robust typo handling for multiple misspelled words."""
    res = classify_complaint(
        title="elctricity cut off and light flickering",
        description="the tube light in classroom is flickeing and plubming tap leaking.",
        location="Mechanical Block",
    )
    assert res.category == ComplaintCategory.MAINTENANCE_AND_ELECTRICAL
    assert res.confidence >= 0.50


def test_classification_confidence_honesty():
    """Verify confidence values are bounded and documented honestly."""
    res = classify_complaint(
        title="Wi-Fi router offline",
        description="Students cannot access internet via Wi-Fi router.",
        location="Library",
    )
    assert 0.0 <= res.confidence <= 1.0
    assert "IT Support" in res.explanation
