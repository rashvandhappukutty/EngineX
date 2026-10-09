import pytest
from unittest.mock import patch
from app.db.models import Incident, IncidentHistory
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
