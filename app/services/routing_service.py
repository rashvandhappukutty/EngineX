import heapq
import logging
from typing import List, Dict, Tuple, Set, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import Location, Hazard, LocationEdge
from app.schemas.routing import RouteRequest, RouteResponse, RouteStep
from app.core.config import settings

logger = logging.getLogger("enginex.routing_service")


class RoutingService:
    @staticmethod
    def compute_route(db: Session, request: RouteRequest) -> RouteResponse:
        origin = db.query(Location).filter(Location.id == request.origin_id).first()
        destination = db.query(Location).filter(Location.id == request.destination_id).first()

        if not origin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Origin location ID {request.origin_id} does not exist.",
            )
        if not destination:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Destination location ID {request.destination_id} does not exist.",
            )

        warnings: List[str] = [settings.SAFETY_DISCLAIMER]

        # Check for active hazards / blocked state on origin and destination
        active_hazards_query = db.query(Hazard).filter(Hazard.is_active == True)
        hazardous_location_ids: Set[int] = {h.location_id for h in active_hazards_query.all()}
        blocked_location_ids: Set[int] = {l.id for l in db.query(Location).filter(Location.is_blocked == True).all()}

        if request.avoid_hazards:
            if origin.id in blocked_location_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Origin location '{origin.name}' (ID {origin.id}) is explicitly marked BLOCKED.",
                )
            if origin.id in hazardous_location_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Origin location '{origin.name}' (ID {origin.id}) currently has active HAZARDS.",
                )
            if destination.id in blocked_location_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Destination location '{destination.name}' (ID {destination.id}) is explicitly marked BLOCKED.",
                )
            if destination.id in hazardous_location_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Destination location '{destination.name}' (ID {destination.id}) currently has active HAZARDS.",
                )

        # Handle origin == destination
        if origin.id == destination.id:
            step = RouteStep(
                step_number=1,
                location_id=origin.id,
                location_code=origin.code,
                location_name=origin.name,
                distance_from_previous_meters=0.0,
            )
            warnings.append("Origin and destination are the same location.")
            return RouteResponse(
                origin_id=origin.id,
                destination_id=destination.id,
                route_found=True,
                path=[step],
                total_distance_meters=0.0,
                warnings=warnings,
                is_prototype_recommendation=True,
                disclaimer=settings.SAFETY_DISCLAIMER,
            )

        # Build adjacency graph from location_edges table
        edges = db.query(LocationEdge).all()
        adj: Dict[int, List[Tuple[int, float]]] = {}

        for edge in edges:
            if request.avoid_hazards and edge.is_blocked:
                continue

            u, v, dist = edge.source_id, edge.target_id, edge.distance_meters

            # If node u or v is blocked or hazardous, exclude
            if request.avoid_hazards:
                if u in blocked_location_ids or u in hazardous_location_ids:
                    continue
                if v in blocked_location_ids or v in hazardous_location_ids:
                    continue

            adj.setdefault(u, []).append((v, dist))
            if edge.is_bidirectional:
                adj.setdefault(v, []).append((u, dist))

        # Dijkstra's shortest path
        distances: Dict[int, float] = {origin.id: 0.0}
        predecessors: Dict[int, Tuple[int, float]] = {}
        pq: List[Tuple[float, int]] = [(0.0, origin.id)]
        visited: Set[int] = set()

        while pq:
            curr_dist, u = heapq.heappop(pq)

            if u in visited:
                continue
            visited.add(u)

            if u == destination.id:
                break

            for v, dist in adj.get(u, []):
                if v in visited:
                    continue
                new_dist = curr_dist + dist
                if v not in distances or new_dist < distances[v]:
                    distances[v] = new_dist
                    predecessors[v] = (u, dist)
                    heapq.heappush(pq, (new_dist, v))

        if destination.id not in distances:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No navigable route found from '{origin.name}' to '{destination.name}' excluding hazards/blocked areas.",
            )

        # Reconstruct path
        path_nodes: List[Tuple[int, float]] = []
        curr = destination.id
        while curr != origin.id:
            prev, step_dist = predecessors[curr]
            path_nodes.append((curr, step_dist))
            curr = prev
        path_nodes.append((origin.id, 0.0))
        path_nodes.reverse()

        # Fetch location details for path
        loc_ids = [nid for nid, _ in path_nodes]
        loc_map = {loc.id: loc for loc in db.query(Location).filter(Location.id.in_(loc_ids)).all()}

        steps: List[RouteStep] = []
        for idx, (nid, step_dist) in enumerate(path_nodes, start=1):
            loc_obj = loc_map.get(nid)
            steps.append(
                RouteStep(
                    step_number=idx,
                    location_id=nid,
                    location_code=loc_obj.code if loc_obj else f"LOC-{nid}",
                    location_name=loc_obj.name if loc_obj else f"Location {nid}",
                    distance_from_previous_meters=step_dist,
                )
            )

        return RouteResponse(
            origin_id=origin.id,
            destination_id=destination.id,
            route_found=True,
            path=steps,
            total_distance_meters=round(distances[destination.id], 2),
            warnings=warnings,
            is_prototype_recommendation=True,
            disclaimer=settings.SAFETY_DISCLAIMER,
        )


routing_service = RoutingService()
