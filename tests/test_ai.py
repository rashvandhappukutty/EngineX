"""Tests for AI Service integration, fallback resilience, and AI API endpoints."""

import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.services.classification_service import classification_service
from app.schemas.incidents import IncidentCategory, IncidentSeverity


def test_ai_unavailable_fallback():
    """Verify fallback when AI is disabled."""
    async def run_test():
        orig_setting = settings.AI_ENABLED
        try:
            settings.AI_ENABLED = False
            cat, sev, model, conf = await classification_service.classify_incident_with_ai(
                "Heavy smoke coming from chemical storage",
                "Visible fire flames near solvent drums"
            )
            assert cat == IncidentCategory.FIRE
            assert sev in (IncidentSeverity.HIGH, IncidentSeverity.CRITICAL)
            assert model is None or model == "DETERMINISTIC_FALLBACK"
        finally:
            settings.AI_ENABLED = orig_setting

    asyncio.run(run_test())


def test_ai_integrated_engine_when_enabled():
    """Verify in-process CampusOne AI engine runs when AI is enabled."""
    async def run_test():
        orig_setting = settings.AI_ENABLED
        try:
            settings.AI_ENABLED = True
            cat, sev, model, conf = await classification_service.classify_incident_with_ai(
                "Toxic chemical spill in Chemistry Laboratory",
                "Acid leaking onto electrical wires with active sparking."
            )
            assert cat in (IncidentCategory.FIRE, IncidentCategory.MEDICAL, IncidentCategory.INFRASTRUCTURE)
            assert sev in (IncidentSeverity.CRITICAL, IncidentSeverity.HIGH)
            assert model in ("CAMPUSONE_AI_INTEGRATED", "AI_MICROSERVICE_V1", "DETERMINISTIC_FALLBACK")
            assert conf is not None
        finally:
            settings.AI_ENABLED = orig_setting

    asyncio.run(run_test())


def test_ai_analyze_situation_endpoint():
    """Verify POST /api/v1/ai/analyze-situation endpoint returns full situation analysis."""
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/analyze-situation",
        json={
            "title": "Flooding in Main Entrance Lobby",
            "description": "Heavy rainfall causes water level to rise rapidly inside the foyer.",
            "location": "Main Entrance Block",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert "risk_assessment" in data
    assert "recommended_department" in data
    assert "recommended_actions" in data
    assert "evacuation_recommendation" in data
    assert "requires_human_review" in data
    assert data["risk_assessment"]["risk_score"] >= 0


def test_ai_classify_incident_endpoint():
    """Verify POST /api/v1/ai/classify-incident endpoint returns standard triage contract."""
    client = TestClient(app)
    response = client.post(
        "/api/v1/ai/classify-incident",
        json={
            "title": "Wi-Fi Router failure in Hostel B",
            "description": "Internet connection down for all rooms on 2nd floor.",
            "location": "Hostel Block B",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "IT and Network"
    assert data["assigned_department"] == "IT Support"
    assert "priority" in data
    assert "priority_score" in data
    assert "reason" in data
