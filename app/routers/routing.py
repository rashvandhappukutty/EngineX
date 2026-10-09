from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.routing import RouteRequest, RouteResponse
from app.services.routing_service import routing_service

router = APIRouter(prefix="/routing", tags=["Route Computation"])


@router.post(
    "/calculate-route",
    response_model=RouteResponse,
    summary="Compute Evacuation or Navigation Route excluding hazards",
    description=(
        "Computes shortest path between campus locations using Dijkstra's algorithm. "
        "Excludes active hazards and blocked edges when requested. "
        "Every response includes prototype warnings and disclaimers."
    ),
)
def calculate_route(
    request: RouteRequest,
    db: Session = Depends(get_db),
):
    return routing_service.compute_route(db, request)
