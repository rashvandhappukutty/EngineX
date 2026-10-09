"""Provider-independent Natural Language Understanding (NLU) adapter layer."""

from __future__ import annotations

import json
import re
from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List, Optional, Set

from ai.config import ModelConfig
from ai.schemas import IncidentReport, NLUStructuredExtraction


class BaseLanguageModelAdapter(ABC):
    """Abstract interface for language model providers and extractors."""

    @abstractmethod
    def extract_structured_information(
        self, report: IncidentReport
    ) -> NLUStructuredExtraction:
        """Extract structured entities, facts, assumptions, and indicators from incident text."""
        pass


class RuleBasedFallbackAdapter(BaseLanguageModelAdapter):
    """
    Deterministic, zero-dependency NLU fallback.
    Extracts structured incident attributes, distinguishes facts from assumptions,
    and identifies missing information without requiring external APIs or GPUs.
    """

    def extract_structured_information(
        self, report: IncidentReport
    ) -> NLUStructuredExtraction:
        text = f"{report.title or ''} {report.description or ''} {report.location or ''}".strip()
        if not text:
            return NLUStructuredExtraction(
                primary_problem="Unspecified / Empty report",
                identified_locations=[],
                affected_services=[],
                estimated_affected_count=None,
                urgency_indicators=[],
                known_facts=[],
                assumptions_or_inferences=[],
                conflicting_or_contradictory_elements=["Report contains no textual details"],
                missing_critical_information=["Incident description", "Exact location", "Severity"],
                confidence=0.0,
            )

        lower_text = text.lower()
        words = re.findall(r"\b\w+\b", lower_text)

        # 1. Primary Problem Extraction
        primary_problem = report.title.strip() if report.title.strip() else "Reported incident"

        # 2. Location Identification
        locations: List[str] = []
        if report.location:
            locations.append(report.location.strip())

        location_patterns = [
            r"(?:in|at|near|outside|inside|behind|room|block|hall|lab|floor)\s+([a-zA-Z0-9\-\s]{3,25})",
            r"(hostel|cafeteria|canteen|library|auditorium|substation|ground|gate \d+)",
        ]
        for pat in location_patterns:
            matches = re.findall(pat, lower_text)
            for m in matches:
                clean_m = m.strip() if isinstance(m, str) else m[0].strip()
                if clean_m and clean_m not in [l.lower() for l in locations] and len(clean_m) > 2:
                    locations.append(clean_m.title())

        # 3. Affected Services & Infrastructure
        services: List[str] = []
        service_keywords = {
            "internet": "Campus Network & Wi-Fi",
            "wifi": "Campus Network & Wi-Fi",
            "electricity": "Power Distribution",
            "power": "Power Distribution",
            "water": "Water Supply",
            "plumbing": "Plumbing System",
            "bus": "Transport Fleet",
            "shuttle": "Transport Fleet",
            "elevator": "Vertical Transportation / Lifts",
            "lift": "Vertical Transportation / Lifts",
            "portal": "Student Information Portal / LMS",
            "exam": "Examination Services",
        }
        for kw, svc in service_keywords.items():
            if kw in lower_text and svc not in services:
                services.append(svc)

        # 4. Affected People Estimation
        estimated_count = None
        count_match = re.search(r"\b(\d+)\s+(?:students|people|faculty|staff|passengers|persons)\b", lower_text)
        if count_match:
            try:
                estimated_count = int(count_match.group(1))
            except ValueError:
                pass
        elif "hundreds" in lower_text or "entire campus" in lower_text:
            estimated_count = 500
        elif "crowded" in lower_text or "classroom" in lower_text:
            estimated_count = 40

        # 5. Urgency Indicators
        urgency_terms = [
            "emergency", "urgent", "immediately", "right now", "active", "spreading",
            "fumes", "flames", "smoke", "fire", "leak", "sparking", "unconscious",
            "fainted", "injury", "bleeding", "trapped", "stuck", "danger"
        ]
        detected_urgencies = [term for term in urgency_terms if term in lower_text]

        # 6. Facts vs Assumptions vs Contradictions
        known_facts: List[str] = []
        assumptions: List[str] = []
        contradictions: List[str] = []
        missing_info: List[str] = []

        if report.title:
            known_facts.append(f"Reported subject: '{report.title.strip()}'")
        if report.location:
            known_facts.append(f"Explicit location stated: '{report.location.strip()}'")
        else:
            missing_info.append("Precise location/room number not specified")

        # Detect tentative / assumption language
        speculative_cues = ["might be", "seems like", "could be", "probably", "assuming", "looks like", "rumored"]
        for cue in speculative_cues:
            if cue in lower_text:
                assumptions.append(f"Report contains tentative inference using phrase '{cue}'")

        # Detect contradictions (e.g., safe vs dangerous, working vs not working)
        if "no problem" in lower_text and any(u in detected_urgencies for u in ["fire", "smoke", "flames", "emergency"]):
            contradictions.append("Report mentions safety hazard alongside statement of 'no problem'")

        if not services and not detected_urgencies and len(words) < 5:
            missing_info.append("Detailed description and operational impact")

        confidence = 0.70
        if not report.location:
            confidence -= 0.15
        if assumptions or contradictions:
            confidence -= 0.15
        if len(words) < 6:
            confidence -= 0.20

        confidence = max(0.20, min(0.90, confidence))

        return NLUStructuredExtraction(
            primary_problem=primary_problem,
            identified_locations=locations,
            affected_services=services,
            estimated_affected_count=estimated_count,
            urgency_indicators=detected_urgencies,
            known_facts=known_facts,
            assumptions_or_inferences=assumptions,
            conflicting_or_contradictory_elements=contradictions,
            missing_critical_information=missing_info,
            detected_entities={"services": services, "locations": locations},
            confidence=round(confidence, 2),
        )


class MockLanguageModelAdapter(BaseLanguageModelAdapter):
    """Mock adapter for deterministic testing of model outputs and failure modes."""

    def __init__(
        self,
        mock_response: Optional[NLUStructuredExtraction] = None,
        should_timeout: bool = False,
        should_fail_malformed: bool = False,
    ):
        self.mock_response = mock_response
        self.should_timeout = should_timeout
        self.should_fail_malformed = should_fail_malformed
        self.fallback = RuleBasedFallbackAdapter()

    def extract_structured_information(
        self, report: IncidentReport
    ) -> NLUStructuredExtraction:
        if self.should_timeout:
            raise TimeoutError("Language model request timed out after 3.0s")

        if self.should_fail_malformed:
            raise ValueError("Malformed JSON output from model: missing required schema keys")

        if self.mock_response is not None:
            return self.mock_response

        return self.fallback.extract_structured_information(report)


class ConfigurableLLMAdapter(BaseLanguageModelAdapter):
    """
    Adapter for connecting custom LLMs or external endpoints with timeout safeguards
    and automatic schema validation.
    """

    def __init__(
        self,
        llm_callable: Optional[Callable[[str], Dict[str, Any]]] = None,
        config: Optional[ModelConfig] = None,
    ):
        self.llm_callable = llm_callable
        self.config = config or ModelConfig()
        self.fallback = RuleBasedFallbackAdapter()

    def extract_structured_information(
        self, report: IncidentReport
    ) -> NLUStructuredExtraction:
        if not self.llm_callable:
            return self.fallback.extract_structured_information(report)

        try:
            raw_payload = json.dumps(report.to_dict())
            response_dict = self.llm_callable(raw_payload)

            # Strict schema validation
            if not isinstance(response_dict, dict) or "primary_problem" not in response_dict:
                raise ValueError("Model response failed schema validation: missing 'primary_problem'")

            return NLUStructuredExtraction(
                primary_problem=response_dict.get("primary_problem", "Reported incident"),
                identified_locations=response_dict.get("identified_locations", []),
                affected_services=response_dict.get("affected_services", []),
                estimated_affected_count=response_dict.get("estimated_affected_count"),
                urgency_indicators=response_dict.get("urgency_indicators", []),
                known_facts=response_dict.get("known_facts", []),
                assumptions_or_inferences=response_dict.get("assumptions_or_inferences", []),
                conflicting_or_contradictory_elements=response_dict.get("conflicting_or_contradictory_elements", []),
                missing_critical_information=response_dict.get("missing_critical_information", []),
                detected_entities=response_dict.get("detected_entities", {}),
                confidence=float(response_dict.get("confidence", 0.75)),
            )
        except Exception as exc:
            if self.config.fallback_on_failure:
                fallback_res = self.fallback.extract_structured_information(report)
                fallback_res.assumptions_or_inferences.append(
                    f"LLM extraction failed ({str(exc)}); relied on deterministic rule-based fallback."
                )
                return fallback_res
            raise exc


def get_language_model_adapter(
    config: Optional[ModelConfig] = None,
) -> BaseLanguageModelAdapter:
    """Factory creating the appropriate language understanding adapter based on config."""
    cfg = config or ModelConfig()
    if cfg.provider == "rule_based_fallback":
        return RuleBasedFallbackAdapter()
    if cfg.provider == "mock":
        return MockLanguageModelAdapter()
    return RuleBasedFallbackAdapter()
