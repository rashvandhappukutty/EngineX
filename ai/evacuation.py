"""Safe evacuation decision support layer based strictly on verified campus graph data."""

from __future__ import annotations

import heapq
from typing import Any, Dict, List, Optional, Set

from ai.schemas import (
    EvacuationRecommendation,
    EvacuationRoute,
)


def _dijkstra_safest_path(
    graph: Dict[str, Dict[str, float]],
    start: str,
    exits: Set[str],
    blocked_nodes: Set[str],
    accessibility_map: Optional[Dict[str, bool]] = None,
    requires_accessible: bool = False,
) -> Optional[EvacuationRoute]:
    """
    Find the shortest path from start to the nearest accessible exit avoiding blocked nodes.
    """
    if start in blocked_nodes:
        return None

    # Priority queue stores (distance, current_node, path)
    pq: List[tuple[float, str, List[str]]] = [(0.0, start, [start])]
    visited: Dict[str, float] = {}

    best_route: Optional[EvacuationRoute] = None
    min_dist = float("inf")

    while pq:
        dist, current, path = heapq.heappop(pq)

        if current in visited and visited[current] <= dist:
            continue
        visited[current] = dist

        # Reached an exit
        if current in exits:
            if dist < min_dist:
                min_dist = dist
                best_route = EvacuationRoute(
                    start_node=start,
                    destination_exit=current,
                    path=path,
                    distance_units=dist,
                    avoided_hazards=list(blocked_nodes),
                    selection_reason=(
                        f"Shortest verified safe path to exit '{current}' "
                        f"avoiding {len(blocked_nodes)} active hazard/blocked zone(s)."
                    ),
                )
            continue

        neighbors = graph.get(current, {})
        for neighbor, weight in neighbors.items():
            if neighbor in blocked_nodes:
                continue

            # Accessibility check
            if requires_accessible and accessibility_map:
                if not accessibility_map.get(neighbor, True):
                    continue

            new_dist = dist + weight
            if neighbor not in visited or new_dist < visited[neighbor]:
                heapq.heappush(pq, (new_dist, neighbor, path + [neighbor]))

    return best_route


def recommend_evacuation_routes(
    start_location: Optional[str],
    map_data: Optional[Dict[str, Any]] = None,
    hazard_zones: Optional[List[str]] = None,
    blocked_paths: Optional[List[str]] = None,
    requires_accessible: bool = False,
) -> EvacuationRecommendation:
    """
    Calculate safety-constrained evacuation route recommendations using verified map data only.

    Args:
        start_location: The current room, wing, or building node.
        map_data: Approved campus topology dictionary containing 'nodes', 'edges', 'exits'.
        hazard_zones: List of nodes/zones currently deemed hazardous (e.g. fire, chemical spill).
        blocked_paths: List of corridors/exits confirmed blocked.
        requires_accessible: Whether step-free / wheelchair accessibility is mandatory.

    Returns:
        EvacuationRecommendation with safe routes, avoided hazards, or explicit safety warnings.
    """
    disclaimers = [
        "Advisory Decision Support Only: Evacuation orders require official broadcast by authorized campus personnel.",
        "Routing calculations rely exclusively on verified campus map topologies; real-time physical conditions may vary.",
    ]

    if not map_data or not isinstance(map_data, dict):
        return EvacuationRecommendation(
            is_evacuation_advised=False,
            safe_route_verified=False,
            routes=[],
            blocked_or_hazardous_zones=hazard_zones or [],
            accessibility_notes=["Accessibility data unavailable"],
            limitations_and_disclaimers=disclaimers + ["No approved campus map topology provided."],
            rationale="Cannot calculate evacuation routes: missing verified campus map topology data.",
        )

    if not start_location:
        return EvacuationRecommendation(
            is_evacuation_advised=False,
            safe_route_verified=False,
            routes=[],
            blocked_or_hazardous_zones=hazard_zones or [],
            accessibility_notes=[],
            limitations_and_disclaimers=disclaimers + ["Start location unspecified."],
            rationale="Cannot calculate evacuation route: start location unspecified.",
        )

    # Parse graph structure
    raw_edges = map_data.get("edges", [])
    raw_exits = set(map_data.get("exits", []))
    accessibility_map = map_data.get("accessible_nodes", {})

    graph: Dict[str, Dict[str, float]] = {}
    for edge in raw_edges:
        u = edge.get("from")
        v = edge.get("to")
        w = float(edge.get("weight", 1.0))
        if u and v:
            if u not in graph:
                graph[u] = {}
            if v not in graph:
                graph[v] = {}
            graph[u][v] = w
            if edge.get("bidirectional", True):
                graph[v][u] = w

    # Build blocked set
    blocked_set: Set[str] = set(hazard_zones or []) | set(blocked_paths or [])

    if start_location not in graph:
        return EvacuationRecommendation(
            is_evacuation_advised=True,
            safe_route_verified=False,
            routes=[],
            blocked_or_hazardous_zones=list(blocked_set),
            accessibility_notes=[],
            limitations_and_disclaimers=disclaimers + [f"Start node '{start_location}' not found in map topology."],
            rationale=f"Start node '{start_location}' not present in verified map dataset.",
        )

    if not raw_exits:
        return EvacuationRecommendation(
            is_evacuation_advised=True,
            safe_route_verified=False,
            routes=[],
            blocked_or_hazardous_zones=list(blocked_set),
            accessibility_notes=[],
            limitations_and_disclaimers=disclaimers + ["No designated exit nodes registered in map topology."],
            rationale="No verified emergency exits registered in campus map data.",
        )

    # Calculate optimal safe path
    route = _dijkstra_safest_path(
        graph=graph,
        start=start_location,
        exits=raw_exits,
        blocked_nodes=blocked_set,
        accessibility_map=accessibility_map,
        requires_accessible=requires_accessible,
    )

    if not route:
        return EvacuationRecommendation(
            is_evacuation_advised=True,
            safe_route_verified=False,
            routes=[],
            blocked_or_hazardous_zones=list(blocked_set),
            accessibility_notes=["No accessible safe passage identified"] if requires_accessible else [],
            limitations_and_disclaimers=disclaimers + [
                "All known paths to exits are obstructed by active hazard zones or physical blockages."
            ],
            rationale=(
                f"NO SAFE ROUTE VERIFIED from '{start_location}'. All standard corridors intersect active hazards ({', '.join(blocked_set)}). "
                "Recommend immediate shelter-in-place, door sealing, and priority dispatch of Emergency Response Team."
            ),
        )

    return EvacuationRecommendation(
        is_evacuation_advised=True,
        safe_route_verified=True,
        routes=[route],
        blocked_or_hazardous_zones=list(blocked_set),
        accessibility_notes=["Route verified step-free accessible"] if requires_accessible else [],
        limitations_and_disclaimers=disclaimers,
        rationale=f"Safe evacuation route identified to Exit '{route.destination_exit}' ({route.distance_units} units).",
    )
