from typing import List, Optional
from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    origin_id: int = Field(..., description="ID of the starting campus location", json_schema_extra={"example": 1})
    destination_id: int = Field(..., description="ID of the target destination campus location", json_schema_extra={"example": 5})
    avoid_hazards: bool = Field(True, description="Exclude active hazard locations and blocked edges from routing")


class RouteStep(BaseModel):
    step_number: int
    location_id: int
    location_code: str
    location_name: str
    distance_from_previous_meters: float


class RouteResponse(BaseModel):
    origin_id: int
    destination_id: int
    route_found: bool
    path: List[RouteStep]
    total_distance_meters: float
    warnings: List[str]
    is_prototype_recommendation: bool = True
    disclaimer: str
