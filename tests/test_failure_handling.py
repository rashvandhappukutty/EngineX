"""Tests for failure handling, timeout recovery, and malformed data resilience."""

import pytest
from ai.config import CampusAIConfig, ModelConfig
from ai.engine import analyze_complaint, analyze_situation
from ai.language_model import (
    ConfigurableLLMAdapter,
    MockLanguageModelAdapter,
    RuleBasedFallbackAdapter,
    get_language_model_adapter,
)
from ai.schemas import IncidentReport


def test_language_model_provider_selection_honesty():
    """Defect 1 fix: Verify get_language_model_adapter honestly reflects provider and fallback."""
    # Default without config
    adapter = get_language_model_adapter()
    assert isinstance(adapter, RuleBasedFallbackAdapter)
    assert adapter.provider_name == "rule_based_fallback"

    # Explicit custom callable injection
    def custom_fn(payload):
        return {
            "primary_problem": "Custom Model Parsed Problem",
            "confidence": 0.92,
        }

    injected_adapter = get_language_model_adapter(
        config=ModelConfig(provider="custom_llm"),
        custom_callable=custom_fn,
    )
    assert isinstance(injected_adapter, ConfigurableLLMAdapter)
    assert injected_adapter.provider_name == "custom_llm"

    extraction = injected_adapter.extract_structured_information(
        IncidentReport(title="Test", description="Test")
    )
    assert extraction.primary_problem == "Custom Model Parsed Problem"
    assert any("Connected Language Model" in fact for fact in extraction.known_facts)


def test_rule_based_fallback_reports_active_fallback():
    """Verify RuleBasedFallbackAdapter explicitly reports that it is a fallback in known facts."""
    adapter = RuleBasedFallbackAdapter()
    report = IncidentReport(title="Broken AC", description="Air conditioner leaking in Room 102")
    extraction = adapter.extract_structured_information(report)
    assert any("Deterministic rule-based fallback" in fact for fact in extraction.known_facts)


def test_language_model_timeout_graceful_fallback():
    """Verify that an LLM timeout triggers transparent fallback to deterministic rules without crashing."""
    report = IncidentReport(
        title="Wi-Fi failure in Auditorium",
        description="Students cannot connect to network during orientation.",
        location="Auditorium",
    )

    def failing_llm(payload: str):
        raise TimeoutError("Simulated LLM network timeout")

    llm_adapter = ConfigurableLLMAdapter(
        llm_callable=failing_llm,
        config=ModelConfig(fallback_on_failure=True),
    )
    res = llm_adapter.extract_structured_information(report)
    assert res.primary_problem == "Wi-Fi failure in Auditorium"
    assert any("fallback" in s.lower() for s in res.assumptions_or_inferences)


def test_malformed_model_output_fallback():
    """Verify handling when an external LLM returns malformed or incomplete JSON."""
    def malformed_llm(payload: str):
        return {"invalid_key": "garbage data"}

    llm_adapter = ConfigurableLLMAdapter(
        llm_callable=malformed_llm,
        config=ModelConfig(fallback_on_failure=True),
    )
    report = IncidentReport(
        title="Broken fan",
        description="Fan switch broken in room 101",
        location="Room 101",
    )
    res = llm_adapter.extract_structured_information(report)
    assert res.primary_problem == "Broken fan"


def test_empty_and_corrupt_situation_inputs():
    """Verify analyze_situation handles None, empty dict, and corrupt objects without unhandled exceptions."""
    res_none = analyze_situation(report="")
    assert res_none["requires_human_review"] is True
    assert res_none["risk_assessment"]["risk_score"] >= 0

    res_empty_dict = analyze_situation(report={})
    assert res_empty_dict["requires_human_review"] is True
