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
