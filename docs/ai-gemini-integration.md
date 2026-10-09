# Google Gemini NLU Integration Guide — CampusOne AI

This document provides complete instructions for configuring, operating, and extending the Google Gemini Natural Language Understanding (NLU) adapter in **CampusOne AI**.

---

## 1. Overview & Architecture

CampusOne AI employs a **hybrid AI architecture** combining large language model understanding with authoritative deterministic safety controls:

```
+-------------------------------------------------------------------------------+
|                       Campus Incident Report (Untrusted Text)                 |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                      Language Understanding Layer (NLU)                      |
|                                                                               |
|  [ AI_NLU_PROVIDER=gemini ]                     [ AI_NLU_PROVIDER=rule_based_fallback ]
|  GeminiLanguageModelAdapter                     RuleBasedFallbackAdapter      |
|  - Official `google-genai` SDK                  - Zero external dependencies  |
|  - JSON Schema (`GeminiIncidentExtractionSchema`)- Deterministic parsing      |
|  - Prompt Injection Defenses                    - Always available fallback   |
+-------------------------------------------------------------------------------+
                                        |
                         NLUStructuredExtraction
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                      Authoritative Deterministic Engine                       |
|                                                                               |
|  1. Situation Classification (`classify_complaint`)                           |
|  2. Risk & Priority Assessment (`assess_risk` - Safety Floor >= 88)           |
|  3. Decision Support Planning (`recommend_response`)                          |
|  4. Resource Coordination (`match_resources` - Real staff data)               |
|  5. Multi-Incident Correlation (`analyze_incident_relationships`)             |
|  6. Safe Evacuation Routing (`recommend_evacuation_routes`)                   |
|  7. Dynamic Reassessment (`reassess_situation`)                               |
+-------------------------------------------------------------------------------+
```

### Separation of Responsibilities

| Responsibility | Handled By | Authoritative? |
| :--- | :--- | :--- |
| **Incident Text Summary & Extraction** | Google Gemini (`GeminiLanguageModelAdapter`) | Advisory |
| **Candidate Categories Suggestion** | Google Gemini (`GeminiLanguageModelAdapter`) | Advisory |
| **Reported Facts vs Assumptions** | Google Gemini (`GeminiLanguageModelAdapter`) | Advisory |
| **Final Category & Department Assignment** | Deterministic Classifier (`classify_complaint`) | **Authoritative** |
| **Final Priority & Risk Score (0-100)** | Deterministic Risk Engine (`assess_risk`) | **Authoritative** |
| **Safety-Floor Enforcement (>= 88)** | Deterministic Safety Rules (`CRITICAL_SAFETY_KEYWORDS`) | **Authoritative** |
| **Mandatory Human Review Triage** | Deterministic Safeguard Engine | **Authoritative** |
| **Staff & Equipment Resource Matching** | Deterministic Matcher (`match_resources`) | **Authoritative** |
| **Safe Evacuation Routing** | Deterministic Graph Pathfinding (`recommend_evacuation_routes`) | **Authoritative** |

---

## 2. Installation & Prerequisites

1. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *Core packages*: `google-genai>=2.0.0`, `pydantic>=2.0.0`, `pytest>=8.0.0`.

---

## 3. Obtaining & Configuring Credentials

1. Obtain a Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Set the environment variables in your deployment environment or create a `.env` file (based on `.env.example`):

   ```bash
   # Select Gemini provider
   export AI_NLU_PROVIDER=gemini

   # Configure API Key
   export GEMINI_API_KEY=AIzaSy...

   # Specify Model (default is gemini-2.5-flash)
   export GEMINI_MODEL=gemini-2.5-flash

   # Request Timeout in seconds (default: 10.0)
   export GEMINI_REQUEST_TIMEOUT=10.0
   ```

> [!CAUTION]
> **Security Notice**: Never commit real API keys or `.env` files to Git. The `.gitignore` file is configured to exclude `.env` files automatically.

---

## 4. Provider Selection & Fallback Behavior

CampusOne AI supports multiple NLU provider modes:

- `rule_based_fallback` *(Default)*: Runs completely offline without API keys or external network calls.
- `gemini`: Uses Google Gemini with structured JSON output and schema validation.
- `custom_llm`: Accepts an injected custom inference callable.
- `mock`: Deterministic test harness for simulating latency, rate limits, and errors.

### Safe Fallback Lifecycle

When `AI_NLU_PROVIDER=gemini` is active:
1. **Missing API Key**: The system logs a diagnostic message in `assumptions_or_inferences` and automatically activates `RuleBasedFallbackAdapter`.
2. **Timeouts & Network Outages**: If Gemini does not respond within `GEMINI_REQUEST_TIMEOUT`, the system activates the rule-based fallback.
3. **Rate Limiting (HTTP 429)**: Quota exhaustion triggers safe fallback without crashing the crisis coordination pipeline.
4. **Malformed Responses**: Responses failing Pydantic schema validation trigger the fallback.
5. **Honest Provider Attribution**: The provider identifier in `known_facts` explicitly documents whether Google Gemini or the rule-based fallback processed the report.

---

## 5. Security & Prompt-Injection Safeguards

Incident reports submitted by students or staff are treated as **untrusted user input**. 

The Gemini adapter enforces rigorous prompt-injection defenses:
- **System Instructions**: Instruct the model to strictly isolate user text as data, ignoring instructions that attempt to alter model roles, return artificial low priorities, or reveal system prompts.
- **Strict Structured Schema**: All responses are parsed into `GeminiIncidentExtractionSchema` via `google.genai` structured outputs.
- **Authoritative Safety Floor**: Even if an adversarial prompt convinces the model to return a low urgency score for an incident containing life-safety hazards (e.g., active fire, chemical spill, live wire arcing), the deterministic safety engine enforces `PriorityLevel.CRITICAL`, `risk_score >= 88`, and `requires_human_review = True`.

---

## 6. Running Tests

### Running Unit Tests (Offline / Mocked)
All unit tests use mocked Gemini responses and run offline without requiring an API key or internet access:
```bash
pytest
```

To run the Gemini integration suite specifically:
```bash
pytest -v tests/test_gemini_integration.py
```

### Running the Optional Live Integration Test
To run the live test against Google's Gemini API:
```bash
# Set your API key
export GEMINI_API_KEY="your_api_key_here"

# Run pytest (the live test will automatically execute)
pytest -k test_real_gemini_live_request -v
```

---

## 7. Latency, Quota, & Privacy Considerations

- **API Quotas**: `gemini-2.5-flash` offers high RPM and TPM limits suitable for college emergency triage. In case of quota exhaustion, the engine seamlessly fails over to rule-based triage.
- **Latency**: Calls are bounded by `GEMINI_REQUEST_TIMEOUT` (default: 10s).
- **Data Privacy**: Only the incident title, description, and location are transmitted to the NLU provider. Sensitive campus topology, staff rosters, and equipment availability remain strictly local to the campus infrastructure and are never sent to external APIs.
