def test_route_computation_success(client):
    # Seed campus graph
    client.post("/api/v1/campus/seed-demo-data")
    locs = client.get("/api/v1/campus/locations").json()

    origin_id = locs[0]["id"]  # Gate
    dest_id = locs[3]["id"]    # Science Lab

    res = client.post("/api/v1/routing/calculate-route", json={
        "origin_id": origin_id,
        "destination_id": dest_id,
        "avoid_hazards": True,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["route_found"] is True
    assert len(data["path"]) >= 2
    assert data["total_distance_meters"] > 0
    assert data["is_prototype_recommendation"] is True
    assert "PROTOTYPE" in data["disclaimer"]


def test_route_same_origin_and_destination(client):
    client.post("/api/v1/campus/seed-demo-data")
    locs = client.get("/api/v1/campus/locations").json()

    loc_id = locs[0]["id"]
    res = client.post("/api/v1/routing/calculate-route", json={
        "origin_id": loc_id,
        "destination_id": loc_id,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["route_found"] is True
    assert data["total_distance_meters"] == 0.0
    assert len(data["path"]) == 1


def test_routing_exclusion_of_hazardous_location(client):
    client.post("/api/v1/campus/seed-demo-data")
    locs = client.get("/api/v1/campus/locations").json()
    admin_loc_id = locs[1]["id"]  # Admin block

    # Add hazard at Admin block
    client.post("/api/v1/campus/hazards", json={
        "title": "Severe Fire in Admin Block",
        "location_id": admin_loc_id,
        "hazard_type": "Fire",
        "severity": "Critical",
    })

    # Try routing from Admin block (hazardous) -> should be rejected with HTTP 400
    res = client.post("/api/v1/routing/calculate-route", json={
        "origin_id": admin_loc_id,
        "destination_id": locs[2]["id"],
        "avoid_hazards": True,
    })
    assert res.status_code == 400
    assert "active hazards" in res.json()["detail"].lower()
