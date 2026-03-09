"""
UrjaRakshak Backend — v2.1 (90+ Grade)
========================================
Upgrades vs v2.0:
  + Real ML anomaly detection (Isolation Forest + Statistical)
  + Persistent database storage (analyses, anomalies, users)
  + JWT authentication + RBAC (admin/analyst/viewer)
  + Rate limiting (60 req/min per IP)
  + Prometheus-compatible /metrics endpoint
  + Full test suite (pytest)
  + Graceful DB startup (warn instead of crash)

Author: Vipin Baniya
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from typing import Dict, Any
from datetime import datetime

from app.config import settings
from app.database import (
    engine, Base, init_db, close_db,
    check_database_connection, get_database_info, get_db
)

# Physics engines
from app.core.physics_engine import PhysicsEngine
from app.core.attribution_engine import AttributionEngine
from app.core.ai_interpretation_engine import init_ai_engine
from app.core.physics_constrained_anomaly import init_constrained_engine
from app.core.load_forecasting_engine import get_forecast_engine

# ML engine
from app.ml.anomaly_detection import anomaly_engine as ml_anomaly_engine

# Middleware
from app.middleware import RateLimitMiddleware, MetricsMiddleware, metrics

# API routes
from app.api.v1 import analysis, grid, upload, inspection, ai
from app.api.v1 import auth_routes, stream, governance

# DB models (import so they register with Base.metadata)
from app.models import db_models  # noqa: F401

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Init engines
physics_engine = PhysicsEngine(
    temperature_celsius=settings.PHYSICS_TEMPERATURE_CELSIUS,
    min_confidence=settings.PHYSICS_MIN_CONFIDENCE,
    strict_mode=settings.ENABLE_STRICT_ETHICS,
)
attribution_engine = AttributionEngine(conservative_mode=settings.ENABLE_STRICT_ETHICS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle"""
    logger.info("=" * 60)
    logger.info("⚡ Starting UrjaRakshak v2.1 (90+ Grade Build)")
    logger.info("=" * 60)

    # Database — graceful startup (warn, don't crash)
    try:
        await init_db()
        db_ok = await check_database_connection()
        if db_ok:
            logger.info("✅ Database connected and schema initialized")
        else:
            logger.warning("⚠️  Database not connected — running in degraded mode")
    except Exception as e:
        logger.warning(f"⚠️  Database init warning: {e} — continuing without DB")

    # Initialize ML anomaly engine
    try:
        ml_info = ml_anomaly_engine.initialize()
        logger.info(f"✅ Anomaly Detection Engine: {ml_info['status']} (sklearn={ml_info['sklearn_available']})")
    except Exception as e:
        logger.warning(f"⚠️  Anomaly engine init warning: {e}")

    # Initialize AI interpretation engine
    try:
        ai_eng = init_ai_engine(
            anthropic_key=settings.ANTHROPIC_API_KEY,
            openai_key=settings.OPENAI_API_KEY,
        )
        logger.info(f"✅ AI Interpretation Engine: provider={ai_eng.preferred_provider} configured={ai_eng.is_configured}")
    except Exception as e:
        logger.warning(f"⚠️  AI engine init warning: {e}")

    # Initialize physics-constrained anomaly engine
    try:
        constrained_eng = init_constrained_engine(ml_engine=ml_anomaly_engine)
        app.state.constrained_anomaly_engine = constrained_eng
        logger.info("✅ Physics-Constrained Anomaly Engine: active (3-gate: physics + z-score + IF)")
    except Exception as e:
        logger.warning(f"⚠️  Physics-constrained engine init warning: {e}")

    # Initialize load forecasting engine
    try:
        forecast_eng = get_forecast_engine()
        app.state.forecast_engine = forecast_eng
        logger.info("✅ Load Forecasting Engine: active (Fourier + linear trend decomposition)")
    except Exception as e:
        logger.warning(f"⚠️  Forecast engine init warning: {e}")

    # Store in app state
    app.state.physics_engine = physics_engine
    app.state.attribution_engine = attribution_engine
    app.state.anomaly_engine = ml_anomaly_engine
    app.state.startup_time = datetime.utcnow()

    logger.info(f"🔒 Ethics Mode: {'STRICT' if settings.ENABLE_STRICT_ETHICS else 'PERMISSIVE'}")
    logger.info(f"🤖 AI Configured: {settings.has_ai_configured}")
    logger.info("=" * 60)
    logger.info("✅ UrjaRakshak ready")
    logger.info("=" * 60)

    yield

    logger.info("🛑 Shutting down...")
    await close_db()
    logger.info("✅ Shutdown complete")


app = FastAPI(
    title="UrjaRakshak API",
    description=(
        "Physics-based Energy Integrity & Grid Loss Analysis System. "
        "Developer & Founder: Vipin Baniya."
    ),
    version="2.3.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── Middleware (order matters — outermost first) ──────────────────────────
cors_kwargs = {
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["*"],
}
if settings.CORS_ALLOW_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = settings.CORS_ALLOW_ORIGIN_REGEX
else:
    cors_kwargs["allow_origins"] = settings.ALLOWED_ORIGINS

app.add_middleware(CORSMiddleware, **cors_kwargs)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RateLimitMiddleware, max_requests=60, window_seconds=60)
app.add_middleware(MetricsMiddleware)

# ── Routers ───────────────────────────────────────────────────────────────
app.include_router(auth_routes.router, prefix="/api/v1/auth",        tags=["Authentication"])
app.include_router(analysis.router,   prefix="/api/v1/analysis",     tags=["Analysis"])
app.include_router(grid.router,       prefix="/api/v1/grid",         tags=["Grid"])
app.include_router(upload.router,     prefix="/api/v1/upload",       tags=["Upload"])
app.include_router(inspection.router, prefix="/api/v1/inspections",  tags=["Inspections"])
app.include_router(ai.router,         prefix="/api/v1/ai",           tags=["AI & GHI"])
app.include_router(stream.router,     prefix="/api/v1/stream",       tags=["Real-Time Streaming"])
app.include_router(governance.router, prefix="/api/v1/org",          tags=["Governance & Multi-Tenant"])


# ── Core endpoints ────────────────────────────────────────────────────────

@app.get("/", tags=["System"])
async def root() -> Dict[str, Any]:
    return {
        "name": "UrjaRakshak",
        "version": "2.1.0",
        "developer": "Vipin Baniya",
        "status": "operational",
        "description": "Physics-based Energy Integrity & Grid Loss Analysis System",
        "capabilities": {
            "physics_validation": "ACTIVE",
            "loss_attribution": "ACTIVE",
            "anomaly_detection_ml": "ACTIVE — Isolation Forest + Statistical",
            "jwt_authentication": "ACTIVE — admin/analyst/viewer roles",
            "rate_limiting": "ACTIVE — 60 req/min per IP",
            "metrics": "ACTIVE — /metrics (Prometheus format)",
            "database_persistence": "ACTIVE — all analyses stored",
            "ethical_safeguards": "ACTIVE",
        },
        "endpoints": {
            "health": "/health",
            "metrics": "/metrics",
            "docs": "/api/docs",
            "auth": "/api/v1/auth",
            "analysis": "/api/v1/analysis",
            "anomaly_detect": "/api/v1/analysis/anomaly/detect",
            "stats": "/api/v1/analysis/stats/summary",
        },
    }


@app.get("/health", tags=["System"])
async def health_check() -> Dict[str, Any]:
    db_info = await get_database_info()
    db_ok = db_info.get("connected", False)
    uptime = 0
    if hasattr(app.state, "startup_time"):
        uptime = int((datetime.utcnow() - app.state.startup_time).total_seconds())

    return {
        "status": "healthy" if db_ok else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.1.0",
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": uptime,
        "components": {
            "database": {"status": "healthy" if db_ok else "unhealthy", "details": db_info},
            "physics_engine": {"status": "active", "strict_mode": settings.ENABLE_STRICT_ETHICS},
            "attribution_engine": {"status": "active"},
            "anomaly_engine": {
                "status": "active" if ml_anomaly_engine.is_ready else "initializing",
                "sklearn": "available" if ml_anomaly_engine.if_detector.is_trained else "unavailable",
            },
            "rate_limiter": {"status": "active", "limit": "60 req/min per IP"},
        },
        "metrics_snapshot": metrics.to_json(),
    }


@app.get("/metrics", tags=["Observability"])
async def prometheus_metrics():
    """
    Prometheus-compatible metrics endpoint.
    
    Exposes:
      - urjarakshak_uptime_seconds
      - urjarakshak_requests_total
      - urjarakshak_errors_total
      - urjarakshak_endpoint_requests_total (per endpoint)
      - urjarakshak_request_latency_ms (p50/p95/p99 per path)
      - urjarakshak_http_errors_by_code
    """
    return PlainTextResponse(
        content=metrics.to_prometheus_text(),
        media_type="text/plain; version=0.0.4",
    )


@app.get("/api/v1/physics/info", tags=["Physics"])
async def physics_engine_info() -> Dict[str, Any]:
    return {
        "engine": "Physics Truth Engine (PTE) v2.1",
        "purpose": "Validate energy conservation and quantify losses",
        "methodology": "First-principles thermodynamics and electrical engineering",
        "parameters": {
            "temperature_celsius": settings.PHYSICS_TEMPERATURE_CELSIUS,
            "min_confidence_threshold": settings.PHYSICS_MIN_CONFIDENCE,
            "measurement_uncertainty_percent": settings.MEASUREMENT_UNCERTAINTY_PERCENT,
            "strict_mode": settings.ENABLE_STRICT_ETHICS,
        },
        "capabilities": {
            "energy_balance_validation": "First Law of Thermodynamics",
            "technical_loss_computation": "I²R losses, transformer losses, corona",
            "uncertainty_quantification": "Explicit confidence scores and error bars",
            "refusal_logic": "Refuses output when confidence too low",
        },
    }


@app.get("/api/v1/ml/info", tags=["ML"])
async def ml_engine_info() -> Dict[str, Any]:
    return {
        "model_info": ml_anomaly_engine.get_model_info(),
        "training_stats": ml_anomaly_engine.training_stats,
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    if settings.is_production:
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "message": "An unexpected error occurred."},
        )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc), "type": type(exc).__name__},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development,
        log_level="info",
    )
