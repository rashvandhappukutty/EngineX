# CampusOne AI — Integration Contract & API Specification

## 1. Master Public Function

### `analyze_situation(report, campus_context=None, resources=None, related_incidents=None, map_data=None, config=None)`

#### Input Parameters:
- `report` (Union[`IncidentReport`, `dict`, `str`]):
  - `title`: str (Required)
  - `description`: str (Required)
  - `incident_id`: Optional[str]
  - `location`: Optional[str]
  - `reporter_role`: Optional[str]
- `campus_context` (Optional[dict]):
  - `hazard_zones`: List[str]
  - `blocked_paths`: List[str]
  - `requires_accessible`: bool
  - `active_exams`: bool
- `resources` (Optional[List[dict]]): Available responder records.
- `related_incidents` (Optional[List[dict]]): Concurrent campus reports.
- `map_data` (Optional[dict]): Approved campus graph topology (`nodes`, `edges`, `exits`).

#### Output Schema:
```json
{
  "incident_id": "inc_a1b2c3d4",
  "categories": ["IT and Network", "Maintenance and Electrical"],
  "summary": "Switchboard sparking and internet router offline in Computer Lab",
  "affected_location": "Computer Lab 1",
  "risk_assessment": {
    "priority": "High",
    "risk_score": 75,
    "priority_score": 75,
    "risk_factors": [
      "Base operational category (IT and Network): 35 pts",
      "High-risk safety indicator detected: 'sparking'",
      "High-occupancy / high-risk zone 'computer lab': +15 pts"
    ],
    "reasoning_summary": "Priority evaluated as High (Risk Score: 75/100, Uncertainty: Low). High-risk safety or operational hazard requiring expedited staff assessment.",
    "uncertainty_level": "Low",
    "requires_human_review": true,
    "missing_information": [],
    "is_safety_critical": false,
    "potential_harm_level": "Moderate to Severe",
    "immediacy_of_danger": "Impending"
  },
  "recommended_department": "IT Support",
  "recommended_actions": [
    {
      "step": 1,
      "action": "Dispatch senior technician or supervisor from IT Support to assess and isolate the fault.",
      "target_role_or_team": "IT Support Rapid Response",
      "prerequisites": ["Assign available technician with relevant domain skill"],
      "required_capabilities": ["Domain Diagnostics", "System Isolation"],
      "escalation_triggers": ["Safety hazard escalates to critical"],
      "safe_alternatives": ["Reroute traffic or supply through redundant lines where available"],
      "rationale": "High-priority disruptions require expedited diagnostics to minimize operational loss."
    }
  ],
  "resource_recommendations": {
    "matched_resources": [
      {
        "resource_id": "tech_01",
        "type": "personnel",
        "team": "IT Support",
        "location": "Computer Lab 1",
        "workload": 0,
        "readiness": "Ready",
        "suitability_score": 85.0
      }
    ],
    "unmet_requirements": [],
    "status_summary": "Found 1 suitable candidate resource(s)",
    "competing_demands": [],
    "recommendation_note": "Top recommended resource: tech_01 (IT Support)."
  },
  "related_incidents": [],
  "evacuation_recommendation": {
    "is_evacuation_advised": false,
    "safe_route_verified": false,
    "routes": [],
    "blocked_or_hazardous_zones": [],
    "accessibility_notes": [],
    "limitations_and_disclaimers": [
      "Advisory Decision Support Only: Evacuation orders require official broadcast by authorized campus personnel."
    ],
    "rationale": "Evacuation not required for localized non-life-safety operational fault."
  },
  "uncertainty": {
    "level": "Low",
    "nlu_confidence": 0.85,
    "classification_confidence": 0.80,
    "missing_information": [],
    "conflicting_elements": [],
    "is_unfamiliar": false
  },
  "requires_human_review": true,
  "explanation": [
    "Classified as 'IT and Network' based on keyword signals: router, internet.",
    "Priority evaluated as High (Risk Score: 75/100, Uncertainty: Low).",
    "Recommended Action: Urgent review — High-priority issue requires expedited staff assessment.",
    "Resource Coordination: Found 1 suitable candidate resource(s)."
  ],
  "assessment_version": 1,
  "timestamp": 1728456000.0
}
```

---

## 2. Layer Sub-Functions

```python
from ai import (
    assess_risk,
    recommend_response,
    match_resources,
    analyze_incident_relationships,
    recommend_evacuation_routes,
    reassess_situation,
)
```

---

## 3. FastAPI Backend Integration Example

```python
# backend/app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ai import analyze_situation, reassess_situation

app = FastAPI(title="CampusOne AI Emergency Coordination Backend")

class IncidentPayload(BaseModel):
    title: str
    description: str
    incident_id: Optional[str] = None
    location: Optional[str] = None
    reporter_role: Optional[str] = None

class AnalysisRequest(BaseModel):
    report: IncidentPayload
    campus_context: Optional[Dict[str, Any]] = None
    resources: Optional[List[Dict[str, Any]]] = None
    related_incidents: Optional[List[Dict[str, Any]]] = None
    map_data: Optional[Dict[str, Any]] = None

@app.post("/api/incidents/analyze")
async def process_incident(req: AnalysisRequest):
    try:
        return analyze_situation(
            report=req.report.model_dump(),
            campus_context=req.campus_context,
            resources=req.resources,
            related_incidents=req.related_incidents,
            map_data=req.map_data,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(exc)}")
```
