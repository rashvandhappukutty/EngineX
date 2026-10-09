# CampusOne AI — Intelligence Module Documentation (`EngineX`)

## 1. Overview & Architecture

The **CampusOne AI** Intelligence Module is a high-performance, deterministic triage engine for college helpdesks and campus incident management. It processes complaints and incident reports, classifies them into operational categories, estimates urgency and life-safety risks, assigns responsible departments, and recommends human escalation protocols.

### Design Principles
- **Self-Contained & Deterministic**: Zero external runtime dependencies, no paid API keys, and no cloud/network calls required.
- **Explainable & Transparent**: Every decision provides step-by-step reasoning showing triggered rules, matched signals, and confidence calculations.
- **Safety First (Safety Floor)**: Life-safety hazards (fire, gas leaks, acid spills, severe injury) enforce a strict priority floor (score $\ge 85$), preventing any critical report from being suppressed by low overall word counts.
- **Human-in-the-Loop Safeguards**: Emergency escalation paths generate actionable recommendations for authorized human staff. The engine never claims automated external dispatch (e.g. 911 / fire brigade).

---

## 2. Directory & File Structure

```text
ai/
├── __init__.py          # Public package exports (analyze_complaint, batch_analyze_complaints, etc.)
├── schemas.py           # Enums, dataclasses, and output serialization schemas
├── rules.py             # Keyword dictionaries, safety triggers, and scoring weights
├── classifier.py        # Tokenizer, typo tolerance, multi-category scoring, and confidence
├── priority.py          # Priority scoring, safety floor enforcement, and disruption multipliers
├── escalation.py        # Escalation tier evaluation and simulated workflow actions
└── engine.py            # Orchestrator integrating classifier, priority, and escalation

tests/
├── __init__.py
├── test_classifier.py   # Unit tests for category classification and typo tolerance
├── test_priority.py     # Unit tests for urgency scoring, safety floors, and boundary conditions
├── test_escalation.py   # Unit tests for escalation tiers and disclaimer compliance
└── test_engine.py       # End-to-end integration, batch processing, and JSON schema contract tests

docs/
└── ai-module.md         # Comprehensive architecture and integration guide
```

---

## 3. How the Subsystems Work

### A. Complaint Classification (`ai/classifier.py`)
1. **Normalization**: Lowercases text, cleans punctuation, and tokenizes into words while preserving essential compound phrases.
2. **Matching Strategy**:
   - **Exact Phrase Matching**: e.g., `"wifi outage"`, `"chemistry lab"`, `"switchboard sparking"`.
   - **Exact Token Matching**: Matches single domain tokens against weighted category registries.
   - **Spelling Variation / Typo Tolerance**: For tokens $\ge 5$ characters, uses bounded sequence matching to catch common misspellings (e.g., `"intrnett"`, `"profesor"`, `"plubming"`).
3. **Ambiguity & Confidence Heuristic**:
   - Computes weighted score totals across all 8 target categories.
   - If the runner-up category is within 30% of the top category score and score $\ge 2.0$, the incident is flagged as `is_ambiguous = True` with confidence capped at 0.60.
   - Unmatched or empty text routes to `General / Unknown` with confidence `0.0`.
   - *Honesty Note*: Confidence is a transparent heuristic based on keyword density and category separation—it is not an empirical ML probability.

#### Supported Categories & Department Mappings:
| Category | Assigned Department |
| :--- | :--- |
| `IT and Network` | `IT Support` |
| `Maintenance and Electrical` | `Estate & Maintenance` |
| `Housekeeping and Sanitation` | `Housekeeping & Sanitation` |
| `Transport` | `Transport Office` |
| `Security` | `Campus Security` |
| `Academic Administration` | `Academic Affairs` |
| `Laboratory` | `Laboratory Management` |
| `Medical and Safety` | `Campus Health & Safety` |
| `General / Unknown` | `Helpdesk General Triage` |

---

### B. Priority Scoring & Safety Risk Assessment (`ai/priority.py`)
Computes an integer score from `0` to `100` and assigns one of four tiers:
- **Critical (80–100)**: Immediate life safety or severe structural risk.
- **High (60–79)**: Major disruption (exam hall outage, entire building blackout, stuck elevator) or urgent safety risk.
- **Medium (35–59)**: Standard operational ticket for scheduled department SLA.
- **Low (0–34)**: Minor cosmetic issue, feedback, or suggestion.

#### Safety Floor Logic:
If any critical safety hazard is detected (e.g. fire, smoke, explosion, gas leak, acid/chemical spill, unconscious student, active brawl/ragging), the **Safety Floor** guarantees a priority score $\ge 88$ (`Critical`) and forces `requires_human_review = True`, regardless of other modifiers.

---

### C. Escalation Engine (`ai/escalation.py`)
Evaluates operational urgency and flags incidents for staff review:
- **`Emergency review` (`escalate = True`)**: Triggered for `Critical` priority and life-safety hazards.
- **`Urgent review` (`escalate = True`)**: Triggered for `High` priority and major disruptions.
- **`Standard review` (`escalate = False`)**: For `Medium` priority tickets and ambiguous/low-confidence classifications.
- **`No escalation` (`escalate = False`)**: For `Low` priority tickets.

> **Safety Notice on Simulated Workflows**: All escalation actions state recommended protocols for authorized campus personnel. The engine does not interact with external emergency services.

---

## 4. Public API & Integration Contract

### Main Analysis Function
```python
from ai import analyze_complaint

result = analyze_complaint(
    title="Wi-Fi outage in Block A",
    description="Internet connection is completely down during the online semester exam.",
    location="Block A, Room 302"
)
```

### Batch Analysis Function
```python
from ai import batch_analyze_complaints

results = batch_analyze_complaints([
    {"title": "Broken bench", "description": "Wooden bench broken in garden", "location": "Garden"},
    {"title": "Gas leak", "description": "Smell of LPG gas in canteen", "location": "Canteen"},
])
```

### Output JSON Schema
```json
{
  "category": "IT and Network",
  "assigned_department": "IT Support",
  "classification_confidence": 0.85,
  "priority": "High",
  "priority_score": 75,
  "reason": "Substantial service disruption indicators detected",
  "requires_human_review": true,
  "escalation": {
    "escalate": true,
    "level": "Urgent review",
    "reason": "High-priority issue requires expedited staff assessment",
    "recommended_action": "Route to IT Support priority queue. Staff assessment recommended within 1 to 2 hours."
  },
  "explanation": [
    "Classified as 'IT and Network' based on strong keyword signals: internet, wifi. Assigned to IT Support.",
    "Priority evaluated as High (Score: 75/100). Substantial service disruption indicators detected. Triggered rules: Base priority for 'IT and Network': 35 pts; Service disruption trigger 'during exam': +25 pts; Urgency indicator 'emergency': +25 pts.",
    "Escalation flagged (Urgent review): High-priority issue requires expedited staff assessment.",
    "Human review required: High priority or operational tier requires staff validation."
  ]
}
```

---

## 5. FastAPI Integration Guide

The backend teammate can integrate the AI module into FastAPI endpoints as follows:

```python
# backend/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from ai import analyze_complaint, batch_analyze_complaints

app = FastAPI(title="CampusOne AI Backend")

class ComplaintRequest(BaseModel):
    title: str
    description: str
    location: Optional[str] = None

class BatchComplaintRequest(BaseModel):
    complaints: List[ComplaintRequest]

@app.post("/api/complaints/analyze")
async def analyze_single_complaint(payload: ComplaintRequest):
    try:
        return analyze_complaint(
            title=payload.title,
            description=payload.description,
            location=payload.location
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(exc)}")

@app.post("/api/complaints/analyze-batch")
async def analyze_multiple_complaints(payload: BatchComplaintRequest):
    try:
        items = [c.model_dump() for c in payload.complaints]
        return batch_analyze_complaints(items)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Batch AI analysis failed: {str(exc)}")
```

---

## 6. Uncertainty & Edge Cases Handling

1. **Uncertain / Low Confidence Reports**: If confidence falls below `0.50` or the report matches multiple conflicting categories, `requires_human_review` is set to `True`, and the ticket is routed to `Helpdesk General Triage`.
2. **Ambiguous Complaints**: If keywords from both IT and Electrical match (e.g. "sparking switchboard near server router"), the secondary categories are surfaced in the explanation.
3. **Empty or Invalid Input**: Passing `None`, empty strings, or non-string types safely returns `General / Unknown` with confidence `0.0` without raising unhandled exceptions.

---

## 7. Known Limitations of Keyword & Rule-Based Baselines

1. **Context & Sarcasm**: Keyword rules do not capture complex negation, sarcastic remarks (e.g. *"The Wi-Fi speed is amazingly lightning fast... not"*), or deeply nuanced phrasing.
2. **Novel Terminology**: Terminology or acronyms not included in `rules.py` fall back to `General / Unknown`.
3. **Evolving Campus Infrastructure**: As new buildings, equipment, or labs are added, corresponding entries should be registered in `ai/rules.py`.
4. **Upgrading to Machine Learning / LLMs**: The modular design allows swapping `ai/classifier.py` with an embedding/transformer classifier (or LLM triage agent) in the future while retaining the identical `analyze_complaint` interface and schema contract.

---

## 8. Installation and Testing

### Prerequisites
- Python 3.11+
- `pytest`

### Running the Test Suite
```bash
# Run all automated tests with verbose output
pytest -v

# Run with test coverage (optional)
pytest -v --cov=ai
```
