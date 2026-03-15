"""
UrjaRakshak Async Database Configuration
========================================

Compatible with:
- Local PostgreSQL
- Supabase (PgBouncer transaction mode)
- Render deployment
- SQLAlchemy Async + asyncpg

Key fixes:
- Disable prepared statement cache (PgBouncer compatibility)
- SSL enabled automatically for Supabase
- AsyncAdaptedQueuePool for production
- NullPool for development
"""

import logging
import re
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool
from sqlalchemy import text

from app.config import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Build asyncpg database URL
# ─────────────────────────────────────────────

def _build_database_url() -> tuple[str, bool]:

    url = settings.DATABASE_URL

    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    is_supabase = ".supabase.co" in url

    # remove sslmode from url
    url = re.sub(r"[?&]sslmode=[^&]*", "", url).rstrip("?&")

    return url, is_supabase


database_url, is_supabase = _build_database_url()


# ─────────────────────────────────────────────
# Engine creation
# ─────────────────────────────────────────────

def create_database_engine() -> AsyncEngine:

    connect_args = {}

    if is_supabase:

        connect_args["ssl"] = "require"

        # ⭐ critical fix for PgBouncer
        connect_args["statement_cache_size"] = 0

        logger.info(
            "Supabase detected → SSL enabled, prepared statements disabled"
        )

    if settings.is_development:

        engine = create_async_engine(
            database_url,
            echo=settings.DEBUG,
            poolclass=NullPool,
            connect_args=connect_args,
        )

        logger.info("DB engine → NullPool (development)")

    else:

        engine = create_async_engine(
            database_url,
            echo=False,
            poolclass=AsyncAdaptedQueuePool,
            pool_size=10,
            max_overflow=5,
            pool_timeout=30,
            pool_pre_ping=True,
            connect_args=connect_args,
        )

        logger.info("DB engine → AsyncAdaptedQueuePool (production)")

    return engine


engine = create_database_engine()


# ─────────────────────────────────────────────
# Session maker
# ─────────────────────────────────────────────

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


# ─────────────────────────────────────────────
# Dependency
# ─────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:

    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────

async def check_database_connection() -> bool:

    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))

        return True

    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        return False


async def get_database_info():

    try:

        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar() or "unknown"

        pool = engine.pool

        pool_status = {}

        for attr in ("size", "checkedin", "checkedout", "overflow"):
            fn = getattr(pool, attr, None)
            if callable(fn):
                try:
                    pool_status[attr] = fn()
                except Exception:
                    pass

        return {
            "connected": True,
            "supabase": is_supabase,
            "ssl": is_supabase,
            "version": version.split(",")[0],
            "pool": pool_status,
            "driver": database_url.split("://")[0],
        }

    except Exception as e:

        logger.error(f"Failed to get DB info: {e}")

        return {
            "connected": False,
            "error": str(e)
        }


# ─────────────────────────────────────────────
# DB init
# ─────────────────────────────────────────────

async def init_db():

    try:

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("✅ Database tables created/verified")

    except Exception as e:

        logger.error(f"❌ DB init failed: {e}")
        raise


# ─────────────────────────────────────────────
# Shutdown
# ─────────────────────────────────────────────

async def close_db():

    try:

        await engine.dispose()

        logger.info("✅ DB connections closed")

    except Exception as e:

        logger.error(f"❌ DB close error: {e}")


__all__ = [
    "engine",
    "async_session_maker",
    "Base",
    "get_db",
    "init_db",
    "close_db",
    "check_database_connection",
    "get_database_info",
]
