from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class LocationType(str, Enum):
    BUILDING = "Building"
    BLOCK = "Block"
    CORRIDOR = "Corridor"
    ASSEMBLY_AREA = "Assembly Area"
    GATE = "Gate"
    PARKING = "Parking"
    OTHER = "Other"


class OperationalState(str, Enum):
    OPERATIONAL = "Operational"
    RESTRICTED = "Restricted"
    CLOSED = "Closed"


class LocationBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, json_schema_extra={"example": "BLD-ENG"})
    name: str = Field(..., min_length=2, max_length=255, json_schema_extra={"example": "Engineering Building"})
    location_type: LocationType = Field(..., json_schema_extra={"example": "Building"})
    description: Optional[str] = Field(None, json_schema_extra={"example": "Main 4-story engineering complex"})
    operational_state: OperationalState = Field(OperationalState.OPERATIONAL)
    is_blocked: bool = Field(False)


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    location_type: Optional[LocationType] = None
    description: Optional[str] = None
    operational_state: Optional[OperationalState] = None
    is_blocked: Optional[bool] = None


class HazardBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, json_schema_extra={"example": "Gas Leak in Basement"})
    location_id: int = Field(..., json_schema_extra={"example": 1})
    hazard_type: str = Field(..., json_schema_extra={"example": "Gas Leak"})
    severity: str = Field(..., json_schema_extra={"example": "High"})
    description: Optional[str] = Field(None, json_schema_extra={"example": "Smell of gas detected near boiler room."})
    is_active: bool = Field(True)


class HazardCreate(HazardBase):
    pass


class HazardUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class HazardResponse(HazardBase):
    id: int
    reported_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LocationResponse(LocationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    active_hazards: List[HazardResponse] = []

    model_config = ConfigDict(from_attributes=True)


class LocationEdgeBase(BaseModel):
    source_id: int
    target_id: int
    distance_meters: float = Field(..., gt=0, json_schema_extra={"example": 45.5})
    is_bidirectional: bool = Field(True)
    is_blocked: bool = Field(False)
    notes: Optional[str] = Field(None, json_schema_extra={"example": "Covered walkway"})


class LocationEdgeCreate(LocationEdgeBase):
    pass


class LocationEdgeResponse(LocationEdgeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class CampusGraphResponse(BaseModel):
    locations: List[LocationResponse]
    edges: List[LocationEdgeResponse]
    active_hazards: List[HazardResponse]
    disclaimer: str
