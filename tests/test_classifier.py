"""Tests for complaint classification engine."""

import pytest
from ai.classifier import classify_complaint
from ai.schemas import ComplaintCategory, DEPARTMENT_MAPPING


def test_classify_wifi_outage():
    """Verify IT and Network classification for Wi-Fi outages."""
    res = classify_complaint(
        title="Wi-Fi outage in Room 302",
        description="The Wi-Fi router is offline and students cannot connect to the internet in Main Block.",
        location="Block A, Room 302",
    )
    assert res.category == ComplaintCategory.IT_AND_NETWORK
    assert res.assigned_department == "IT Support"
    assert res.confidence >= 0.70
    assert not res.is_ambiguous
    assert "IT Support" in res.explanation


def test_classify_broken_fan():
    """Verify Maintenance and Electrical classification for broken fan."""
    res = classify_complaint(
        title="Ceiling fan not working",
        description="The ceiling fan in classroom 104 is not rotating and the switch seems stuck.",
        location="Mechanical Block, Room 104",
    )
    assert res.category == ComplaintCategory.MAINTENANCE_AND_ELECTRICAL
    assert res.assigned_department == "Estate & Maintenance"
    assert res.confidence >= 0.60


def test_classify_sanitation():
    """Verify Housekeeping and Sanitation classification for dirty restroom."""
    res = classify_complaint(
        title="Restroom is dirty and unhygienic",
        description="The second floor washroom has overflowing dustbins and foul smell.",
        location="Science Block 2nd Floor",
    )
    assert res.category == ComplaintCategory.HOUSEKEEPING_AND_SANITATION
    assert res.assigned_department == "Housekeeping & Sanitation"
    assert res.confidence >= 0.65


def test_classify_transport():
    """Verify Transport classification for bus delays."""
    res = classify_complaint(
        title="College bus delayed on Route 7",
        description="The college bus on route 7 was 45 minutes late at the bus stop today.",
        location="North Campus Gate",
    )
    assert res.category == ComplaintCategory.TRANSPORT
    assert res.assigned_department == "Transport Office"
    assert res.confidence >= 0.65


def test_classify_laboratory():
    """Verify Laboratory classification for apparatus/equipment issues."""
    res = classify_complaint(
        title="Broken microscope in Chemistry Lab",
        description="The optical microscope and burette stand in the chemistry lab are damaged.",
        location="Chemistry Lab 2",
    )
    assert res.category == ComplaintCategory.LABORATORY
    assert res.assigned_department == "Laboratory Management"
    assert res.confidence >= 0.65


def test_classify_security():
    """Verify Security classification for unauthorized trespassing / theft."""
    res = classify_complaint(
        title="Unauthorized stranger near hostel gate",
        description="An unknown person was spotted trespassing past the security guard near the main gate.",
        location="Hostel Gate 2",
    )
    assert res.category == ComplaintCategory.SECURITY
    assert res.assigned_department == "Campus Security"
    assert res.confidence >= 0.65


def test_classify_academic_administration():
    """Verify Academic Administration classification for marksheet / transcript issues."""
    res = classify_complaint(
        title="Correction needed in Semester Marksheet",
        description="My degree transcript and grade card have an incorrect subject code.",
        location="Admin Block",
    )
    assert res.category == ComplaintCategory.ACADEMIC_ADMINISTRATION
    assert res.assigned_department == "Academic Affairs"
    assert res.confidence >= 0.65


def test_classify_medical_and_safety():
    """Verify Medical and Safety classification for injuries and emergencies."""
    res = classify_complaint(
        title="Student fainted during sports practice",
        description="A student collapsed and needs first aid and medical attention at the clinic.",
        location="Sports Complex",
    )
    assert res.category == ComplaintCategory.MEDICAL_AND_SAFETY
    assert res.assigned_department == "Campus Health & Safety"
    assert res.confidence >= 0.70


def test_classify_unknown_gibberish():
    """Verify graceful handling and routing for unclassifiable text."""
    res = classify_complaint(
        title="xyz abc qwerty",
        description="random text without any college keywords 123456",
        location="Nowhere",
    )
    assert res.category == ComplaintCategory.GENERAL_UNKNOWN
    assert res.assigned_department == "Helpdesk General Triage"
    assert res.confidence == 0.0
    assert "Helpdesk General Triage" in res.explanation


def test_classify_empty_input():
    """Verify handling of completely empty inputs."""
    res = classify_complaint(title="", description="", location=None)
    assert res.category == ComplaintCategory.GENERAL_UNKNOWN
    assert res.assigned_department == "Helpdesk General Triage"
    assert res.confidence == 0.0


def test_classify_typo_tolerance():
    """Verify typo tolerance for common spelling variations."""
    res = classify_complaint(
        title="wifii not wrking",
        description="the intrnett conection is completely down in the hall.",
        location="Library",
    )
    assert res.category == ComplaintCategory.IT_AND_NETWORK
    assert res.assigned_department == "IT Support"


def test_classify_ambiguous_overlapping_complaint():
    """Verify ambiguity detection when multiple categories match strongly."""
    res = classify_complaint(
        title="Computer lab switchboard sparking and router broken",
        description="In the computer lab, the electrical switchboard is sparking and the internet router is also not working.",
        location="Computer Lab 1",
    )
    assert res.is_ambiguous or len(res.secondary_categories) > 0
    assert res.confidence <= 0.75
    assert len(res.matched_keywords) > 0
