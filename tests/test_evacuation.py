"""Tests for safety-constrained evacuation pathfinding using verified campus graph data."""

import pytest
from ai.evacuation import recommend_evacuation_routes


@pytest.fixture
def sample_campus_map():
    """Approved sample campus building topology."""
    return {
        "nodes": ["Room_101", "Hallway_A", "Hallway_B", "Stairwell_1", "Stairwell_2", "Exit_North", "Exit_South"],
        "edges": [
            {"from": "Room_101", "to": "Hallway_A", "weight": 5.0},
            {"from": "Hallway_A", "to": "Stairwell_1", "weight": 10.0},
            {"from": "Stairwell_1", "to": "Exit_North", "weight": 5.0},
            {"from": "Room_101", "to": "Hallway_B", "weight": 6.0},
            {"from": "Hallway_B", "to": "Stairwell_2", "weight": 10.0},
            {"from": "Stairwell_2", "to": "Exit_South", "weight": 5.0},
        ],
        "exits": ["Exit_North", "Exit_South"],
        "accessible_nodes": {
            "Room_101": True, "Hallway_A": True, "Hallway_B": True,
            "Stairwell_1": False, "Stairwell_2": True,
            "Exit_North": False, "Exit_South": True
        }
    }


def test_evacuation_route_avoids_hazard(sample_campus_map):
    """Verify routing selects alternative path when primary corridor is blocked by hazard."""
    result = recommend_evacuation_routes(
        start_location="Room_101",
        map_data=sample_campus_map,
        hazard_zones=["Hallway_A"],
    )
    assert result.safe_route_verified is True
    assert len(result.routes) == 1
    route = result.routes[0]
    assert "Hallway_A" not in route.path
    assert route.destination_exit == "Exit_South"
    assert "Hallway_B" in route.path


def test_evacuation_no_safe_route_verified(sample_campus_map):
    """Verify that when all exits/paths are compromised, the system reports no safe route without blanket door sealing."""
    result = recommend_evacuation_routes(
        start_location="Room_101",
        map_data=sample_campus_map,
        hazard_zones=["Hallway_A", "Hallway_B"],
    )
    assert result.safe_route_verified is False
    assert len(result.routes) == 0
    assert "NO SAFE ROUTE VERIFIED" in result.rationale
    assert "approved campus emergency procedures" in result.rationale
    assert "door sealing" not in result.rationale.lower()  # Defect 4 fix


def test_evacuation_missing_map_data():
    """Verify system does not invent map data when topology is unavailable."""
    result = recommend_evacuation_routes(
        start_location="Room_101",
        map_data=None,
    )
    assert result.safe_route_verified is False
    assert "missing verified campus map" in result.rationale.lower()


def test_evacuation_missing_accessibility_data_when_required(sample_campus_map):
    """Verify route cannot be marked verified accessible when accessibility annotations are missing."""
    map_without_accessibility = dict(sample_campus_map)
    map_without_accessibility["accessible_nodes"] = None

    result = recommend_evacuation_routes(
        start_location="Room_101",
        map_data=map_without_accessibility,
        requires_accessible=True,
    )
    # Must NOT verify accessibility when accessibility data is missing
    assert result.safe_route_verified is False
    assert "ACCESSIBILITY UNVERIFIED" in result.rationale
    assert "missing accessibility topology data" in result.rationale.lower()


def test_evacuation_accessible_alternative_selection(sample_campus_map):
    """Verify route selects accessible path (Stairwell 2) over shorter inaccessible path (Stairwell 1)."""
    result = recommend_evacuation_routes(
        start_location="Room_101",
        map_data=sample_campus_map,
        requires_accessible=True,
    )
    assert result.safe_route_verified is True
    assert len(result.routes) == 1
    route = result.routes[0]
    # Exit_South is accessible, Exit_North is not
    assert route.destination_exit == "Exit_South"
    assert "Stairwell_2" in route.path
    assert "Stairwell_1" not in route.path


def test_evacuation_inaccessible_corridor_blocks_accessibility():
    """Verify route fails accessibility verification when only standard non-accessible stairs exist."""
    map_stairs_only = {
        "nodes": ["Room_201", "Stairs_Only", "Exit_Main"],
        "edges": [
            {"from": "Room_201", "to": "Stairs_Only", "weight": 5.0},
            {"from": "Stairs_Only", "to": "Exit_Main", "weight": 5.0},
        ],
        "exits": ["Exit_Main"],
        "accessible_nodes": {
            "Room_201": True,
            "Stairs_Only": False,  # Not wheelchair accessible
            "Exit_Main": True,
        }
    }

    result = recommend_evacuation_routes(
        start_location="Room_201",
        map_data=map_stairs_only,
        requires_accessible=True,
    )
    assert result.safe_route_verified is False
    assert "NO STEP-FREE ROUTE VERIFIED" in result.rationale
