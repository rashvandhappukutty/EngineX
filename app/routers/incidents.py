from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import IncidentHistory
from app.schemas.incidents import (
    IncidentCreate,
    IncidentStatusUpdate,
    IncidentResponse,
    IncidentListResponse,
    IncidentHistoryResponse,
    IncidentStatus,
    IncidentSeverity,
    IncidentCategory,
)
from app.services.incident_service import incident_service

router = APIRouter(prefix="/reports", tags=["Incident Management"])


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED, summary="Report an Incident")
async def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
):
    return await incident_service.create_incident(db, incident_in)


@router.get("", response_model=IncidentListResponse, summary="List Incidents with Filtering and Pagination")
def list_incidents(
    status_filter: Optional[IncidentStatus] = Query(None, alias="status", description="Filter by status"),
    severity_filter: Optional[IncidentSeverity] = Query(None, alias="severity", description="Filter by severity"),
    category_filter: Optional[IncidentCategory] = Query(None, alias="category", description="Filter by category"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    skip: int = Query(0, ge=0, description="Items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
):
    items, total = incident_service.list_incidents(
        db,
        status_filter=status_filter,
        severity_filter=severity_filter,
        category_filter=category_filter,
        location_id_filter=location_id,
        skip=skip,
        limit=limit,
    )
    return IncidentListResponse(
        total=total,
        page=(skip // limit) + 1 if limit > 0 else 1,
        page_size=len(items),
        items=items,
    )


@router.get("/{report_id}", response_model=IncidentResponse, summary="Get Incident Details")
def get_incident(
    report_id: int,
    db: Session = Depends(get_db),
):
    return incident_service.get_incident(db, report_id)


@router.patch("/{report_id}/status", response_model=IncidentResponse, summary="Update Incident Status")
async def update_incident_status(
    report_id: int,
    update_in: IncidentStatusUpdate,
    db: Session = Depends(get_db),
):
    return await incident_service.update_incident_status(db, report_id, update_in)


@router.get("/{report_id}/history", response_model=List[IncidentHistoryResponse], summary="Get Incident Audit History")
def get_incident_history(
    report_id: int,
    db: Session = Depends(get_db),
):
    incident_service.get_incident(db, report_id)
    return db.query(IncidentHistory).filter(IncidentHistory.incident_id == report_id).order_by(IncidentHistory.changed_at.desc()).all()
