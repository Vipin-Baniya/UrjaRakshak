"""
UrjaRakshak — Analysis API Endpoints (v2 — DB Persistent)
==========================================================
POST /api/v1/analysis/validate       — Physics validation (saves to DB)
POST /api/v1/analysis/anomaly/detect — ML anomaly detection
GET  /api/v1/analysis/               — List analyses (paginated)
GET  /api/v1/analysis/{id}           — Get single analysis
GET  /api/v1/analysis/stats/summary  — Aggregated statistics

Author: Vipin Baniya
"""

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Request, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.physics_engine import GridComponent, PhysicsEngine
from app.ml.anomaly_detection import AnomalyFeatures
from app.database import get_db
from app.models.db_models import Analysis, GridSection, AnomalyResult as DBAnomaly, User
from app.auth import get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalysisRequest(BaseModel):
    substation_id: str = Field(..., description="Substation identifier")
    input_energy_mwh: float = Field(..., gt=0)
    output_energy_mwh: float = Field(..., ge=0)
    components: List[Dict[str, Any]] = Field(..., min_length=1)
    time_window_hours: float = Field(24.0, gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "substation_id": "SS001",
                "input_energy_mwh": 1000.0,
                "output_energy_mwh": 975.0,
                "time_window_hours": 24.0,
                "components": [
                    {"component_id": "TX001", "component_type": "transformer",
                     "rated_capacity_kva": 1000, "efficiency_rating": 0.98, "age_years": 10},
                    {"component_id": "LINE001", "component_type": "distribution_line",
                     "rated_capacity_kva": 500, "length_km": 5.0, "resistance_ohms": 0.5}
                ]
            }
        }


class AnomalyDetectRequest(BaseModel):
    substation_id: str
    input_mwh: float = Field(..., gt=0)
    output_mwh: float = Field(..., ge=0)
    residual_mwh: float
    residual_percent: float
    confidence_score: float = Field(default=0.8, ge=0.0, le=1.0)
    time_of_day_hour: float = Field(default=12.0, ge=0, le=24)
    day_of_week: float = Field(default=1.0, ge=0, le=7)
    analysis_id: Optional[str] = None


async def get_or_create_grid_section(substation_id: str, db: AsyncSession) -> GridSection:
    result = await db.execute(select(GridSection).where(GridSection.substation_id == substation_id))
    section = result.scalar_one_or_none()
    if not section:
        section = GridSection(substation_id=substation_id, status="active")
        db.add(section)
        await db.flush()
    return section


@router.post("/validate")
async def validate_grid_section(
    request: AnalysisRequest,
    fastapi_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Physics-based energy conservation validation — result saved to DB."""
    physics_engine: PhysicsEngine = fastapi_request.app.state.physics_engine

    try:
        components = [
            GridComponent(
                component_id=c.get("component_id", "unknown"),
                component_type=c.get("component_type", "generic"),
                rated_capacity_kva=c.get("rated_capacity_kva", 100),
                voltage_kv=c.get("voltage_kv"),
                resistance_ohms=c.get("resistance_ohms"),
                length_km=c.get("length_km"),
                efficiency_rating=c.get("efficiency_rating"),
                age_years=c.get("age_years"),
                load_factor=c.get("load_factor"),
            )
            for c in request.components
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid component data: {str(e)}")

    result = physics_engine.validate_energy_conservation(
        input_energy_mwh=request.input_energy_mwh,
        output_energy_mwh=request.output_energy_mwh,
        components=components,
        time_window_hours=request.time_window_hours,
    )
    result_dict = result.to_dict()

    # Persist to DB
    analysis_id = None
    try:
        section = await get_or_create_grid_section(request.substation_id, db)
        analysis = Analysis(
            grid_section_id=section.id,
            substation_id=request.substation_id,
            input_energy_mwh=request.input_energy_mwh,
            output_energy_mwh=request.output_energy_mwh,
            time_window_hours=request.time_window_hours,
            expected_loss_mwh=result.expected_technical_loss_mwh,
            actual_loss_mwh=result.actual_loss_mwh,
            residual_mwh=result.residual_mwh,
            residual_percentage=result.residual_percentage,
            balance_status=result.balance_status.value,
            confidence_score=result.confidence_score,
            measurement_quality=result.measurement_quality,
            physics_result_json=result_dict,
            requires_review=(result.residual_percentage or 0) > 8.0,
            refusal_reason=result.refusal_reason,
            created_by=current_user.id,
        )
        db.add(analysis)
        await db.commit()
        await db.refresh(analysis)
        analysis_id = analysis.id
    except Exception as db_err:
        logger.warning(f"Failed to persist analysis: {db_err}")

    return {
        "analysis_id": analysis_id,
        "substation_id": request.substation_id,
        "analysis": result_dict,
        "metadata": {
            "engine": "Physics Truth Engine v2.0",
            "methodology": "First-principles thermodynamics",
            "persisted": analysis_id is not None,
        },
    }


@router.post("/anomaly/detect")
async def detect_anomaly(
    request: AnomalyDetectRequest,
    fastapi_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """ML anomaly detection — Isolation Forest + Statistical ensemble."""
    anomaly_engine = fastapi_request.app.state.anomaly_engine

    features = AnomalyFeatures(
        substation_id=request.substation_id,
        timestamp=datetime.utcnow().isoformat(),
        input_mwh=request.input_mwh,
        output_mwh=request.output_mwh,
        residual_mwh=request.residual_mwh,
        residual_percent=request.residual_percent,
        confidence_score=request.confidence_score,
        time_of_day_hour=request.time_of_day_hour,
        day_of_week=request.day_of_week,
    )

    ml_result = anomaly_engine.detect(features)

    db_id = None
    try:
        section = await get_or_create_grid_section(request.substation_id, db)
        db_anomaly = DBAnomaly(
            grid_section_id=section.id,
            analysis_id=request.analysis_id,
            substation_id=request.substation_id,
            is_anomaly=ml_result.is_anomaly,
            anomaly_score=ml_result.anomaly_score,
            confidence=ml_result.confidence,
            method_used=ml_result.method_used,
            primary_reason=ml_result.primary_reason,
            feature_contributions=ml_result.feature_contributions,
            recommended_action=ml_result.recommended_action,
        )
        db.add(db_anomaly)
        await db.commit()
        await db.refresh(db_anomaly)
        db_id = db_anomaly.id
    except Exception as e:
        logger.warning(f"Failed to persist anomaly result: {e}")

    return {
        "anomaly_result_id": db_id,
        "result": ml_result.to_dict(),
        "metadata": {"model": anomaly_engine.get_model_info()},
    }


@router.get("/stats/summary")
async def get_stats_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Real aggregated stats from database — powers dashboard."""
    total = (await db.execute(select(func.count(Analysis.id)))).scalar() or 0
    avg_res = (await db.execute(select(func.avg(Analysis.residual_percentage)))).scalar() or 0.0
    status_rows = (await db.execute(
        select(Analysis.balance_status, func.count(Analysis.id)).group_by(Analysis.balance_status)
    )).fetchall()
    by_status = {r[0]: r[1] for r in status_rows if r[0]}
    pending = (await db.execute(
        select(func.count(Analysis.id)).where(Analysis.requires_review == True, Analysis.reviewed == False)
    )).scalar() or 0
    anomaly_total = (await db.execute(select(func.count(DBAnomaly.id)))).scalar() or 0
    flagged = (await db.execute(
        select(func.count(DBAnomaly.id)).where(DBAnomaly.is_anomaly == True)
    )).scalar() or 0
    high_risk_rows = (await db.execute(
        select(Analysis.substation_id, func.avg(Analysis.residual_percentage).label("avg_r"))
        .group_by(Analysis.substation_id)
        .having(func.avg(Analysis.residual_percentage) > 8.0)
        .order_by(desc("avg_r")).limit(10)
    )).fetchall()
    high_risk = [{"substation": r[0], "avg_residual_pct": round(float(r[1]), 2)} for r in high_risk_rows]
    users = (await db.execute(select(func.count(User.id)))).scalar() or 0

    return {
        "summary": {
            "total_analyses": total,
            "avg_residual_pct": round(float(avg_res), 2),
            "pending_review": pending,
            "total_anomaly_checks": anomaly_total,
            "anomalies_flagged": flagged,
            "anomaly_flag_rate_pct": round(flagged / anomaly_total * 100, 1) if anomaly_total > 0 else 0,
            "registered_users": users,
        },
        "by_status": by_status,
        "high_risk_substations": high_risk,
    }


@router.get("/")
async def list_analyses(
    substation_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """List persisted analyses, paginated."""
    query = select(Analysis).order_by(desc(Analysis.created_at))
    if substation_id:
        query = query.where(Analysis.substation_id == substation_id)
    if status:
        query = query.where(Analysis.balance_status == status)
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0
    rows = (await db.execute(query.limit(limit).offset(offset))).scalars().all()
    return {
        "total": total, "limit": limit, "offset": offset,
        "items": [
            {"id": a.id, "substation_id": a.substation_id,
             "input_mwh": a.input_energy_mwh, "output_mwh": a.output_energy_mwh,
             "residual_pct": a.residual_percentage, "status": a.balance_status,
             "confidence": a.confidence_score, "requires_review": a.requires_review,
             "created_at": a.created_at.isoformat() if a.created_at else None}
            for a in rows
        ],
    }


@router.get("/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Get single analysis by ID with full physics result."""
    result = await db.execute(select(Analysis).where(Analysis.id == analysis_id))
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {
        "id": analysis.id, "substation_id": analysis.substation_id,
        "input_mwh": analysis.input_energy_mwh, "output_mwh": analysis.output_energy_mwh,
        "time_window_hours": analysis.time_window_hours,
        "residual_pct": analysis.residual_percentage, "status": analysis.balance_status,
        "confidence": analysis.confidence_score, "requires_review": analysis.requires_review,
        "reviewed": analysis.reviewed, "review_notes": analysis.review_notes,
        "refusal_reason": analysis.refusal_reason,
        "physics_result": analysis.physics_result_json,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
    }
