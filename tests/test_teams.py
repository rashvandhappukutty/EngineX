from app.db.models import Team


def test_team_registration(client):
    payload = {
        "name": "Alpha Hazmat Response",
        "capabilities": ["hazmat", "chemical_safety", "containment"],
        "contact_info": "Radio channel 5",
    }
    res = client.post("/api/v1/teams", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["id"] > 0
    assert data["name"] == payload["name"]
    assert "hazmat" in data["capabilities"]
    assert data["availability_status"] == "Available"


def test_team_registration_duplicate_name_rejected(client):
    payload = {
        "name": "Bravo Medical Team",
        "capabilities": ["first_aid"],
    }
    res1 = client.post("/api/v1/teams", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/teams", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_update_team_availability(client):
    res_create = client.post("/api/v1/teams", json={
        "name": "Charlie Security Unit",
        "capabilities": ["patrol", "crowd_control"],
    })
    team_id = res_create.json()["id"]

    res_patch = client.patch(f"/api/v1/teams/{team_id}/availability", json={"availability_status": "Maintenance"})
    assert res_patch.status_code == 200
    assert res_patch.json()["availability_status"] == "Maintenance"


def test_cannot_set_actively_assigned_team_to_available_offduty_or_maintenance(client):
    inc_res = client.post("/api/v1/reports", json={
        "title": "Gas Pipe Leak",
        "description": "Gas odor in utility room.",
        "category": "Infrastructure",
        "severity": "High",
        "location_name": "Utility Room",
    })
    inc_id = inc_res.json()["id"]

    team_res = client.post("/api/v1/teams", json={
        "name": "Gas Response Squad",
        "capabilities": ["plumbing", "gas_safety"],
    })
    team_id = team_res.json()["id"]

    client.post("/api/v1/assignments", json={"incident_id": inc_id, "team_id": team_id})

    res_avail = client.patch(f"/api/v1/teams/{team_id}/availability", json={"availability_status": "Available"})
    assert res_avail.status_code == 400
    assert "active assignment" in res_avail.json()["detail"].lower()

    res_off = client.patch(f"/api/v1/teams/{team_id}/availability", json={"availability_status": "Off_Duty"})
    assert res_off.status_code == 400
    assert "active assignment" in res_off.json()["detail"].lower()

    res_maint = client.patch(f"/api/v1/teams/{team_id}/availability", json={"availability_status": "Maintenance"})
    assert res_maint.status_code == 400
    assert "active assignment" in res_maint.json()["detail"].lower()

    team_check = client.get(f"/api/v1/teams/{team_id}").json()
    assert team_check["availability_status"] == "On_Mission"


def test_actively_assigned_team_marked_available_rejects_available_patch(client, db_session):
    inc_res = client.post("/api/v1/reports", json={
        "title": "Water Pipe Break",
        "description": "Flooding in basement.",
        "category": "Infrastructure",
        "severity": "Medium",
        "location_name": "Basement",
    })
    inc_id = inc_res.json()["id"]

    team_res = client.post("/api/v1/teams", json={
        "name": "Plumbing Rescue Alpha",
        "capabilities": ["plumbing"],
    })
    team_id = team_res.json()["id"]

    client.post("/api/v1/assignments", json={"incident_id": inc_id, "team_id": team_id})

    team_obj = db_session.query(Team).filter(Team.id == team_id).first()
    team_obj.availability_status = "Available"
    db_session.commit()

    res_patch = client.patch(f"/api/v1/teams/{team_id}/availability", json={"availability_status": "Available"})
    assert res_patch.status_code == 400
    assert "active assignment" in res_patch.json()["detail"].lower()


def test_change_availability_for_unassigned_team(client):
    team_res = client.post("/api/v1/teams", json={
        "name": "Standby Electrical Unit",
        "capabilities": ["electrical"],
    })
    team_id = team_res.json()["id"]

    res_off = client.patch(f"/api/v1/teams/{team_id}/availability", json={"availability_status": "Off_Duty"})
    assert res_off.status_code == 200
    assert res_off.json()["availability_status"] == "Off_Duty"

    res_maint = client.patch(f"/api/v1/teams/{team_id}/availability", json={"availability_status": "Maintenance"})
    assert res_maint.status_code == 200
    assert res_maint.json()["availability_status"] == "Maintenance"

    res_avail = client.patch(f"/api/v1/teams/{team_id}/availability", json={"availability_status": "Available"})
    assert res_avail.status_code == 200
    assert res_avail.json()["availability_status"] == "Available"


def test_update_nonexistent_team_availability_returns_404(client):
    res = client.patch("/api/v1/teams/999999/availability", json={"availability_status": "Off_Duty"})
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_exact_capability_filtering(client):
    client.post("/api/v1/teams", json={
        "name": "Firefighting Specialists",
        "capabilities": ["firefighting", "rescue"],
    })
    client.post("/api/v1/teams", json={
        "name": "Primary Fire Team",
        "capabilities": ["fire", "first_aid"],
    })
    client.post("/api/v1/teams", json={
        "name": "Smart Inspection Squad",
        "capabilities": ["smart_inspection"],
    })

    # Exact filter 'fire' must match 'Primary Fire Team' ONLY, not 'firefighting'
    res_fire = client.get("/api/v1/teams?capability=fire")
    assert res_fire.status_code == 200
    fire_teams = res_fire.json()
    assert len(fire_teams) == 1
    assert fire_teams[0]["name"] == "Primary Fire Team"

    # Search 'art' must NOT match 'smart_inspection'
    res_art = client.get("/api/v1/teams?capability=art")
    assert res_art.status_code == 200
    assert len(res_art.json()) == 0

    # Search 'firefighting' must match 'Firefighting Specialists' ONLY
    res_ff = client.get("/api/v1/teams?capability=firefighting")
    assert res_ff.status_code == 200
    ff_teams = res_ff.json()
    assert len(ff_teams) == 1
    assert ff_teams[0]["name"] == "Firefighting Specialists"

    # Case and surrounding whitespace handling (' rescue ')
    res_ws = client.get("/api/v1/teams?capability=%20rescue%20")
    assert res_ws.status_code == 200
    assert len(res_ws.json()) == 1
    assert res_ws.json()[0]["name"] == "Firefighting Specialists"


def test_capability_filtering_wildcard_escaping(client):
    client.post("/api/v1/teams", json={
        "name": "Team 100 Percent",
        "capabilities": ["100%_fire", "safety"],
    })
    client.post("/api/v1/teams", json={
        "name": "Team 1000 Fire",
        "capabilities": ["1000_fire", "safety"],
    })
    client.post("/api/v1/teams", json={
        "name": "Chem Safety Squad",
        "capabilities": ["chem_safety"],
    })
    client.post("/api/v1/teams", json={
        "name": "Chem A Safety Squad",
        "capabilities": ["chemAsafety"],
    })

    # Search with literal '%' and '_' wildcards in '100%_fire'
    res_pct = client.get("/api/v1/teams?capability=100%25_fire")
    assert res_pct.status_code == 200
    pct_teams = res_pct.json()
    assert len(pct_teams) == 1
    assert pct_teams[0]["name"] == "Team 100 Percent"

    # Search with '_' wildcard in 'chem_safety'
    res_chem = client.get("/api/v1/teams?capability=chem_safety")
    assert res_chem.status_code == 200
    chem_teams = res_chem.json()
    assert len(chem_teams) == 1
    assert chem_teams[0]["name"] == "Chem Safety Squad"
