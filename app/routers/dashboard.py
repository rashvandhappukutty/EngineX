from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.db.models import Incident, Team, Assignment, HelpdeskRequest, Hazard
from app.schemas.dashboard import (
    DashboardMetricsResponse,
    IncidentsSummary,
    TeamsSummary,
    AssignmentsSummary,
    HelpdeskSummary,
)
from app.schemas.incidents import IncidentStatus
from app.schemas.teams import TeamAvailabilityStatus
from app.schemas.helpdesk import HelpdeskStatus
from app.schemas.assignments import AssignmentStatus

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get("/metrics", response_model=DashboardMetricsResponse, summary="Get Aggregated Crisis & Helpdesk Dashboard Metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    # 1. Incidents aggregation
    total_incidents = db.query(Incident).count()
    incidents_by_status_raw = db.query(Incident.status, func.count(Incident.id)).group_by(Incident.status).all()
    incidents_by_status = {status: count for status, count in incidents_by_status_raw}

    incidents_by_severity_raw = db.query(Incident.severity, func.count(Incident.id)).group_by(Incident.severity).all()
    incidents_by_severity = {sev: count for sev, count in incidents_by_severity_raw}

    incidents_by_category_raw = db.query(Incident.category, func.count(Incident.id)).group_by(Incident.category).all()
    incidents_by_category = {cat: count for cat, count in incidents_by_category_raw}

    recent_incidents = (
        db.query(Incident)
        .order_by(Incident.created_at.desc())
        .limit(5)
        .all()
    )

    inc_summary = IncidentsSummary(
        total=total_incidents,
        by_status=incidents_by_status,
        by_severity=incidents_by_severity,
        by_category=incidents_by_category,
        recent_incidents=recent_incidents,
    )

    # 2. Teams aggregation
    total_teams = db.query(Team).count()
    available_teams = db.query(Team).filter(Team.availability_status == TeamAvailabilityStatus.AVAILABLE).count()
    teams_by_status_raw = db.query(Team.availability_status, func.count(Team.id)).group_by(Team.availability_status).all()
    teams_by_status = {st: count for st, count in teams_by_status_raw}
    all_teams = db.query(Team).order_by(Team.name.asc()).all()

    teams_summary = TeamsSummary(
        total_teams=total_teams,
        available_teams=available_teams,
        by_status=teams_by_status,
        teams=all_teams,
    )

    # 3. Assignments aggregation
    total_assignments = db.query(Assignment).count()
    active_assignments_query = db.query(Assignment).filter(
        Assignment.status.in_([AssignmentStatus.ASSIGNED, AssignmentStatus.DISPATCHED, AssignmentStatus.ON_SCENE])
    )
    active_assignments_count = active_assignments_query.count()
    recent_assignments = (
        db.query(Assignment)
        .order_by(Assignment.assigned_at.desc())
        .limit(5)
        .all()
    )

    assignments_summary = AssignmentsSummary(
        active_assignments=active_assignments_count,
        total_assignments=total_assignments,
        recent_assignments=recent_assignments,
    )

    # 4. Helpdesk aggregation
    total_requests = db.query(HelpdeskRequest).count()
    open_requests = db.query(HelpdeskRequest).filter(
        HelpdeskRequest.status.in_([HelpdeskStatus.OPEN, HelpdeskStatus.IN_PROGRESS, HelpdeskStatus.PENDING])
    ).count()

    helpdesk_by_dept_raw = db.query(HelpdeskRequest.assigned_department, func.count(HelpdeskRequest.id)).group_by(HelpdeskRequest.assigned_department).all()
    helpdesk_by_dept = {dept: count for dept, count in helpdesk_by_dept_raw}

    helpdesk_by_status_raw = db.query(HelpdeskRequest.status, func.count(HelpdeskRequest.id)).group_by(HelpdeskRequest.status).all()
    helpdesk_by_status = {st: count for st, count in helpdesk_by_status_raw}

    helpdesk_by_prio_raw = db.query(HelpdeskRequest.priority, func.count(HelpdeskRequest.id)).group_by(HelpdeskRequest.priority).all()
    helpdesk_by_prio = {prio: count for prio, count in helpdesk_by_prio_raw}

    recent_requests = (
        db.query(HelpdeskRequest)
        .order_by(HelpdeskRequest.created_at.desc())
        .limit(5)
        .all()
    )

    helpdesk_summary = HelpdeskSummary(
        open_requests=open_requests,
        total_requests=total_requests,
        by_department=helpdesk_by_dept,
        by_status=helpdesk_by_status,
        by_priority=helpdesk_by_prio,
        recent_requests=recent_requests,
    )

    active_hazards_count = db.query(Hazard).filter(Hazard.is_active == True).count()

    return DashboardMetricsResponse(
        incidents=inc_summary,
        teams=teams_summary,
        assignments=assignments_summary,
        helpdesk=helpdesk_summary,
        active_hazards_count=active_hazards_count,
    )
