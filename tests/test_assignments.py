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
