import logging
from typing import Tuple, Optional, Dict, Any
import httpx
from app.core.config import settings
from app.schemas.incidents import IncidentCategory, IncidentSeverity
from app.schemas.helpdesk import HelpdeskCategory, HelpdeskPriority, HelpdeskDepartment

logger = logging.getLogger("enginex.classification")

EMERGENCY_KEYWORDS = {
    "fire", "smoke", "explosion", "flame", "burn", "bomb", "gun", "shooter",
    "collapse", "bleeding", "unconscious", "cardiac", "stroke", "seizure",
    "chemical leak", "gas leak", "electrocution", "intruder", "hostage"
}


class ClassificationService:
    """Service providing classification with deterministic fallback and optional AI service integration."""

    @staticmethod
    def is_emergency_content(title: str, description: str) -> bool:
        """Check if text contains critical emergency indicators."""
        text = f"{title} {description}".lower()
        return any(keyword in text for keyword in EMERGENCY_KEYWORDS)

    @staticmethod
    def fallback_incident_classification(title: str, description: str) -> Tuple[IncidentCategory, IncidentSeverity]:
        """Deterministic keyword-based classification for emergency incidents."""
        text = f"{title} {description}".lower()

        # Category determination
        if any(w in text for w in ["fire", "smoke", "flame", "burning", "blaze"]):
            category = IncidentCategory.FIRE
        elif any(w in text for w in ["medical", "injury", "injured", "bleed", "faint", "cardiac", "ambulance", "health"]):
            category = IncidentCategory.MEDICAL
        elif any(w in text for w in ["security", "thief", "weapon", "intruder", "fight", "assault", "robbery"]):
            category = IncidentCategory.SECURITY
        elif any(w in text for w in ["leak", "water", "pipe", "power", "blackout", "elevator", "structural", "roof", "wire"]):
            category = IncidentCategory.INFRASTRUCTURE
        elif any(w in text for w in ["flood", "earthquake", "storm", "landslide", "tree fall"]):
            category = IncidentCategory.NATURAL_HAZARD
        else:
            category = IncidentCategory.OTHER

        # Severity determination
        if any(w in text for w in ["explosion", "active shooter", "massive fire", "building collapse", "fatal", "cardiac arrest"]):
            severity = IncidentSeverity.CRITICAL
        elif any(w in text for w in ["fire", "smoke", "injured", "weapon", "gas leak", "trapped"]):
            severity = IncidentSeverity.HIGH
        elif any(w in text for w in ["pipe burst", "power outage", "broken door", "spill"]):
            severity = IncidentSeverity.MEDIUM
        else:
            severity = IncidentSeverity.LOW

        return category, severity

    @staticmethod
    def fallback_helpdesk_classification(title: str, description: str) -> Tuple[HelpdeskCategory, HelpdeskDepartment, HelpdeskPriority]:
        """Deterministic fallback classification and department routing for helpdesk tickets."""
        text = f"{title} {description}".lower()

        if any(w in text for w in ["wifi", "internet", "network", "computer", "laptop", "software", "login", "password", "email", "printer"]):
            category = HelpdeskCategory.IT_SUPPORT
            dept = HelpdeskDepartment.IT
        elif any(w in text for w in ["door", "window", "key", "lock", "aircon", "ac", "hvac", "furniture", "chair", "desk", "room booking"]):
            category = HelpdeskCategory.FACILITIES
            dept = HelpdeskDepartment.FACILITIES
        elif any(w in text for w in ["leak", "plumbing", "toilet", "light", "bulb", "elevator", "power", "water"]):
            category = HelpdeskCategory.MAINTENANCE
            dept = HelpdeskDepartment.MAINTENANCE
        elif any(w in text for w in ["guard", "badge", "access card", "lost item", "found item", "parking permit"]):
            category = HelpdeskCategory.SECURITY
            dept = HelpdeskDepartment.SECURITY
        elif any(w in text for w in ["id card", "form", "document", "fee", "transcript", "admission", "registration"]):
            category = HelpdeskCategory.ADMINISTRATION
            dept = HelpdeskDepartment.ADMINISTRATION
        else:
            category = HelpdeskCategory.OTHER
            dept = HelpdeskDepartment.GENERAL

        # Priority determination
        if any(w in text for w in ["urgent", "immediately", "critical", "broken server", "system down"]):
            priority = HelpdeskPriority.URGENT
        elif any(w in text for w in ["high", "blocked", "cannot work", "exam"]):
            priority = HelpdeskPriority.HIGH
        elif any(w in text for w in ["low", "minor", "suggestion"]):
            priority = HelpdeskPriority.LOW
        else:
            priority = HelpdeskPriority.MEDIUM

        return category, dept, priority

    async def classify_incident_with_ai(
        self, title: str, description: str
    ) -> Tuple[IncidentCategory, IncidentSeverity, Optional[str], Optional[float]]:
        """Try calling AI service contract or integrated AI engine; fall back deterministically on any failure or if disabled."""
        if not settings.AI_ENABLED:
            cat, sev = self.fallback_incident_classification(title, description)
            return cat, sev, None, None

        # 1. Try remote microservice if configured and available
        try:
            async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
                response = await client.post(
                    f"{settings.AI_SERVICE_URL}/classify-incident",
                    json={"title": title, "description": description},
                )
                if response.status_code == 200:
                    data = response.json()
                    cat_str = data.get("category")
                    sev_str = data.get("severity")
                    confidence = float(data.get("confidence", 0.0))

                    # Validate AI outputs against known enums
                    category = IncidentCategory(cat_str) if cat_str in [c.value for c in IncidentCategory] else None
                    severity = IncidentSeverity(sev_str) if sev_str in [s.value for s in IncidentSeverity] else None

                    if category and severity:
                        return category, severity, "AI_MICROSERVICE_V1", confidence
        except Exception:
            pass

        # 2. Integrate with internal CampusOne AI Engine
        try:
            from ai.engine import analyze_situation
            res = analyze_situation(report={"title": title, "description": description})
            risk_prio = res.get("risk_assessment", {}).get("priority", "Low")
            sev_map = {
                "Critical": IncidentSeverity.CRITICAL,
                "High": IncidentSeverity.HIGH,
                "Medium": IncidentSeverity.MEDIUM,
                "Low": IncidentSeverity.LOW,
            }
            mapped_sev = sev_map.get(risk_prio, IncidentSeverity.LOW)

            text = f"{title} {description}".lower()
            if any(w in text for w in ["fire", "smoke", "flame", "blaze"]):
                mapped_cat = IncidentCategory.FIRE
            elif any(w in text for w in ["medical", "injury", "injured", "bleed", "faint", "cardiac", "ambulance"]):
                mapped_cat = IncidentCategory.MEDICAL
            elif any(w in text for w in ["security", "thief", "weapon", "intruder", "fight", "assault"]):
                mapped_cat = IncidentCategory.SECURITY
            elif any(w in text for w in ["flood", "earthquake", "storm"]):
                mapped_cat = IncidentCategory.NATURAL_HAZARD
            elif any(w in text for w in ["leak", "water", "pipe", "power", "blackout", "elevator", "wire", "wifi", "internet"]):
                mapped_cat = IncidentCategory.INFRASTRUCTURE
            else:
                mapped_cat = IncidentCategory.OTHER

            confidence = float(res.get("uncertainty", {}).get("classification_confidence", 0.85))
            return mapped_cat, mapped_sev, "CAMPUSONE_AI_INTEGRATED", confidence
        except Exception as exc:
            logger.warning(f"AI engine call failed ({exc}). Using deterministic fallback.")

        # 3. Deterministic fallback
        cat, sev = self.fallback_incident_classification(title, description)
        return cat, sev, "DETERMINISTIC_FALLBACK", 1.0


classification_service = ClassificationService()

