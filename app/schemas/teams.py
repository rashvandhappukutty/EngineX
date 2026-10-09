from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


class TeamAvailabilityStatus(str, Enum):
    AVAILABLE = "Available"
    ON_MISSION = "On_Mission"
    OFF_DUTY = "Off_Duty"
    MAINTENANCE = "Maintenance"


class TeamBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, json_schema_extra={"example": "Alpha Fire Response Team"})
    capabilities: List[str] = Field(..., json_schema_extra={"example": ["firefighting", "first_aid", "evacuation"]})
    contact_info: Optional[str] = Field(None, json_schema_extra={"example": "Dispatcher ext 501 / radio channel 4"})

    @field_validator("capabilities", mode="before")
    @classmethod
    def validate_capabilities(cls, v):
        if isinstance(v, str):
            return [cap.strip() for cap in v.split(",") if cap.strip()]
        return v


class TeamCreate(TeamBase):
    availability_status: Optional[TeamAvailabilityStatus] = TeamAvailabilityStatus.AVAILABLE


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    capabilities: Optional[List[str]] = None
    contact_info: Optional[str] = None
    availability_status: Optional[TeamAvailabilityStatus] = None


class TeamAvailabilityUpdate(BaseModel):
    availability_status: TeamAvailabilityStatus


class TeamResponse(BaseModel):
    id: int
    name: str
    capabilities: List[str]
    availability_status: TeamAvailabilityStatus
    contact_info: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("capabilities", mode="before")
    @classmethod
    def parse_capabilities_str(cls, v):
        if isinstance(v, str):
            return [cap.strip() for cap in v.split(",") if cap.strip()]
        return v
