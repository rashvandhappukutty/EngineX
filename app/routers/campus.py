from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Location, Hazard, LocationEdge
from app.schemas.campus import (
    LocationCreate,
    LocationUpdate,
    LocationResponse,
    HazardCreate,
    HazardUpdate,
    HazardResponse,
    LocationEdgeCreate,
    LocationEdgeResponse,
    CampusGraphResponse,
)
from app.core.config import settings

router = APIRouter(prefix="/campus", tags=["Campus Locations & Hazards"])


# --- Locations ---
@router.post("/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED, summary="Add Campus Location")
def create_location(
    loc_in: LocationCreate,
    db: Session = Depends(get_db),
):
    existing = db.query(Location).filter(Location.code == loc_in.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Location code '{loc_in.code}' already exists.",
        )
    db_loc = Location(**loc_in.model_dump())
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc


@router.get("/locations", response_model=List[LocationResponse], summary="List Campus Locations")
def list_locations(
    is_blocked: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Location)
    if is_blocked is not None:
        query = query.filter(Location.is_blocked == is_blocked)
    return query.order_by(Location.code.asc()).all()


@router.get("/locations/{location_id}", response_model=LocationResponse, summary="Get Campus Location Details")
def get_location(
    location_id: int,
    db: Session = Depends(get_db),
):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with ID {location_id} not found.",
        )
    return loc


# --- Hazards ---
@router.post("/hazards", response_model=HazardResponse, status_code=status.HTTP_201_CREATED, summary="Report a Campus Hazard")
def create_hazard(
    haz_in: HazardCreate,
    db: Session = Depends(get_db),
):
    loc = db.query(Location).filter(Location.id == haz_in.location_id).first()
    if not loc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Referenced location_id {haz_in.location_id} does not exist.",
        )
    db_haz = Hazard(**haz_in.model_dump())
    db.add(db_haz)
    db.commit()
    db.refresh(db_haz)
    return db_haz


@router.get("/hazards", response_model=List[HazardResponse], summary="List Campus Hazards")
def list_hazards(
    is_active: Optional[bool] = Query(True),
    db: Session = Depends(get_db),
):
    query = db.query(Hazard)
    if is_active is not None:
        query = query.filter(Hazard.is_active == is_active)
    return query.order_by(Hazard.reported_at.desc()).all()


@router.patch("/hazards/{hazard_id}", response_model=HazardResponse, summary="Update Hazard Status")
def update_hazard(
    hazard_id: int,
    update_in: HazardUpdate,
    db: Session = Depends(get_db),
):
    haz = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not haz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hazard with ID {hazard_id} not found.",
        )
    for field, val in update_in.model_dump(exclude_unset=True).items():
        setattr(haz, field, val)
    db.commit()
    db.refresh(haz)
    return haz


# --- Edges & Graph ---
@router.post("/edges", response_model=LocationEdgeResponse, status_code=status.HTTP_201_CREATED, summary="Add Connectivity Edge")
def create_edge(
    edge_in: LocationEdgeCreate,
    db: Session = Depends(get_db),
):
    if not db.query(Location).filter(Location.id == edge_in.source_id).first():
        raise HTTPException(status_code=400, detail=f"Source location ID {edge_in.source_id} not found.")
    if not db.query(Location).filter(Location.id == edge_in.target_id).first():
        raise HTTPException(status_code=400, detail=f"Target location ID {edge_in.target_id} not found.")

    db_edge = LocationEdge(**edge_in.model_dump())
    db.add(db_edge)
    db.commit()
    db.refresh(db_edge)
    return db_edge


@router.get("/edges", response_model=List[LocationEdgeResponse], summary="List Connectivity Edges")
def list_edges(db: Session = Depends(get_db)):
    return db.query(LocationEdge).all()


@router.get("/graph", response_model=CampusGraphResponse, summary="Get Full Campus Connectivity Graph")
def get_campus_graph(db: Session = Depends(get_db)):
    locs = db.query(Location).all()
    edges = db.query(LocationEdge).all()
    hazards = db.query(Hazard).filter(Hazard.is_active == True).all()

    return CampusGraphResponse(
        locations=locs,
        edges=edges,
        active_hazards=hazards,
        disclaimer=settings.SAFETY_DISCLAIMER,
    )


@router.post("/seed-demo-data", summary="Seed Campus Demo Graph & Teams (Prototype helper)")
def seed_demo_data(db: Session = Depends(get_db)):
    """Populates the database with clearly labeled demo campus locations, edges, teams, and sample hazards."""
    if db.query(Location).count() > 0:
        return {"message": "Campus locations already populated.", "status": "existing_data_preserved"}

    # Create demo locations
    loc_main_gate = Location(code="GATE-01", name="Main Campus Gate", location_type="Gate", description="Primary entrance")
    loc_admin = Location(code="BLD-ADM", name="Administration Building", location_type="Building", description="Central Admin Complex")
    loc_eng = Location(code="BLD-ENG", name="Engineering Block A", location_type="Building", description="Departments of CS and EE")
    loc_sci = Location(code="BLD-SCI", name="Science Laboratory", location_type="Building", description="Chemistry and Biotech Labs")
    loc_lib = Location(code="BLD-LIB", name="Central Library", location_type="Building", description="4-story library")
    loc_field = Location(code="ASM-01", name="Main Sports Ground", location_type="Assembly Area", description="Designated emergency assembly area")

    db.add_all([loc_main_gate, loc_admin, loc_eng, loc_sci, loc_lib, loc_field])
    db.commit()

    # Create edges
    e1 = LocationEdge(source_id=loc_main_gate.id, target_id=loc_admin.id, distance_meters=100.0)
    e2 = LocationEdge(source_id=loc_admin.id, target_id=loc_eng.id, distance_meters=150.0)
    e3 = LocationEdge(source_id=loc_admin.id, target_id=loc_sci.id, distance_meters=120.0)
    e4 = LocationEdge(source_id=loc_eng.id, target_id=loc_lib.id, distance_meters=80.0)
    e5 = LocationEdge(source_id=loc_sci.id, target_id=loc_lib.id, distance_meters=90.0)
    e6 = LocationEdge(source_id=loc_lib.id, target_id=loc_field.id, distance_meters=200.0)

    db.add_all([e1, e2, e3, e4, e5, e6])

    # Add demo teams if none exist
    from app.db.models import Team
    if db.query(Team).count() == 0:
        t1 = Team(name="Alpha Fire Response", capabilities="firefighting,evacuation", availability_status="Available", contact_info="Ext 101")
        t2 = Team(name="Beta Medical Squad", capabilities="first_aid,paramedic", availability_status="Available", contact_info="Ext 102")
        t3 = Team(name="Campus Security 1", capabilities="security,crowd_control", availability_status="Available", contact_info="Ext 103")
        db.add_all([t1, t2, t3])

    db.commit()

    return {"message": "Campus demo graph and response teams initialized successfully.", "status": "seeded"}
