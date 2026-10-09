from app.schemas.incidents import IncidentSeverity, IncidentCategory


class PrioritizationService:
    """Deterministic prioritization calculation engine."""

    SEVERITY_WEIGHTS = {
        IncidentSeverity.CRITICAL: 100.0,
        IncidentSeverity.HIGH: 75.0,
        IncidentSeverity.MEDIUM: 50.0,
        IncidentSeverity.LOW: 25.0,
    }

    CATEGORY_WEIGHTS = {
        IncidentCategory.FIRE: 15.0,
        IncidentCategory.MEDICAL: 15.0,
        IncidentCategory.SECURITY: 10.0,
        IncidentCategory.NATURAL_HAZARD: 10.0,
        IncidentCategory.INFRASTRUCTURE: 5.0,
        IncidentCategory.OTHER: 0.0,
    }

    @classmethod
    def calculate_priority_score(
        cls,
        severity: IncidentSeverity,
        category: IncidentCategory,
        has_active_location_hazards: bool = False,
    ) -> float:
        """Calculate a deterministic priority score between 0.0 and 150.0."""
        base_score = cls.SEVERITY_WEIGHTS.get(severity, 25.0)
        category_modifier = cls.CATEGORY_WEIGHTS.get(category, 0.0)
        hazard_modifier = 20.0 if has_active_location_hazards else 0.0

        total_score = base_score + category_modifier + hazard_modifier
        return round(min(total_score, 150.0), 2)


prioritization_service = PrioritizationService()
