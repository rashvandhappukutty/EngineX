from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.incidents import IncidentResponse
from app.schemas.teams import TeamResponse


class AssignmentStatus(str, Enum):
    ASSIGNED = "Assigned"
    DISPATCHED = "Dispatched"
    ON_SCENE = "On_Scene"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


VALID_ASSIGNMENT_TRANSITIONS = {
    AssignmentStatus.ASSIGNED: {AssignmentStatus.DISPATCHED, AssignmentStatus.CANCELLED},
    AssignmentStatus.DISPATCHED: {AssignmentStatus.ON_SCENE, AssignmentStatus.CANCELLED},
    AssignmentStatus.ON_SCENE: {AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED},
    AssignmentStatus.COMPLETED: set(),  # Final state
    AssignmentStatus.CANCELLED: set(),  # Final state
}


class AssignmentCreate(BaseModel):
    incident_id: int = Field(..., description="ID of the incident to assign", json_schema_extra={"example": 1})
    team_id: int = Field(..., description="ID of the response team to assign", json_schema_extra={"example": 1})
    notes: Optional[str] = Field(None, json_schema_extra={"example": "Initial dispatch order issued"})


class AssignmentStatusUpdate(BaseModel):
    status: AssignmentStatus
    notes: Optional[str] = Field(None, description="Notes on status update")


class AssignmentHistoryResponse(BaseModel):
    id: int
    assignment_id: int
    previous_status: Optional[str] = None
    new_status: str
    notes: Optional[str] = None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssignmentResponse(BaseModel):
    id: int
    incident_id: int
    team_id: int
    status: AssignmentStatus
    notes: Optional[str] = None
    assigned_at: datetime
    updated_at: datetime
    incident: Optional[IncidentResponse] = None
    team: Optional[TeamResponse] = None
    history: List[AssignmentHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)


class AssignmentListResponse(BaseModel):
    total: int
    items: List[AssignmentResponse]
