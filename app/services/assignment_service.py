import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Incident, Team, Assignment, AssignmentHistory, IncidentHistory
from app.schemas.assignments import AssignmentCreate, AssignmentStatusUpdate, AssignmentStatus, VALID_ASSIGNMENT_TRANSITIONS
from app.schemas.teams import TeamAvailabilityStatus
from app.schemas.incidents import IncidentStatus
from app.services.notification_service import notification_manager

logger = logging.getLogger("enginex.assignment_service")


class AssignmentService:
    @staticmethod
    def get_assignment(db: Session, assignment_id: int) -> Assignment:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Assignment with ID {assignment_id} not found",
            )
        return assignment

    @classmethod
    async def create_assignment(cls, db: Session, assignment_in: AssignmentCreate) -> Assignment:
        # 1. Validate incident existence
        incident = db.query(Incident).filter(Incident.id == assignment_in.incident_id).first()
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident with ID {assignment_in.incident_id} not found",
            )

        # 1b. Reject assignments to closed incidents (Resolved or Cancelled)
        if incident.status in (IncidentStatus.RESOLVED, IncidentStatus.CANCELLED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot assign response team to Incident #{incident.id} because its status is '{incident.status}'.",
            )

        # 2. Validate team existence
        team = db.query(Team).filter(Team.id == assignment_in.team_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Response team with ID {assignment_in.team_id} not found",
            )

        # 3. Prevent unavailable team assignment
        if team.availability_status in (TeamAvailabilityStatus.OFF_DUTY, TeamAvailabilityStatus.MAINTENANCE):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team '{team.name}' cannot be assigned because its availability status is '{team.availability_status}'.",
            )

        # 4. Check for double assignment / active missions
        active_assignments = db.query(Assignment).filter(
            Assignment.team_id == team.id,
            Assignment.status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.DISPATCHED, AssignmentStatus.ON_SCENE]),
        ).count()

        if team.availability_status == TeamAvailabilityStatus.ON_MISSION or active_assignments > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team '{team.name}' is currently on an active mission and cannot accept concurrent assignments.",
            )

        try:
            # Create Assignment record
            assignment = Assignment(
                incident_id=incident.id,
                team_id=team.id,
                status=AssignmentStatus.ASSIGNED,
                notes=assignment_in.notes or f"Team '{team.name}' assigned to Incident #{incident.id}",
            )
            db.add(assignment)
            db.flush()  # Obtain generated assignment ID atomically

            # Log Assignment History
            hist = AssignmentHistory(
                assignment_id=assignment.id,
                previous_status=None,
                new_status=AssignmentStatus.ASSIGNED,
                notes=assignment.notes,
            )
            db.add(hist)

            # Update Team availability to ON_MISSION
            team.availability_status = TeamAvailabilityStatus.ON_MISSION

            # Update Incident status to Responding if reported or investigating
            if incident.status in (IncidentStatus.REPORTED, IncidentStatus.INVESTIGATING):
                prev_status = incident.status
                incident.status = IncidentStatus.RESPONDING
                inc_hist = IncidentHistory(
                    incident_id=incident.id,
                    previous_status=prev_status,
                    new_status=IncidentStatus.RESPONDING,
                    change_reason=f"Response Team '{team.name}' assigned (Assignment #{assignment.id})",
                )
                db.add(inc_hist)

            db.commit()  # Single atomic commit for Assignment, AssignmentHistory, Team status, and Incident status
        except Exception:
            db.rollback()
            raise

        db.refresh(assignment)

        # Broadcast event
        await notification_manager.broadcast(
            "ASSIGNMENT_CREATED",
            {
                "assignment_id": assignment.id,
                "incident_id": incident.id,
                "team_id": team.id,
                "team_name": team.name,
                "status": assignment.status,
            },
        )

        return assignment

    @classmethod
    async def update_assignment_status(
        cls, db: Session, assignment_id: int, update_in: AssignmentStatusUpdate
    ) -> Assignment:
        assignment = cls.get_assignment(db, assignment_id)

        if assignment.status == update_in.status:
            return assignment

        allowed = VALID_ASSIGNMENT_TRANSITIONS.get(assignment.status, set())
        if update_in.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid assignment status transition from '{assignment.status}' to '{update_in.status}'. Allowed: {[s.value for s in allowed]}",
            )

        try:
            prev_status = assignment.status
            assignment.status = update_in.status

            # History log
            hist = AssignmentHistory(
                assignment_id=assignment.id,
                previous_status=prev_status,
                new_status=update_in.status,
                notes=update_in.notes or f"Status updated from {prev_status} to {update_in.status}",
            )
            db.add(hist)

            # If completed or cancelled, check if team can be marked Available again
            if update_in.status in (AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED):
                team = db.query(Team).filter(Team.id == assignment.team_id).first()
                if team:
                    remaining_active = db.query(Assignment).filter(
                        Assignment.team_id == team.id,
                        Assignment.id != assignment.id,
                        Assignment.status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.DISPATCHED, AssignmentStatus.ON_SCENE]),
                    ).count()
                    if remaining_active == 0 and team.availability_status == TeamAvailabilityStatus.ON_MISSION:
                        team.availability_status = TeamAvailabilityStatus.AVAILABLE

            db.commit()  # Single atomic commit for status update, history log, and team availability reset
        except Exception:
            db.rollback()
            raise

        db.refresh(assignment)

        await notification_manager.broadcast(
            "ASSIGNMENT_STATUS_CHANGED",
            {
                "assignment_id": assignment.id,
                "previous_status": prev_status,
                "new_status": assignment.status,
            },
        )

        return assignment

    @staticmethod
    def list_assignments(db: Session, incident_id: Optional[int] = None, team_id: Optional[int] = None) -> List[Assignment]:
        query = db.query(Assignment)
        if incident_id:
            query = query.filter(Assignment.incident_id == incident_id)
        if team_id:
            query = query.filter(Assignment.team_id == team_id)
        return query.order_by(Assignment.assigned_at.desc()).all()


assignment_service = AssignmentService()
