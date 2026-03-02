"""
UrjaRakshak — SQLAlchemy ORM Models
====================================
Defines all database tables with proper types, indexes, and relationships.

Tables:
  users          — Authenticated users with roles
  grid_sections  — Substations / grid regions
  components     — Grid components per section
  analyses       — Every physics analysis stored here
  anomaly_results — ML anomaly detection results
  model_versions  — Track trained ML models

Author: Vipin Baniya
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Boolean, Integer,
    DateTime, ForeignKey, Text, Index, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


# ── Users ─────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="viewer")  # admin | analyst | viewer
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    analyses = relationship("Analysis", back_populates="created_by_user", lazy="selectin")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


# ── Grid Sections ─────────────────────────────────────────────────────────

class GridSection(Base):
    __tablename__ = "grid_sections"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    substation_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    region = Column(String(100), nullable=True)
    capacity_mva = Column(Float, nullable=True)
    voltage_kv = Column(Float, nullable=True)
    status = Column(String(50), default="active", nullable=False)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    components = relationship("Component", back_populates="grid_section", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="grid_section", cascade="all, delete-orphan")
    anomaly_results = relationship("AnomalyResult", back_populates="grid_section", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<GridSection {self.substation_id}>"


# ── Components ────────────────────────────────────────────────────────────

class Component(Base):
    __tablename__ = "components"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    grid_section_id = Column(UUID(as_uuid=False), ForeignKey("grid_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    component_id = Column(String(100), nullable=False)
    component_type = Column(String(50), nullable=False)    # transformer | line | meter
    rated_capacity_kva = Column(Float, nullable=True)
    efficiency_rating = Column(Float, nullable=True)
    age_years = Column(Float, nullable=True)
    resistance_ohms = Column(Float, nullable=True)
    length_km = Column(Float, nullable=True)
    voltage_kv = Column(Float, nullable=True)
    load_factor = Column(Float, nullable=True)
    status = Column(String(50), default="active")
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    grid_section = relationship("GridSection", back_populates="components")

    __table_args__ = (
        Index("idx_components_grid_section", "grid_section_id"),
        Index("idx_components_type", "component_type"),
    )

    def __repr__(self):
        return f"<Component {self.component_id} ({self.component_type})>"


# ── Analyses ──────────────────────────────────────────────────────────────

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    grid_section_id = Column(UUID(as_uuid=False), ForeignKey("grid_sections.id", ondelete="CASCADE"), nullable=True, index=True)
    substation_id = Column(String(100), nullable=False, index=True)  # Denormalized for fast lookup

    # Input values
    input_energy_mwh = Column(Float, nullable=False)
    output_energy_mwh = Column(Float, nullable=False)
    time_window_hours = Column(Float, default=24.0)

    # Physics results
    expected_loss_mwh = Column(Float, nullable=True)
    actual_loss_mwh = Column(Float, nullable=True)
    residual_mwh = Column(Float, nullable=True)
    residual_percentage = Column(Float, nullable=True)
    balance_status = Column(String(50), nullable=True)   # balanced | minor_imbalance | etc.
    confidence_score = Column(Float, nullable=True)
    measurement_quality = Column(String(20), nullable=True)

    # Full result JSON (for detailed view)
    physics_result_json = Column(JSON, nullable=True)
    attribution_result_json = Column(JSON, nullable=True)

    # Workflow
    requires_review = Column(Boolean, default=False)
    reviewed = Column(Boolean, default=False)
    review_notes = Column(Text, nullable=True)
    refusal_reason = Column(Text, nullable=True)

    # User
    created_by = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    grid_section = relationship("GridSection", back_populates="analyses")
    created_by_user = relationship("User", back_populates="analyses")

    __table_args__ = (
        Index("idx_analyses_created_at", "created_at"),
        Index("idx_analyses_substation", "substation_id"),
        Index("idx_analyses_status", "balance_status"),
        Index("idx_analyses_residual", "residual_percentage"),
    )

    def __repr__(self):
        return f"<Analysis {self.substation_id} @ {self.created_at}>"


# ── Anomaly Results ───────────────────────────────────────────────────────

class AnomalyResult(Base):
    __tablename__ = "anomaly_results"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    grid_section_id = Column(UUID(as_uuid=False), ForeignKey("grid_sections.id", ondelete="CASCADE"), nullable=True, index=True)
    analysis_id = Column(UUID(as_uuid=False), ForeignKey("analyses.id", ondelete="SET NULL"), nullable=True)
    substation_id = Column(String(100), nullable=False, index=True)

    # ML results
    is_anomaly = Column(Boolean, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    method_used = Column(String(100), nullable=True)
    primary_reason = Column(Text, nullable=True)
    feature_contributions = Column(JSON, nullable=True)
    recommended_action = Column(Text, nullable=True)

    # Lifecycle
    reviewed = Column(Boolean, default=False)
    action_taken = Column(String(100), nullable=True)  # "inspection_scheduled" | "dismissed" | etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    grid_section = relationship("GridSection", back_populates="anomaly_results")

    __table_args__ = (
        Index("idx_anomaly_created_at", "created_at"),
        Index("idx_anomaly_substation", "substation_id"),
        Index("idx_anomaly_score", "anomaly_score"),
    )

    def __repr__(self):
        return f"<AnomalyResult {self.substation_id} score={self.anomaly_score:.3f}>"


# ── Model Versions ────────────────────────────────────────────────────────

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    model_name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    model_type = Column(String(100), nullable=True)          # "IsolationForest"
    n_training_samples = Column(Integer, nullable=True)
    contamination_rate = Column(Float, nullable=True)
    training_score_mean = Column(Float, nullable=True)
    training_score_std = Column(Float, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    trained_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    deployed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_model_versions_name", "model_name"),
        Index("idx_model_versions_active", "is_active"),
    )

    def __repr__(self):
        return f"<ModelVersion {self.model_name} v{self.version}>"


# ── Meter Upload Batch ────────────────────────────────────────────────────

class MeterUploadBatch(Base):
    """Tracks a single CSV/Excel upload session — header record."""
    __tablename__ = "meter_upload_batches"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    filename = Column(String(255), nullable=False)
    substation_id = Column(String(100), nullable=False, index=True)
    row_count = Column(Integer, nullable=False)
    anomalies_detected = Column(Integer, default=0)
    total_energy_kwh = Column(Float, nullable=True)
    residual_pct = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    status = Column(String(50), default="processing")  # processing | complete | failed
    error_message = Column(Text, nullable=True)
    uploaded_by = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    readings = relationship("MeterReading", back_populates="batch", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_batch_substation", "substation_id"),
        Index("idx_batch_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<MeterUploadBatch {self.filename} rows={self.row_count}>"


# ── Meter Readings ────────────────────────────────────────────────────────

class MeterReading(Base):
    """Individual meter reading row from uploaded CSV/Excel."""
    __tablename__ = "meter_readings"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    batch_id = Column(UUID(as_uuid=False), ForeignKey("meter_upload_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    meter_id = Column(String(100), nullable=False, index=True)
    substation_id = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    energy_kwh = Column(Float, nullable=False)

    # Physics + ML results (computed after upload)
    anomaly_score = Column(Float, nullable=True)
    is_anomaly = Column(Boolean, default=False)
    z_score = Column(Float, nullable=True)           # deviation from meter baseline
    expected_kwh = Column(Float, nullable=True)      # physics-predicted expected value
    residual_kwh = Column(Float, nullable=True)      # actual - expected
    anomaly_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    batch = relationship("MeterUploadBatch", back_populates="readings")

    __table_args__ = (
        Index("idx_reading_meter_id", "meter_id"),
        Index("idx_reading_timestamp", "timestamp"),
        Index("idx_reading_anomaly", "is_anomaly"),
        Index("idx_reading_is_anomaly", "is_anomaly"),  # alias for query compatibility
        Index("idx_reading_batch", "batch_id"),
    )

    def __repr__(self):
        return f"<MeterReading {self.meter_id} {self.timestamp} {self.energy_kwh}kWh>"
