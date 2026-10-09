def test_dashboard_empty_database(client):
    res = client.get("/api/v1/dashboard/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["incidents"]["total"] == 0
    assert data["teams"]["total_teams"] == 0
    assert data["assignments"]["total_assignments"] == 0
    assert data["helpdesk"]["total_requests"] == 0
    assert data["active_hazards_count"] == 0


def test_dashboard_populated_metrics(client):
    # Populate data
    client.post("/api/v1/reports", json={"title": "Test Inc", "description": "Desc test", "category": "Fire", "severity": "Critical", "location_name": "Auditorium"})
    client.post("/api/v1/teams", json={"name": "Fire Team A", "capabilities": ["firefighting"]})
    client.post("/api/v1/helpdesk/requests", json={"title": "Printer broken", "description": "Paper jam in main office"})

    res = client.get("/api/v1/dashboard/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["incidents"]["total"] == 1
    assert data["teams"]["total_teams"] == 1
    assert data["helpdesk"]["total_requests"] == 1
