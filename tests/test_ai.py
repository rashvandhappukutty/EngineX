import asyncio
from app.services.classification_service import classification_service
from app.schemas.incidents import IncidentCategory, IncidentSeverity


def test_ai_unavailable_fallback():
    async def run_test():
        cat, sev, model, conf = await classification_service.classify_incident_with_ai(
            "Heavy smoke coming from chemical storage",
            "Visible fire flames near solvent drums"
        )
        assert cat == IncidentCategory.FIRE
        assert sev in (IncidentSeverity.HIGH, IncidentSeverity.CRITICAL)
        assert model is None or model == "DETERMINISTIC_FALLBACK"

    asyncio.run(run_test())
