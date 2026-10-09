import pytest
from unittest.mock import patch
from app.db.models import HelpdeskRequest, HelpdeskHistory
from tests.conftest import TestingSessionLocal


def test_helpdesk_creation_and_auto_routing(client):
    payload = {
        "title": "Need WiFi password reset in Hostel B",
        "description": "Student computer cannot connect to campus network.",
    }
    res = client.post("/api/v1/helpdesk/requests", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["category"] == "IT support"
    assert data["assigned_department"] == "IT"
    assert data["status"] == "Open"
    assert data["is_emergency_flagged"] is False


def test_helpdesk_creation_produces_request_and_history(client, db_session):
    payload = {
        "title": "Projector bulb burnt out",
        "description": "Lecture Hall 1 projector is dark.",
    }
    res = client.post("/api/v1/helpdesk/requests", json=payload)
    assert res.status_code == 201
    req_id = res.json()["id"]

    req = db_session.query(HelpdeskRequest).filter(HelpdeskRequest.id == req_id).first()
    assert req is not None

    histories = db_session.query(HelpdeskHistory).filter(HelpdeskHistory.request_id == req_id).all()
    assert len(histories) == 1
    assert histories[0].new_status == "Open"


def test_helpdesk_creation_rollback_on_history_failure(client, db_session):
    payload = {
        "title": "Air Conditioner Leaking",
        "description": "Water dripping from AC unit in Room 204.",
    }

    original_add = db_session.add

    def mock_add(obj):
        if isinstance(obj, HelpdeskHistory):
            raise RuntimeError("Simulated DB error during HelpdeskHistory insertion")
        return original_add(obj)

    with pytest.raises(RuntimeError):
        with patch.object(db_session, "add", side_effect=mock_add):
            client.post("/api/v1/helpdesk/requests", json=payload)

    # Query fresh session to verify atomic rollback in SQLite database
    fresh_session = TestingSessionLocal()
    try:
        assert fresh_session.query(HelpdeskRequest).count() == 0
    finally:
        fresh_session.close()


def test_helpdesk_emergency_flagging(client):
    payload = {
        "title": "Smoke detected in electrical closet",
        "description": "Thick smoke and flame coming from main circuit breaker in Library basement!",
    }
    res = client.post("/api/v1/helpdesk/requests", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["is_emergency_flagged"] is True


def test_helpdesk_status_and_department_updates(client):
    req_res = client.post("/api/v1/helpdesk/requests", json={
        "title": "Broken window lock",
        "description": "Ground floor window latch loose.",
    })
    req_id = req_res.json()["id"]

    # Reassign department
    res_assign = client.patch(f"/api/v1/helpdesk/requests/{req_id}/assign", json={"department": "Security", "reason": "Security risk"})
    assert res_assign.status_code == 200
    assert res_assign.json()["assigned_department"] == "Security"

    # Status update to In_Progress
    res_status = client.patch(f"/api/v1/helpdesk/requests/{req_id}/status", json={"status": "In_Progress", "reason": "Officer dispatched to inspect"})
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "In_Progress"


def test_helpdesk_status_update_rollback_on_history_failure(client, db_session):
    req_res = client.post("/api/v1/helpdesk/requests", json={
        "title": "Broken Desk Chair",
        "description": "Wobbly leg on office chair.",
    })
    req_id = req_res.json()["id"]

    original_add = db_session.add

    def mock_add(obj):
        if isinstance(obj, HelpdeskHistory):
            raise RuntimeError("Simulated history failure during status update")
        return original_add(obj)

    with pytest.raises(RuntimeError):
        with patch.object(db_session, "add", side_effect=mock_add):
            client.patch(f"/api/v1/helpdesk/requests/{req_id}/status", json={"status": "In_Progress"})

    # Query fresh session to verify atomic rollback in SQLite database
    fresh_session = TestingSessionLocal()
    try:
        req = fresh_session.query(HelpdeskRequest).filter(HelpdeskRequest.id == req_id).first()
        assert req.status == "Open"
    finally:
        fresh_session.close()
