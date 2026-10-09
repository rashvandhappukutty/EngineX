from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import HelpdeskHistory
from app.schemas.helpdesk import (
    HelpdeskRequestCreate,
    HelpdeskStatusUpdate,
    HelpdeskDepartmentAssign,
    HelpdeskRequestResponse,
    HelpdeskRequestListResponse,
    HelpdeskHistoryResponse,
    HelpdeskStatus,
    HelpdeskCategory,
    HelpdeskPriority,
    HelpdeskDepartment,
)
from app.services.helpdesk_service import helpdesk_service

router = APIRouter(prefix="/helpdesk", tags=["Campus Helpdesk (PS 14 Integration)"])


@router.post("/requests", response_model=HelpdeskRequestResponse, status_code=status.HTTP_201_CREATED, summary="Submit Helpdesk Service Request")
async def create_request(
    req_in: HelpdeskRequestCreate,
    db: Session = Depends(get_db),
):
    return await helpdesk_service.create_request(db, req_in)


@router.get("/requests", response_model=HelpdeskRequestListResponse, summary="List and Filter Helpdesk Requests")
def list_requests(
    status_filter: Optional[HelpdeskStatus] = Query(None, alias="status"),
    category_filter: Optional[HelpdeskCategory] = Query(None, alias="category"),
    priority_filter: Optional[HelpdeskPriority] = Query(None, alias="priority"),
    department_filter: Optional[HelpdeskDepartment] = Query(None, alias="department"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    items, total = helpdesk_service.list_requests(
        db,
        status_filter=status_filter,
        category_filter=category_filter,
        priority_filter=priority_filter,
        department_filter=department_filter,
        skip=skip,
        limit=limit,
    )
    return HelpdeskRequestListResponse(
        total=total,
        page=(skip // limit) + 1 if limit > 0 else 1,
        page_size=len(items),
        items=items,
    )


@router.get("/requests/{request_id}", response_model=HelpdeskRequestResponse, summary="Get Helpdesk Request Details")
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    return helpdesk_service.get_request(db, request_id)


@router.patch("/requests/{request_id}/status", response_model=HelpdeskRequestResponse, summary="Update Helpdesk Request Status")
async def update_request_status(
    request_id: int,
    update_in: HelpdeskStatusUpdate,
    db: Session = Depends(get_db),
):
    return await helpdesk_service.update_request_status(db, request_id, update_in)


@router.patch("/requests/{request_id}/assign", response_model=HelpdeskRequestResponse, summary="Reassign Responsible Department")
async def assign_department(
    request_id: int,
    assign_in: HelpdeskDepartmentAssign,
    db: Session = Depends(get_db),
):
    return await helpdesk_service.assign_department(db, request_id, assign_in)


@router.get("/requests/{request_id}/history", response_model=List[HelpdeskHistoryResponse], summary="Get Request Audit History")
def get_request_history(
    request_id: int,
    db: Session = Depends(get_db),
):
    helpdesk_service.get_request(db, request_id)
    return db.query(HelpdeskHistory).filter(HelpdeskHistory.request_id == request_id).order_by(HelpdeskHistory.changed_at.desc()).all()
