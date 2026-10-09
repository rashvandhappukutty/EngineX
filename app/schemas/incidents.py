from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class IncidentCategory(str, Enum):
    FIRE = "Fire"
    MEDICAL = "Medical"
    SECURITY = "Security"
    INFRASTRUCTURE = "Infrastructure"
    NATURAL_HAZARD = "Natural hazard"
    OTHER = "Other"


class IncidentSeverity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class IncidentStatus(str, Enum):
    REPORTED = "Reported"
    INVESTIGATING = "Investigating"
    RESPONDING = "Responding"
    RESOLVED = "Resolved"
    CANCELLED = "Cancelled"


VALID_INCIDENT_TRANSITIONS = {
    IncidentStatus.REPORTED: {IncidentStatus.INVESTIGATING, IncidentStatus.RESPONDING, IncidentStatus.RESOLVED, IncidentStatus.CANCELLED},
    IncidentStatus.INVESTIGATING: {IncidentStatus.RESPONDING, IncidentStatus.RESOLVED, IncidentStatus.CANCELLED},
    IncidentStatus.RESPONDING: {IncidentStatus.RESOLVED, IncidentStatus.CANCELLED},
    IncidentStatus.RESOLVED: {IncidentStatus.INVESTIGATING},  # Reopen if needed
    IncidentStatus.CANCELLED: set(),
}


class IncidentBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, json_schema_extra={"example": "Water Pipe Leak in Admin Block"})
    description: str = Field(..., min_length=5, json_schema_extra={"example": "Main water riser burst near entrance."})
    category: IncidentCategory = Field(..., json_schema_extra={"example": "Infrastructure"})
    severity: IncidentSeverity = Field(..., json_schema_extra={"example": "Medium"})
    location_id: Optional[int] = Field(None, json_schema_extra={"example": 1})
    location_name: str = Field(..., min_length=2, max_length=255, json_schema_extra={"example": "Admin Building Floor 1"})
    reporter_metadata: Optional[str] = Field(None, json_schema_extra={"example": "Student Rep ID 4921"})


class IncidentCreate(IncidentBase):
    pass


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus
    reason: Optional[str] = Field(None, description="Reason for status update")


class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=5)
    category: Optional[IncidentCategory] = None
    severity: Optional[IncidentSeverity] = None
    location_id: Optional[int] = None
    location_name: Optional[str] = None
    reporter_metadata: Optional[str] = None


class IncidentHistoryResponse(BaseModel):
    id: int
    incident_id: int
    previous_status: Optional[str] = None
    new_status: str
    change_reason: Optional[str] = None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentResponse(IncidentBase):
    id: int
    status: IncidentStatus
    priority_score: float
    ai_suggested_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    history: List[IncidentHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)


class IncidentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[IncidentResponse]
