"""AI Intelligence & Crisis Coordination Router exposing CampusOne AI engine endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ai.engine import analyze_situation, analyze_complaint, batch_analyze_complaints
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI Crisis Intelligence"])


class IncidentAnalysisRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Short incident summary")
    description: str = Field(..., min_length=1, description="Detailed incident narrative")
    incident_id: Optional[str] = Field(None, description="Optional unique identifier")
    location: Optional[str] = Field(None, description="Reported campus location")
    reporter_role: Optional[str] = Field(None, description="Role of the reporter (e.g., student, faculty, staff)")
    campus_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Active hazard zones, exams, blocked paths")
    resources: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Available responder teams and equipment")
    related_incidents: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Concurrent active reports")
    map_data: Optional[Dict[str, Any]] = Field(None, description="Campus graph topology")


class ComplaintAnalysisRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    location: Optional[str] = None


@router.post(
    "/analyze-situation",
    summary="Comprehensive Multi-Layer Situation & Crisis Analysis",
    response_description="Structured JSON result with classification, risk, actions, resources, and evacuation",
)
async def analyze_campus_situation(req: IncidentAnalysisRequest) -> Dict[str, Any]:
    """
    Execute full CampusOne AI crisis coordination analysis.
    Combines NLU understanding with authoritative deterministic safety floors and decision support.
    """
    try:
        report_payload = {
            "title": req.title,
            "description": req.description,
            "incident_id": req.incident_id,
            "location": req.location,
            "reporter_role": req.reporter_role,
        }
        return analyze_situation(
            report=report_payload,
            campus_context=req.campus_context,
            resources=req.resources,
            related_incidents=req.related_incidents,
            map_data=req.map_data,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI situation analysis failed: {str(exc)}",
        )


@router.post(
    "/classify-incident",
    summary="Classify Incident and Estimate Triage Priority",
    response_description="Standard 9-field triage output",
)
async def classify_campus_incident(req: ComplaintAnalysisRequest) -> Dict[str, Any]:
    """Execute focused complaint triage and department routing."""
    try:
        return analyze_complaint(
            title=req.title,
            description=req.description,
            location=req.location,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI classification failed: {str(exc)}",
        )
