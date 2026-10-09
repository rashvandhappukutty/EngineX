import pytest
from unittest.mock import patch
from app.db.models import Incident, Team, Assignment, AssignmentHistory, IncidentHistory
from tests.conftest import TestingSessionLocal


def test_assignment_creation_and_constraints(client):
    # Create incident
    inc_res = client.post("/api/v1/reports", json={
        "title": "Structural Crack in Pillar",
        "description": "Deep crack seen on supporting pillar.",
        "category": "Infrastructure",
        "severity": "High",
        "location_name": "Block B",
    })
    inc_id = inc_res.json()["id"]

    # Create team
    team_res = client.post("/api/v1/teams", json={
        "name": "Engineering Inspection Squad",
        "capabilities": ["structural", "inspection"],
    })
    team_id = team_res.json()["id"]

    # Create assignment
    asgn_res = client.post("/api/v1/assignments", json={
        "incident_id": inc_id,
        "team_id": team_id,
        "notes": "Despatched for urgent assessment",
    })
    assert asgn_res.status_code == 201
    asgn_data = asgn_res.json()
    assert asgn_data["status"] == "Assigned"

    # Verify team availability was automatically set to On_Mission
    team_check = client.get(f"/api/v1/teams/{team_id}").json()
    assert team_check["availability_status"] == "On_Mission"

    # Verify incident status was updated to Responding
    inc_check = client.get(f"/api/v1/reports/{inc_id}").json()
    assert inc_check["status"] == "Responding"


def test_prevent_double_assignment(client):
    inc1 = client.post("/api/v1/reports", json={"title": "Inc 1", "description": "Desc 1", "category": "Fire", "severity": "High", "location_name": "Loc A"}).json()["id"]
    inc2 = client.post("/api/v1/reports", json={"title": "Inc 2", "description": "Desc 2", "category": "Medical", "severity": "High", "location_name": "Loc B"}).json()["id"]

    team = client.post("/api/v1/teams", json={"name": "Solo Rescue", "capabilities": ["rescue"]}).json()["id"]

    # Assign team to inc1
    client.post("/api/v1/assignments", json={"incident_id": inc1, "team_id": team})

    # Attempt to assign same team to inc2 -> should fail
    res_double = client.post("/api/v1/assignments", json={"incident_id": inc2, "team_id": team})
    assert res_double.status_code == 400
    assert "active mission" in res_double.json()["detail"].lower() or "cannot accept" in res_double.json()["detail"].lower()


def test_assignment_creation_rollback_on_history_failure(client, db_session):
    inc = client.post("/api/v1/reports", json={
        "title": "Water Main Rupture",
        "description": "High pressure leak in yard.",
        "category": "Infrastructure",
        "severity": "High",
        "location_name": "North Yard",
    }).json()
    inc_id = inc["id"]

    team = client.post("/api/v1/teams", json={
        "name": "Plumbing Maintenance Unit",
        "capabilities": ["plumbing"],
    }).json()
    team_id = team["id"]

    original_add = db_session.add

    def mock_add(obj):
        if isinstance(obj, AssignmentHistory):
            raise RuntimeError("Simulated DB failure during AssignmentHistory insertion")
        return original_add(obj)

    with pytest.raises(RuntimeError):
        with patch.object(db_session, "add", side_effect=mock_add):
            client.post("/api/v1/assignments", json={
                "incident_id": inc_id,
                "team_id": team_id,
            })

    # Query fresh session to verify atomic rollback in SQLite database
    fresh_session = TestingSessionLocal()
    try:
        # 1. No orphan assignment record exists
        assert fresh_session.query(Assignment).count() == 0

        # 2. Team availability remained "Available" (not changed to On_Mission)
        team_obj = fresh_session.query(Team).filter(Team.id == team_id).first()
        assert team_obj.availability_status == "Available"

        # 3. Incident status remained "Reported" (not changed to Responding)
        inc_obj = fresh_session.query(Incident).filter(Incident.id == inc_id).first()
        assert inc_obj.status == "Reported"
    finally:
        fresh_session.close()


def test_cannot_assign_team_to_resolved_incident(client, db_session):
    inc_res = client.post("/api/v1/reports", json={
        "title": "Minor Kitchen Fire",
        "description": "Stove fire extinguished.",
        "category": "Fire",
        "severity": "Low",
        "location_name": "Cafeteria",
    })
    inc_id = inc_res.json()["id"]

    team_res = client.post("/api/v1/teams", json={
        "name": "Fire Crew 1",
        "capabilities": ["firefighting"],
    })
    team_id = team_res.json()["id"]

    client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Resolved"})

    asgn_res = client.post("/api/v1/assignments", json={
        "incident_id": inc_id,
        "team_id": team_id,
    })
    assert asgn_res.status_code == 400
    assert "status is 'resolved'" in asgn_res.json()["detail"].lower()

    assert db_session.query(Assignment).filter(Assignment.incident_id == inc_id).count() == 0
    team_check = client.get(f"/api/v1/teams/{team_id}").json()
    assert team_check["availability_status"] == "Available"


def test_cannot_assign_team_to_cancelled_incident(client, db_session):
    inc_res = client.post("/api/v1/reports", json={
        "title": "False Alarm Call",
        "description": "Spurious sensor trigger.",
        "category": "Security",
        "severity": "Low",
        "location_name": "Gate 1",
    })
    inc_id = inc_res.json()["id"]

    team_res = client.post("/api/v1/teams", json={
        "name": "Security Patrol Alpha",
        "capabilities": ["patrol"],
    })
    team_id = team_res.json()["id"]

    client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Cancelled"})

    asgn_res = client.post("/api/v1/assignments", json={
        "incident_id": inc_id,
        "team_id": team_id,
    })
    assert asgn_res.status_code == 400
    assert "status is 'cancelled'" in asgn_res.json()["detail"].lower()

    assert db_session.query(Assignment).filter(Assignment.incident_id == inc_id).count() == 0
    team_check = client.get(f"/api/v1/teams/{team_id}").json()
    assert team_check["availability_status"] == "Available"
