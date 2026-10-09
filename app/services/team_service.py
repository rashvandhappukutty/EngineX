from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Team, Assignment
from app.schemas.teams import TeamCreate, TeamUpdate, TeamAvailabilityStatus, TeamAvailabilityUpdate
from app.schemas.assignments import AssignmentStatus
from app.services.notification_service import notification_manager


class TeamService:
    @staticmethod
    def get_team(db: Session, team_id: int) -> Team:
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Response team with ID {team_id} not found",
            )
        return team

    @classmethod
    def create_team(cls, db: Session, team_in: TeamCreate) -> Team:
        existing = db.query(Team).filter(Team.name == team_in.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team with name '{team_in.name}' already exists",
            )

        capabilities_str = ",".join(c.strip() for c in team_in.capabilities) if isinstance(team_in.capabilities, list) else team_in.capabilities
        db_team = Team(
            name=team_in.name,
            capabilities=capabilities_str,
            availability_status=team_in.availability_status or TeamAvailabilityStatus.AVAILABLE,
            contact_info=team_in.contact_info,
        )
        db.add(db_team)
        db.commit()
        db.refresh(db_team)
        return db_team

    @staticmethod
    def list_teams(
        db: Session,
        status_filter: Optional[TeamAvailabilityStatus] = None,
        capability_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Team]:
        query = db.query(Team)

        if status_filter:
            query = query.filter(Team.availability_status == status_filter)
        if capability_filter:
            norm_filter = capability_filter.strip().lower().replace(" ", "")
            if norm_filter:
                # Escape SQL LIKE wildcards (\, %, _) to treat them as literals
                escaped_filter = (
                    norm_filter.replace("\\", "\\\\")
                    .replace("%", "\\%")
                    .replace("_", "\\_")
                )
                pattern = f"%,{escaped_filter},%"
                padded_caps = "," + func.lower(func.replace(Team.capabilities, " ", "")) + ","
                query = query.filter(padded_caps.like(pattern, escape="\\"))

        return query.order_by(Team.name.asc()).offset(skip).limit(limit).all()

    @classmethod
    async def update_team_availability(
        cls, db: Session, team_id: int, update_in: TeamAvailabilityUpdate
    ) -> Team:
        team = cls.get_team(db, team_id)

        # Prevent manual availability override while team has active assignments
        if update_in.availability_status != TeamAvailabilityStatus.ON_MISSION:
            active_assignments = db.query(Assignment).filter(
                Assignment.team_id == team.id,
                Assignment.status.in_([
                    AssignmentStatus.ASSIGNED,
                    AssignmentStatus.DISPATCHED,
                    AssignmentStatus.ON_SCENE,
                ]),
            ).count()

            if active_assignments > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Cannot set availability status of team '{team.name}' to '{update_in.availability_status}' "
                        f"while it has {active_assignments} active assignment(s)."
                    ),
                )

        if team.availability_status == update_in.availability_status:
            return team

        try:
            prev_status = team.availability_status
            team.availability_status = update_in.availability_status
            db.commit()
        except Exception:
            db.rollback()
            raise

        db.refresh(team)

        await notification_manager.broadcast(
            "TEAM_AVAILABILITY_CHANGED",
            {
                "team_id": team.id,
                "team_name": team.name,
                "previous_status": prev_status,
                "new_status": team.availability_status,
            },
        )

        return team

    @classmethod
    def get_team_assignments(cls, db: Session, team_id: int) -> List[Assignment]:
        cls.get_team(db, team_id)
        return db.query(Assignment).filter(Assignment.team_id == team_id).all()


team_service = TeamService()
