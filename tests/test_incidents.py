import pytest
from unittest.mock import patch
from app.db.models import Incident, IncidentHistory, Assignment, AssignmentHistory, Team
from tests.conftest import TestingSessionLocal


def test_create_incident_success(client):
    payload = {
        "title": "Electrical Short in Lab 3",
        "description": "Sparks observed coming from main electrical distribution panel.",
        "category": "Infrastructure",
        "severity": "High",
        "location_name": "Science Complex Floor 2",
    }
    response = client.post("/api/v1/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] > 0
    assert data["title"] == payload["title"]
    assert data["category"] == "Infrastructure"
    assert data["severity"] == "High"
    assert data["status"] == "Reported"
    assert data["priority_score"] > 0.0


def test_create_incident_produces_history_and_incident(client, db_session):
    payload = {
        "title": "Water Pipe Burst",
        "description": "Flooding in basement hallway.",
        "category": "Infrastructure",
        "severity": "High",
        "location_name": "Basement",
    }
    response = client.post("/api/v1/reports", json=payload)
    assert response.status_code == 201
    inc_id = response.json()["id"]

    inc = db_session.query(Incident).filter(Incident.id == inc_id).first()
    assert inc is not None

    histories = db_session.query(IncidentHistory).filter(IncidentHistory.incident_id == inc_id).all()
    assert len(histories) == 1
    assert histories[0].new_status == "Reported"


def test_create_incident_rollback_on_history_failure(client, db_session):
    payload = {
        "title": "Gas Leak in Kitchen",
        "description": "Gas odor near stove area.",
        "category": "Infrastructure",
        "severity": "Critical",
        "location_name": "Cafeteria Kitchen",
    }

    original_add = db_session.add

    def mock_add(obj):
        if isinstance(obj, IncidentHistory):
            raise RuntimeError("Simulated DB error during IncidentHistory insertion")
        return original_add(obj)

    with pytest.raises(RuntimeError):
        with patch.object(db_session, "add", side_effect=mock_add):
            client.post("/api/v1/reports", json=payload)

    # Query fresh session to verify atomic rollback in SQLite database
    fresh_session = TestingSessionLocal()
    try:
        assert fresh_session.query(Incident).count() == 0
    finally:
        fresh_session.close()


def test_create_incident_invalid_input(client):
    # Title too short (< 3 chars)
    payload = {
        "title": "Hi",
        "description": "Test description",
        "category": "Fire",
        "severity": "Low",
        "location_name": "Test Loc",
    }
    response = client.post("/api/v1/reports", json=payload)
    assert response.status_code == 422


def test_list_and_filter_incidents(client):
    # Create two incidents
    client.post("/api/v1/reports", json={
        "title": "Small Trash Can Fire",
        "description": "Paper trash can caught fire near cafeteria.",
        "category": "Fire",
        "severity": "Medium",
        "location_name": "Cafeteria",
    })
    client.post("/api/v1/reports", json={
        "title": "Door Lock Malfunction",
        "description": "Magnetic lock failed on security door.",
        "category": "Security",
        "severity": "Low",
        "location_name": "East Gate",
    })

    # List all
    res = client.get("/api/v1/reports")
    assert res.status_code == 200
    assert res.json()["total"] == 2

    # Filter by category
    res_fire = client.get("/api/v1/reports?category=Fire")
    assert res_fire.status_code == 200
    assert res_fire.json()["total"] == 1
    assert res_fire.json()["items"][0]["category"] == "Fire"


def test_get_incident_by_id(client):
    res_create = client.post("/api/v1/reports", json={
        "title": "Medical Collapse",
        "description": "Person fainted in hallway.",
        "category": "Medical",
        "severity": "High",
        "location_name": "Library",
    })
    inc_id = res_create.json()["id"]

    res_get = client.get(f"/api/v1/reports/{inc_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == inc_id


def test_get_incident_404(client):
    response = client.get("/api/v1/reports/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_valid_incident_status_transitions(client):
    res_create = client.post("/api/v1/reports", json={
        "title": "Chemical Spill in Chemistry Lab",
        "description": "500ml solvent bottle broke on counter.",
        "category": "Infrastructure",
        "severity": "High",
        "location_name": "Chem Lab B",
    })
    inc_id = res_create.json()["id"]

    # Reported -> Investigating
    res_inv = client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Investigating", "reason": "Hazmat team inspecting"})
    assert res_inv.status_code == 200
    assert res_inv.json()["status"] == "Investigating"

    # Investigating -> Responding
    res_resp = client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Responding", "reason": "Cleanup team dispatched"})
    assert res_resp.status_code == 200
    assert res_resp.json()["status"] == "Responding"

    # Responding -> Resolved
    res_res = client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Resolved", "reason": "Spill contained and neutralised"})
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "Resolved"

    # Check history audit entries
    res_hist = client.get(f"/api/v1/reports/{inc_id}/history")
    assert res_hist.status_code == 200
    assert len(res_hist.json()) >= 4


def test_incident_status_update_rollback_on_history_failure(client, db_session):
    res_create = client.post("/api/v1/reports", json={
        "title": "Power Line Short",
        "description": "Sparking line behind admin block.",
        "category": "Infrastructure",
        "severity": "High",
        "location_name": "Admin Block",
    })
    inc_id = res_create.json()["id"]

    original_add = db_session.add

    def mock_add(obj):
        if isinstance(obj, IncidentHistory):
            raise RuntimeError("Simulated history failure during status update")
        return original_add(obj)

    with pytest.raises(RuntimeError):
        with patch.object(db_session, "add", side_effect=mock_add):
            client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Investigating"})

    # Query fresh session to verify atomic rollback in SQLite database
    fresh_session = TestingSessionLocal()
    try:
        inc = fresh_session.query(Incident).filter(Incident.id == inc_id).first()
        assert inc.status == "Reported"
    finally:
        fresh_session.close()


def test_invalid_incident_status_transition_rejection(client):
    res_create = client.post("/api/v1/reports", json={
        "title": "Minor Water Leak",
        "description": "Water dripping from ceiling tile.",
        "category": "Infrastructure",
        "severity": "Low",
        "location_name": "Room 101",
    })
    inc_id = res_create.json()["id"]

    # Move to Resolved
    client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Resolved"})

    # Try invalid transition from Resolved to Responding (allowed is only Investigating/reopen)
    res_invalid = client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Responding"})
    assert res_invalid.status_code == 400
    assert "invalid status transition" in res_invalid.json()["detail"].lower()


def test_resolve_incident_completes_active_assignments_and_releases_team(client, db_session):
    inc_res = client.post("/api/v1/reports", json={
        "title": "Lab Transformer Overheat",
        "description": "Transformer temperature critical in sub-station B.",
        "category": "Infrastructure",
        "severity": "High",
        "location_name": "Substation B",
    })
    inc_id = inc_res.json()["id"]

    team_res = client.post("/api/v1/teams", json={
        "name": "Electrical Rapid Response",
        "capabilities": ["electrical", "high_voltage"],
    })
    team_id = team_res.json()["id"]

    asgn_res = client.post("/api/v1/assignments", json={
        "incident_id": inc_id,
        "team_id": team_id,
    })
    asgn_id = asgn_res.json()["id"]

    team_before = client.get(f"/api/v1/teams/{team_id}").json()
    assert team_before["availability_status"] == "On_Mission"

    res_patch = client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Resolved", "reason": "Transformer cooled"})
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "Resolved"

    asgn_obj = db_session.query(Assignment).filter(Assignment.id == asgn_id).first()
    assert asgn_obj.status == "Completed"

    asgn_hist = db_session.query(AssignmentHistory).filter(AssignmentHistory.assignment_id == asgn_id).all()
    assert len(asgn_hist) >= 2
    latest_hist = sorted(asgn_hist, key=lambda h: h.id)[-1]
    assert latest_hist.new_status == "Completed"

    team_after = client.get(f"/api/v1/teams/{team_id}").json()
    assert team_after["availability_status"] == "Available"


def test_cancel_incident_cancels_active_assignments_and_releases_team(client, db_session):
    inc_res = client.post("/api/v1/reports", json={
        "title": "False Smoke Detector Alarm",
        "description": "Sensor triggered by dust in attic.",
        "category": "Fire",
        "severity": "Medium",
        "location_name": "Attic Space",
    })
    inc_id = inc_res.json()["id"]

    team_res = client.post("/api/v1/teams", json={
        "name": "Attic Inspection Squad",
        "capabilities": ["firefighting", "inspection"],
    })
    team_id = team_res.json()["id"]

    asgn_res = client.post("/api/v1/assignments", json={
        "incident_id": inc_id,
        "team_id": team_id,
    })
    asgn_id = asgn_res.json()["id"]

    res_patch = client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Cancelled", "reason": "Confirmed false alarm"})
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "Cancelled"

    asgn_obj = db_session.query(Assignment).filter(Assignment.id == asgn_id).first()
    assert asgn_obj.status == "Cancelled"

    asgn_hist = db_session.query(AssignmentHistory).filter(AssignmentHistory.assignment_id == asgn_id).all()
    latest_hist = sorted(asgn_hist, key=lambda h: h.id)[-1]
    assert latest_hist.new_status == "Cancelled"

    team_after = client.get(f"/api/v1/teams/{team_id}").json()
    assert team_after["availability_status"] == "Available"


def test_team_with_other_active_assignment_remains_on_mission(client, db_session):
    inc1_id = client.post("/api/v1/reports", json={
        "title": "Incident 1 - Elevator Stuck",
        "description": "Elevator stuck between floor 2 and 3.",
        "category": "Infrastructure",
        "severity": "Medium",
        "location_name": "Building A",
    }).json()["id"]

    inc2_id = client.post("/api/v1/reports", json={
        "title": "Incident 2 - Generator Failure",
        "description": "Backup generator failed to start.",
        "category": "Infrastructure",
        "severity": "High",
        "location_name": "Power House",
    }).json()["id"]

    team_id = client.post("/api/v1/teams", json={
        "name": "Multi-Task Technicians",
        "capabilities": ["mechanical", "electrical"],
    }).json()["id"]

    asgn1_res = client.post("/api/v1/assignments", json={"incident_id": inc1_id, "team_id": team_id})
    asgn1_id = asgn1_res.json()["id"]

    asgn2 = Assignment(
        incident_id=inc2_id,
        team_id=team_id,
        status="Assigned",
        notes="Secondary emergency tasking",
    )
    db_session.add(asgn2)
    db_session.commit()

    client.patch(f"/api/v1/reports/{inc1_id}/status", json={"status": "Resolved", "reason": "Elevator freed"})

    asgn1_obj = db_session.query(Assignment).filter(Assignment.id == asgn1_id).first()
    assert asgn1_obj.status == "Completed"

    db_session.refresh(asgn2)
    assert asgn2.status == "Assigned"

    team_after = client.get(f"/api/v1/teams/{team_id}").json()
    assert team_after["availability_status"] == "On_Mission"


def test_resolve_incident_does_not_modify_unrelated_incident_assignments(client, db_session):
    inc1_id = client.post("/api/v1/reports", json={
        "title": "Chemical Leak",
        "description": "Solvent leakage in Chem lab.",
        "category": "Infrastructure",
        "severity": "High",
        "location_name": "Lab 1",
    }).json()["id"]

    inc2_id = client.post("/api/v1/reports", json={
        "title": "Main Gate Barrier Broken",
        "description": "Vehicle crashed into barrier.",
        "category": "Security",
        "severity": "Medium",
        "location_name": "Main Gate",
    }).json()["id"]

    team1_id = client.post("/api/v1/teams", json={"name": "Hazmat Team 1", "capabilities": ["hazmat"]}).json()["id"]
    team2_id = client.post("/api/v1/teams", json={"name": "Security Team 2", "capabilities": ["security"]}).json()["id"]

    asgn1_id = client.post("/api/v1/assignments", json={"incident_id": inc1_id, "team_id": team1_id}).json()["id"]
    asgn2_id = client.post("/api/v1/assignments", json={"incident_id": inc2_id, "team_id": team2_id}).json()["id"]

    client.patch(f"/api/v1/reports/{inc1_id}/status", json={"status": "Resolved"})

    asgn1_obj = db_session.query(Assignment).filter(Assignment.id == asgn1_id).first()
    assert asgn1_obj.status == "Completed"

    asgn2_obj = db_session.query(Assignment).filter(Assignment.id == asgn2_id).first()
    assert asgn2_obj.status == "Assigned"

    team2_check = client.get(f"/api/v1/teams/{team2_id}").json()
    assert team2_check["availability_status"] == "On_Mission"


def test_incident_resolution_atomic_rollback_on_assignment_history_failure(client, db_session):
    inc_id = client.post("/api/v1/reports", json={
        "title": "Server Room AC Failure",
        "description": "Temperature rising in data center.",
        "category": "Infrastructure",
        "severity": "Critical",
        "location_name": "Data Center",
    }).json()["id"]

    team_id = client.post("/api/v1/teams", json={
        "name": "HVAC Crew",
        "capabilities": ["hvac"],
    }).json()["id"]

    asgn_id = client.post("/api/v1/assignments", json={"incident_id": inc_id, "team_id": team_id}).json()["id"]

    original_add = db_session.add

    def mock_add(obj):
        if isinstance(obj, AssignmentHistory):
            raise RuntimeError("Simulated failure during AssignmentHistory insertion on incident resolve")
        return original_add(obj)

    with pytest.raises(RuntimeError):
        with patch.object(db_session, "add", side_effect=mock_add):
            client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Resolved"})

    fresh_session = TestingSessionLocal()
    try:
        fresh_inc = fresh_session.query(Incident).filter(Incident.id == inc_id).first()
        assert fresh_inc.status == "Responding"

        fresh_asgn = fresh_session.query(Assignment).filter(Assignment.id == asgn_id).first()
        assert fresh_asgn.status == "Assigned"

        fresh_team = fresh_session.query(Team).filter(Team.id == team_id).first()
        assert fresh_team.availability_status == "On_Mission"
    finally:
        fresh_session.close()


def test_unrelated_incident_status_transitions_preserved(client, db_session):
    inc_id = client.post("/api/v1/reports", json={
        "title": "Routine Campus Patrol Request",
        "description": "Extra patrol requested near student center.",
        "category": "Security",
        "severity": "Low",
        "location_name": "Student Center",
    }).json()["id"]

    res1 = client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Investigating"})
    assert res1.status_code == 200
    assert res1.json()["status"] == "Investigating"

    res2 = client.patch(f"/api/v1/reports/{inc_id}/status", json={"status": "Responding"})
    assert res2.status_code == 200
    assert res2.json()["status"] == "Responding"
