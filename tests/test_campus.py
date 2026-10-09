def test_create_and_get_location(client):
    loc_payload = {
        "code": "BLD-LIB",
        "name": "Central Library Building",
        "location_type": "Building",
        "description": "Main 4-floor library building",
        "operational_state": "Operational",
    }
    res = client.post("/api/v1/campus/locations", json=loc_payload)
    assert res.status_code == 201
    loc_id = res.json()["id"]

    res_get = client.get(f"/api/v1/campus/locations/{loc_id}")
    assert res_get.status_code == 200
    assert res_get.json()["code"] == "BLD-LIB"


def test_hazard_reporting_and_resolution(client):
    loc_res = client.post("/api/v1/campus/locations", json={
        "code": "BLD-CHEM",
        "name": "Chemistry Building",
        "location_type": "Building",
    })
    loc_id = loc_res.json()["id"]

    haz_res = client.post("/api/v1/campus/hazards", json={
        "title": "Gas Leak in Basement",
        "location_id": loc_id,
        "hazard_type": "Gas Leak",
        "severity": "High",
        "description": "Smell of gas detected near storage",
    })
    assert haz_res.status_code == 201
    haz_id = haz_res.json()["id"]

    # Verify hazard is active
    haz_list = client.get("/api/v1/campus/hazards?is_active=true")
    assert haz_list.status_code == 200
    assert len(haz_list.json()) == 1

    # Resolve hazard
    haz_update = client.patch(f"/api/v1/campus/hazards/{haz_id}", json={"is_active": False})
    assert haz_update.status_code == 200
    assert haz_update.json()["is_active"] is False


def test_seed_demo_data(client):
    res = client.post("/api/v1/campus/seed-demo-data")
    assert res.status_code == 200
    assert res.json()["status"] == "seeded"

    # Check graph endpoint
    graph_res = client.get("/api/v1/campus/graph")
    assert graph_res.status_code == 200
    data = graph_res.json()
    assert len(data["locations"]) > 0
    assert len(data["edges"]) > 0
    assert "PROTOTYPE" in data["disclaimer"]
