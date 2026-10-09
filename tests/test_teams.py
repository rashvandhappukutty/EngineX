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
