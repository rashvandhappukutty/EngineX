from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="Reported", index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    location_name = Column(String(255), nullable=False)
    reporter_metadata = Column(Text, nullable=True)
    priority_score = Column(Float, nullable=False, default=0.0)
    ai_suggested_category = Column(String(50), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    location = relationship("Location", back_populates="incidents")
    history = relationship("IncidentHistory", back_populates="incident", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="incident", cascade="all, delete-orphan")


class IncidentHistory(Base):
    __tablename__ = "incident_history"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    change_reason = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    incident = relationship("Incident", back_populates="history")


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    location_type = Column(String(50), nullable=False)  # Building, Block, Corridor, Assembly Area, Gate, Parking, Other
    description = Column(Text, nullable=True)
    operational_state = Column(String(30), nullable=False, default="Operational")  # Operational, Restricted, Closed
    is_blocked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    incidents = relationship("Incident", back_populates="location")
    hazards = relationship("Hazard", back_populates="location", cascade="all, delete-orphan")
    outgoing_edges = relationship(
        "LocationEdge",
        foreign_keys="LocationEdge.source_id",
        back_populates="source_location",
        cascade="all, delete-orphan",
    )
    incoming_edges = relationship(
        "LocationEdge",
        foreign_keys="LocationEdge.target_id",
        back_populates="target_location",
        cascade="all, delete-orphan",
    )


class Hazard(Base):
    __tablename__ = "hazards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    hazard_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    reported_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    location = relationship("Location", back_populates="hazards")


class LocationEdge(Base):
    __tablename__ = "location_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    target_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    distance_meters = Column(Float, nullable=False, default=1.0)
    is_bidirectional = Column(Boolean, default=True, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)

    source_location = relationship("Location", foreign_keys=[source_id], back_populates="outgoing_edges")
    target_location = relationship("Location", foreign_keys=[target_id], back_populates="incoming_edges")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    capabilities = Column(Text, nullable=False, default="")  # comma-separated capabilities
    availability_status = Column(String(30), nullable=False, default="Available", index=True)  # Available, On_Mission, Off_Duty, Maintenance
    contact_info = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    assignments = relationship("Assignment", back_populates="team")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="Assigned", index=True)  # Assigned, Dispatched, On_Scene, Completed, Cancelled
    notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    incident = relationship("Incident", back_populates="assignments")
    team = relationship("Team", back_populates="assignments")
    history = relationship("AssignmentHistory", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentHistory(Base):
    __tablename__ = "assignment_history"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False, index=True)
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    notes = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    assignment = relationship("Assignment", back_populates="history")


class HelpdeskRequest(Base):
    __tablename__ = "helpdesk_requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)  # IT Support, Facilities, Maintenance, Security, Administration, Other
    priority = Column(String(20), nullable=False, default="Medium", index=True)  # Low, Medium, High, Urgent
    status = Column(String(30), nullable=False, default="Open", index=True)  # Open, In_Progress, Pending, Resolved, Closed
    assigned_department = Column(String(50), nullable=False, default="General", index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    location_name = Column(String(255), nullable=True)
    reporter_metadata = Column(Text, nullable=True)
    is_emergency_flagged = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    location = relationship("Location")
    history = relationship("HelpdeskHistory", back_populates="request", cascade="all, delete-orphan")


class HelpdeskHistory(Base):
    __tablename__ = "helpdesk_history"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("helpdesk_requests.id"), nullable=False, index=True)
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    previous_department = Column(String(50), nullable=True)
    new_department = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    request = relationship("HelpdeskRequest", back_populates="history")
