from typing import List, Dict
from pydantic import BaseModel
from app.schemas.incidents import IncidentResponse
from app.schemas.teams import TeamResponse
from app.schemas.assignments import AssignmentResponse
from app.schemas.helpdesk import HelpdeskRequestResponse


class IncidentsSummary(BaseModel):
    total: int
    by_status: Dict[str, int]
    by_severity: Dict[str, int]
    by_category: Dict[str, int]
    recent_incidents: List[IncidentResponse]


class TeamsSummary(BaseModel):
    total_teams: int
    available_teams: int
    by_status: Dict[str, int]
    teams: List[TeamResponse]


class AssignmentsSummary(BaseModel):
    active_assignments: int
    total_assignments: int
    recent_assignments: List[AssignmentResponse]


class HelpdeskSummary(BaseModel):
    open_requests: int
    total_requests: int
    by_department: Dict[str, int]
    by_status: Dict[str, int]
    by_priority: Dict[str, int]
    recent_requests: List[HelpdeskRequestResponse]


class DashboardMetricsResponse(BaseModel):
    incidents: IncidentsSummary
    teams: TeamsSummary
    assignments: AssignmentsSummary
    helpdesk: HelpdeskSummary
    active_hazards_count: int
