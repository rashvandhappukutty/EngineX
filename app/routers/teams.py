from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.teams import (
    TeamCreate,
    TeamAvailabilityUpdate,
    TeamResponse,
    TeamAvailabilityStatus,
)
from app.schemas.assignments import AssignmentResponse
from app.services.team_service import team_service

router = APIRouter(prefix="/teams", tags=["Response Team Management"])


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED, summary="Register a Response Team")
def create_team(
    team_in: TeamCreate,
    db: Session = Depends(get_db),
):
    return team_service.create_team(db, team_in)


@router.get("", response_model=List[TeamResponse], summary="List and Filter Response Teams")
def list_teams(
    status_filter: Optional[TeamAvailabilityStatus] = Query(None, alias="status"),
    capability: Optional[str] = Query(None, description="Filter by capability substring"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return team_service.list_teams(db, status_filter=status_filter, capability_filter=capability, skip=skip, limit=limit)


@router.get("/{team_id}", response_model=TeamResponse, summary="Get Team Details")
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
):
    return team_service.get_team(db, team_id)


@router.patch("/{team_id}/availability", response_model=TeamResponse, summary="Update Team Availability Status")
async def update_team_availability(
    team_id: int,
    update_in: TeamAvailabilityUpdate,
    db: Session = Depends(get_db),
):
    return await team_service.update_team_availability(db, team_id, update_in)


@router.get("/{team_id}/assignments", response_model=List[AssignmentResponse], summary="Get Team Assignments")
def get_team_assignments(
    team_id: int,
    db: Session = Depends(get_db),
):
    return team_service.get_team_assignments(db, team_id)
