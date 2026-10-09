import logging
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Incident, IncidentHistory, Location, Hazard, Assignment, AssignmentHistory, Team
from app.schemas.incidents import (
    IncidentCreate,
    IncidentUpdate,
    IncidentStatusUpdate,
    IncidentStatus,
    IncidentSeverity,
    IncidentCategory,
    VALID_INCIDENT_TRANSITIONS,
)
from app.schemas.assignments import AssignmentStatus
from app.schemas.teams import TeamAvailabilityStatus
from app.services.prioritization_service import prioritization_service
from app.services.classification_service import classification_service
from app.services.notification_service import notification_manager

logger = logging.getLogger("enginex.incident_service")


class IncidentService:
    @staticmethod
    def get_incident(db: Session, incident_id: int) -> Incident:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident with ID {incident_id} not found",
            )
        return incident

    @classmethod
    async def create_incident(cls, db: Session, incident_in: IncidentCreate) -> Incident:
        # Check location validity if provided
        has_hazards = False
        if incident_in.location_id:
            loc = db.query(Location).filter(Location.id == incident_in.location_id).first()
            if not loc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Referenced location_id {incident_in.location_id} does not exist",
                )
            active_hazards = db.query(Hazard).filter(
                Hazard.location_id == incident_in.location_id,
                Hazard.is_active == True,
            ).count()
            has_hazards = active_hazards > 0

        # AI or deterministic classification check
        suggested_cat, suggested_sev, ai_model, confidence = (
            await classification_service.classify_incident_with_ai(
                incident_in.title, incident_in.description
            )
        )

        final_category = incident_in.category or suggested_cat
        final_severity = incident_in.severity or suggested_sev

        # Compute priority score
        priority = prioritization_service.calculate_priority_score(
            severity=final_severity,
            category=final_category,
            has_active_location_hazards=has_hazards,
        )

        try:
            db_incident = Incident(
                title=incident_in.title,
                description=incident_in.description,
                category=final_category,
                severity=final_severity,
                status=IncidentStatus.REPORTED,
                location_id=incident_in.location_id,
                location_name=incident_in.location_name,
                reporter_metadata=incident_in.reporter_metadata,
                priority_score=priority,
                ai_suggested_category=suggested_cat if ai_model else None,
                ai_confidence=confidence,
            )
            db.add(db_incident)
            db.flush()  # Obtain generated incident ID atomically without committing transaction

            # Record initial history
            history_entry = IncidentHistory(
                incident_id=db_incident.id,
                previous_status=None,
                new_status=IncidentStatus.REPORTED,
                change_reason="Initial Incident Report Created",
            )
            db.add(history_entry)
            db.commit()  # Single atomic commit for incident and initial history
        except Exception:
            db.rollback()
            raise

        db.refresh(db_incident)

        # Broadcast via WebSockets asynchronously
        await notification_manager.broadcast(
            "INCIDENT_CREATED",
            {
                "id": db_incident.id,
                "title": db_incident.title,
                "category": db_incident.category,
                "severity": db_incident.severity,
                "status": db_incident.status,
                "priority_score": db_incident.priority_score,
                "location_name": db_incident.location_name,
            },
        )

        return db_incident

    @staticmethod
    def list_incidents(
        db: Session,
        status_filter: Optional[IncidentStatus] = None,
        severity_filter: Optional[IncidentSeverity] = None,
        category_filter: Optional[IncidentCategory] = None,
        location_id_filter: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Incident], int]:
        query = db.query(Incident)

        if status_filter:
            query = query.filter(Incident.status == status_filter)
        if severity_filter:
            query = query.filter(Incident.severity == severity_filter)
        if category_filter:
            query = query.filter(Incident.category == category_filter)
        if location_id_filter:
            query = query.filter(Incident.location_id == location_id_filter)

        total = query.count()
        # Cap max limit to 100 for safety
        bounded_limit = min(max(limit, 1), 100)
        items = query.order_by(Incident.priority_score.desc(), Incident.created_at.desc()).offset(skip).limit(bounded_limit).all()

        return items, total

    @classmethod
    async def update_incident_status(
        cls, db: Session, incident_id: int, update_in: IncidentStatusUpdate
    ) -> Incident:
        incident = cls.get_incident(db, incident_id)

        if incident.status == update_in.status:
            return incident

        allowed_next_states = VALID_INCIDENT_TRANSITIONS.get(incident.status, set())
        if update_in.status not in allowed_next_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid status transition from '{incident.status}' to '{update_in.status}'. "
                    f"Allowed next statuses: {[s.value for s in allowed_next_states]}"
                ),
            )

        try:
            prev_status = incident.status
            incident.status = update_in.status

            # Save history
            history_entry = IncidentHistory(
                incident_id=incident.id,
                previous_status=prev_status,
                new_status=update_in.status,
                change_reason=update_in.reason or f"Status changed from {prev_status} to {update_in.status}",
            )
            db.add(history_entry)

            # Automatically update active response team assignments and release teams when incident is Resolved or Cancelled
            if update_in.status in (IncidentStatus.RESOLVED, IncidentStatus.CANCELLED):
                active_assignments = db.query(Assignment).filter(
                    Assignment.incident_id == incident.id,
                    Assignment.status.in_([
                        AssignmentStatus.ASSIGNED,
                        AssignmentStatus.DISPATCHED,
                        AssignmentStatus.ON_SCENE,
                    ]),
                ).all()

                target_assignment_status = (
                    AssignmentStatus.COMPLETED
                    if update_in.status == IncidentStatus.RESOLVED
                    else AssignmentStatus.CANCELLED
                )

                team_ids_to_check = set()

                for assignment in active_assignments:
                    prev_asgn_status = assignment.status
                    assignment.status = target_assignment_status
                    team_ids_to_check.add(assignment.team_id)

                    asgn_history = AssignmentHistory(
                        assignment_id=assignment.id,
                        previous_status=prev_asgn_status,
                        new_status=target_assignment_status,
                        notes=(
                            f"Incident #{incident.id} {update_in.status.value.lower()}: "
                            f"status automatically updated to {target_assignment_status.value}"
                        ),
                    )
                    db.add(asgn_history)

                # Update team availability to Available if team has no other active assignments and is On_Mission
                for team_id in team_ids_to_check:
                    team = db.query(Team).filter(Team.id == team_id).first()
                    if team:
                        remaining_active = db.query(Assignment).filter(
                            Assignment.team_id == team.id,
                            Assignment.incident_id != incident.id,
                            Assignment.status.in_([
                                AssignmentStatus.ASSIGNED,
                                AssignmentStatus.DISPATCHED,
                                AssignmentStatus.ON_SCENE,
                            ]),
                        ).count()

                        if remaining_active == 0 and team.availability_status == TeamAvailabilityStatus.ON_MISSION:
                            team.availability_status = TeamAvailabilityStatus.AVAILABLE

            db.commit()  # Single atomic commit for incident status update, incident history, assignment updates, assignment histories, and team availability updates
        except Exception:
            db.rollback()
            raise

        db.refresh(incident)

        # Broadcast via WebSockets
        await notification_manager.broadcast(
            "INCIDENT_STATUS_CHANGED",
            {
                "id": incident.id,
                "previous_status": prev_status,
                "new_status": incident.status,
                "reason": update_in.reason,
            },
        )

        return incident


incident_service = IncidentService()
