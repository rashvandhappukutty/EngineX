from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AssignmentHistory
from app.schemas.assignments import (
    AssignmentCreate,
    AssignmentStatusUpdate,
    AssignmentResponse,
    AssignmentListResponse,
    AssignmentHistoryResponse,
)
from app.services.assignment_service import assignment_service

router = APIRouter(prefix="/assignments", tags=["Response Assignments"])


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED, summary="Assign Response Team to Incident")
async def create_assignment(
    assignment_in: AssignmentCreate,
    db: Session = Depends(get_db),
):
    return await assignment_service.create_assignment(db, assignment_in)


@router.get("", response_model=AssignmentListResponse, summary="List Team Assignments")
def list_assignments(
    incident_id: Optional[int] = Query(None, description="Filter by incident ID"),
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    db: Session = Depends(get_db),
):
    items = assignment_service.list_assignments(db, incident_id=incident_id, team_id=team_id)
    return AssignmentListResponse(total=len(items), items=items)


@router.get("/{assignment_id}", response_model=AssignmentResponse, summary="Get Assignment Details")
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    return assignment_service.get_assignment(db, assignment_id)


@router.patch("/{assignment_id}/status", response_model=AssignmentResponse, summary="Update Assignment Status")
async def update_assignment_status(
    assignment_id: int,
    update_in: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
):
    return await assignment_service.update_assignment_status(db, assignment_id, update_in)


@router.get("/{assignment_id}/history", response_model=List[AssignmentHistoryResponse], summary="Get Assignment Audit History")
def get_assignment_history(
    assignment_id: int,
    db: Session = Depends(get_db),
):
    assignment_service.get_assignment(db, assignment_id)
    return db.query(AssignmentHistory).filter(AssignmentHistory.assignment_id == assignment_id).order_by(AssignmentHistory.changed_at.desc()).all()
