# CampusOne AI — Architecture & Intelligence Layers

## 1. Executive Summary

**CampusOne AI** (`EngineX`) is a hybrid adaptive intelligence and crisis coordination platform designed for college campuses. It combines natural-language understanding, multi-category situation classification, multi-dimensional risk assessment, decision support planning, resource coordination, multi-incident correlation, and safe evacuation pathfinding.

---

## 2. The 8 Hybrid Reasoning Layers

```
                                 [ Incoming Report ]
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │ 1. Language Understanding Layer (NLU) │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │ 2. Situation Classification Layer     │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │ 3. Adaptive Risk Assessment Layer     │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │ 4. Decision Support Layer             │
                      └─────────┬───────────┬───────────┬─────┘
                                │           │           │
                                ▼           ▼           ▼
                      ┌───────────────┐ ┌─────────┐ ┌───────────────┐
                      │ 5. Resource   │ │ 6. Multi│ │ 7. Safe       │
                      │    Matcher    │ │ Incident│ │    Evacuation │
                      │    Layer      │ │ Graph   │ │    Routing    │
                      └───────────────┘ └─────────┘ └───────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │ 8. Safety & Human Oversight Layer     │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      [ Dynamic Reassessment & Version Audit ]
```

### Layer 1: Language Understanding Layer (`ai/language_model.py`)
- **Role**: Extracts structured attributes from natural language (primary problem, locations, affected population, urgency indicators, missing information, known facts vs. assumptions, contradictions).
- **Architecture**: Provider-independent adapter interface (`BaseLanguageModelAdapter`) with a deterministic `RuleBasedFallbackAdapter`, testable `MockLanguageModelAdapter`, and pluggable `ConfigurableLLMAdapter`.

### Layer 2: Situation Classification Layer (`ai/classifier.py`)
- **Role**: Assigns primary and secondary categories across 9 standard operational domains or flags novel events as `Needs Assessment` / `Other`.
- **Key Capability**: Never forces unfamiliar situations (e.g. drone airspace violations, flash flooding, hazardous chemical discoveries) into unrelated predefined categories.

### Layer 3: Adaptive Risk Assessment Layer (`ai/risk_assessment.py`)
- **Role**: Evaluates multi-dimensional urgency: harm severity, immediacy of danger, affected population, campus occupancy, and infrastructure disruption.
- **Safety Floor**: Guaranteed minimum risk score ($\ge 85$) and mandatory human review for critical life-safety hazards (fire, gas leaks, acid spills, severe trauma, violence). Uncertainty never suppresses priority.

### Layer 4: Decision Support Layer (`ai/decision_support.py`)
- **Role**: Generates context-sensitive action sequences with prerequisites, required responder capabilities, escalation triggers, and safe contingency alternatives.
- **Policy**: Non-automated real-world actions. All outputs are decision-support recommendations requiring authorized human verification.

### Layer 5: Resource Coordination Layer (`ai/resource_matcher.py`)
- **Role**: Evaluates candidate staff, teams, and equipment based on skill overlap, real-time availability, geographical proximity, readiness, and active workload.
- **Constraint Handling**: Explicitly returns `"No suitable resource confirmed"` when constraints are unmet, preventing hallucinated personnel or dispatch times.

### Layer 6: Multi-Incident Reasoning Layer (`ai/incident_graph.py`)
- **Role**: Identifies co-located duplicate reports, shared infrastructure failures across campus blocks (e.g., campus substation breaker trips), and cascading hazards.
- **Hypothesis Tracking**: Flags causal links as explicit hypotheses until physically verified by on-scene personnel.

### Layer 7: Safe Evacuation Decision Support Layer (`ai/evacuation.py`)
- **Role**: Computes shortest safe paths to emergency exits avoiding active hazard zones and blocked corridors using Dijkstra pathfinding on verified map topologies.
- **Safety Boundary**: Explicitly flags `"NO SAFE ROUTE VERIFIED"` when all paths are compromised, recommending immediate shelter-in-place.

### Layer 8: Safety, Oversight & Dynamic Reassessment Layer (`ai/reassessment.py`)
- **Role**: Re-evaluates incident status when new facts, occupancy data, or hazard developments arrive. Bumps `assessment_version` and preserves an auditable change log.
