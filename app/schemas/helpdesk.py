from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class HelpdeskCategory(str, Enum):
    IT_SUPPORT = "IT support"
    FACILITIES = "Facilities"
    MAINTENANCE = "Maintenance"
    ADMINISTRATION = "Administration"
    SECURITY = "Security"
    OTHER = "Other"


class HelpdeskPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"


class HelpdeskStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In_Progress"
    PENDING = "Pending"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class HelpdeskDepartment(str, Enum):
    IT = "IT"
    FACILITIES = "Facilities"
    MAINTENANCE = "Maintenance"
    SECURITY = "Security"
    ADMINISTRATION = "Administration"
    OPERATIONS = "Operations"
    GENERAL = "General"


VALID_HELPDESK_TRANSITIONS = {
    HelpdeskStatus.OPEN: {HelpdeskStatus.IN_PROGRESS, HelpdeskStatus.RESOLVED, HelpdeskStatus.CLOSED},
    HelpdeskStatus.IN_PROGRESS: {HelpdeskStatus.PENDING, HelpdeskStatus.RESOLVED, HelpdeskStatus.CLOSED},
    HelpdeskStatus.PENDING: {HelpdeskStatus.IN_PROGRESS, HelpdeskStatus.RESOLVED, HelpdeskStatus.CLOSED},
    HelpdeskStatus.RESOLVED: {HelpdeskStatus.CLOSED, HelpdeskStatus.IN_PROGRESS},  # Reopen if needed
    HelpdeskStatus.CLOSED: {HelpdeskStatus.OPEN},  # Reopen
}


class HelpdeskRequestBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, json_schema_extra={"example": "WiFi not connecting in Library Floor 2"})
    description: str = Field(..., min_length=5, json_schema_extra={"example": "Access point drops connection repeatedly."})
    category: Optional[HelpdeskCategory] = Field(None, json_schema_extra={"example": "IT support"}, description="Category (auto-classified if omitted)")
    priority: Optional[HelpdeskPriority] = Field(HelpdeskPriority.MEDIUM, json_schema_extra={"example": "Medium"})
    location_id: Optional[int] = Field(None, json_schema_extra={"example": 2})
    location_name: Optional[str] = Field(None, json_schema_extra={"example": "Main Library Floor 2"})
    reporter_metadata: Optional[str] = Field(None, json_schema_extra={"example": "Student 2024881"})


class HelpdeskRequestCreate(HelpdeskRequestBase):
    pass


class HelpdeskRequestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=5)
    category: Optional[HelpdeskCategory] = None
    priority: Optional[HelpdeskPriority] = None
    assigned_department: Optional[HelpdeskDepartment] = None
    location_id: Optional[int] = None
    location_name: Optional[str] = None


class HelpdeskStatusUpdate(BaseModel):
    status: HelpdeskStatus
    reason: Optional[str] = Field(None, description="Reason for status change")


class HelpdeskDepartmentAssign(BaseModel):
    department: HelpdeskDepartment
    reason: Optional[str] = Field(None, description="Reason for department re-assignment")


class HelpdeskHistoryResponse(BaseModel):
    id: int
    request_id: int
    previous_status: Optional[str] = None
    new_status: str
    previous_department: Optional[str] = None
    new_department: Optional[str] = None
    notes: Optional[str] = None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HelpdeskRequestResponse(BaseModel):
    id: int
    title: str
    description: str
    category: HelpdeskCategory
    priority: HelpdeskPriority
    status: HelpdeskStatus
    assigned_department: HelpdeskDepartment
    location_id: Optional[int] = None
    location_name: Optional[str] = None
    reporter_metadata: Optional[str] = None
    is_emergency_flagged: bool = False
    created_at: datetime
    updated_at: datetime
    history: List[HelpdeskHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)


class HelpdeskRequestListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[HelpdeskRequestResponse]
