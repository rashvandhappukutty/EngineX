import logging
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import HelpdeskRequest, HelpdeskHistory, Location
from app.schemas.helpdesk import (
    HelpdeskRequestCreate,
    HelpdeskRequestUpdate,
    HelpdeskStatusUpdate,
    HelpdeskDepartmentAssign,
    HelpdeskStatus,
    HelpdeskCategory,
    HelpdeskPriority,
    HelpdeskDepartment,
    VALID_HELPDESK_TRANSITIONS,
)
from app.services.classification_service import classification_service
from app.services.notification_service import notification_manager

logger = logging.getLogger("enginex.helpdesk_service")


class HelpdeskService:
    @staticmethod
    def get_request(db: Session, request_id: int) -> HelpdeskRequest:
        req = db.query(HelpdeskRequest).filter(HelpdeskRequest.id == request_id).first()
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Helpdesk request with ID {request_id} not found",
            )
        return req

    @classmethod
    async def create_request(cls, db: Session, req_in: HelpdeskRequestCreate) -> HelpdeskRequest:
        # Emergency content check
        is_emergency = classification_service.is_emergency_content(req_in.title, req_in.description)

        # Fallback category / department / priority auto-routing if not explicitly provided
        cat, dept, priority = classification_service.fallback_helpdesk_classification(
            req_in.title, req_in.description
        )

        final_category = req_in.category or cat
        final_priority = req_in.priority or priority
        assigned_dept = dept

        # Validate location if provided
        if req_in.location_id:
            loc = db.query(Location).filter(Location.id == req_in.location_id).first()
            if not loc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Referenced location_id {req_in.location_id} does not exist",
                )

        db_req = HelpdeskRequest(
            title=req_in.title,
            description=req_in.description,
            category=final_category,
            priority=final_priority,
            status=HelpdeskStatus.OPEN,
            assigned_department=assigned_dept,
            location_id=req_in.location_id,
            location_name=req_in.location_name,
            reporter_metadata=req_in.reporter_metadata,
            is_emergency_flagged=is_emergency,
        )
        db.add(db_req)
        db.commit()
        db.refresh(db_req)

        # Record initial history
        hist = HelpdeskHistory(
            request_id=db_req.id,
            previous_status=None,
            new_status=HelpdeskStatus.OPEN,
            previous_department=None,
            new_department=assigned_dept,
            notes="Service Request Created" + (" [EMERGENCY FLAGGED]" if is_emergency else ""),
        )
        db.add(hist)
        db.commit()

        # Broadcast event
        await notification_manager.broadcast(
            "HELPDESK_REQUEST_CREATED",
            {
                "id": db_req.id,
                "title": db_req.title,
                "category": db_req.category,
                "priority": db_req.priority,
                "department": db_req.assigned_department,
                "is_emergency_flagged": db_req.is_emergency_flagged,
            },
        )

        return db_req

    @staticmethod
    def list_requests(
        db: Session,
        status_filter: Optional[HelpdeskStatus] = None,
        category_filter: Optional[HelpdeskCategory] = None,
        priority_filter: Optional[HelpdeskPriority] = None,
        department_filter: Optional[HelpdeskDepartment] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[HelpdeskRequest], int]:
        query = db.query(HelpdeskRequest)

        if status_filter:
            query = query.filter(HelpdeskRequest.status == status_filter)
        if category_filter:
            query = query.filter(HelpdeskRequest.category == category_filter)
        if priority_filter:
            query = query.filter(HelpdeskRequest.priority == priority_filter)
        if department_filter:
            query = query.filter(HelpdeskRequest.assigned_department == department_filter)

        total = query.count()
        bounded_limit = min(max(limit, 1), 100)
        items = query.order_by(HelpdeskRequest.is_emergency_flagged.desc(), HelpdeskRequest.created_at.desc()).offset(skip).limit(bounded_limit).all()

        return items, total

    @classmethod
    async def update_request_status(
        cls, db: Session, request_id: int, update_in: HelpdeskStatusUpdate
    ) -> HelpdeskRequest:
        req = cls.get_request(db, request_id)

        if req.status == update_in.status:
            return req

        allowed = VALID_HELPDESK_TRANSITIONS.get(req.status, set())
        if update_in.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid helpdesk status transition from '{req.status}' to '{update_in.status}'. Allowed: {[s.value for s in allowed]}",
            )

        prev_status = req.status
        req.status = update_in.status

        hist = HelpdeskHistory(
            request_id=req.id,
            previous_status=prev_status,
            new_status=update_in.status,
            previous_department=req.assigned_department,
            new_department=req.assigned_department,
            notes=update_in.reason or f"Status changed from {prev_status} to {update_in.status}",
        )
        db.add(hist)
        db.commit()
        db.refresh(req)

        await notification_manager.broadcast(
            "HELPDESK_STATUS_CHANGED",
            {
                "id": req.id,
                "previous_status": prev_status,
                "new_status": req.status,
            },
        )

        return req

    @classmethod
    async def assign_department(
        cls, db: Session, request_id: int, assign_in: HelpdeskDepartmentAssign
    ) -> HelpdeskRequest:
        req = cls.get_request(db, request_id)

        if req.assigned_department == assign_in.department:
            return req

        prev_dept = req.assigned_department
        req.assigned_department = assign_in.department

        hist = HelpdeskHistory(
            request_id=req.id,
            previous_status=req.status,
            new_status=req.status,
            previous_department=prev_dept,
            new_department=assign_in.department,
            notes=assign_in.reason or f"Reassigned from {prev_dept} to {assign_in.department}",
        )
        db.add(hist)
        db.commit()
        db.refresh(req)

        await notification_manager.broadcast(
            "HELPDESK_DEPARTMENT_REASSIGNED",
            {
                "id": req.id,
                "previous_department": prev_dept,
                "new_department": req.assigned_department,
            },
        )

        return req


helpdesk_service = HelpdeskService()
