"""
Async Database Configuration
=============================
Supports local PostgreSQL and Supabase (with SSL).

Key fixes:
  - pool_pre_ping removed from NullPool path (incompatible with asyncpg NullPool)
  - SSL auto-enabled when connecting to Supabase (*.supabase.co)
  - asyncpg-safe QueuePool settings (no pool_recycle, use pool_pre_ping only with QueuePool)
  - DATABASE_URL auto-converted to postgresql+asyncpg://
"""

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
import logging
from typing import AsyncGenerator, Optional

logger = logging.getLogger(__name__)


def _build_database_url() -> tuple[str, bool]:
    """
    Normalise DATABASE_URL for asyncpg.
    Returns (url, is_supabase).
    """
    url = settings.DATABASE_URL

    # Ensure asyncpg driver
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    # Detect Supabase — requires SSL
    is_supabase = ".supabase.co" in url

    # Strip any existing sslmode param from the URL — we pass ssl via connect_args
    import re
    url = re.sub(r"[?&]sslmode=[^&]*", "", url).rstrip("?&")

    return url, is_supabase


database_url, _is_supabase = _build_database_url()


def create_database_engine() -> AsyncEngine:
    """
    Create async engine.

    Development  → NullPool (no pooling, simplest for local dev)
    Production   → AsyncAdaptedQueuePool (connection pooling)
    Supabase     → SSL required regardless of environment
    """
    connect_args: dict = {}

    if _is_supabase:
        # Supabase uses PgBouncer in transaction mode, which does not support
        # asyncpg prepared statements. Setting statement_cache_size=0 disables
        # the prepared statement cache, resolving DuplicatePreparedStatementError.
        connect_args["ssl"] = "require"
        connect_args["statement_cache_size"] = 0
        logger.info("Supabase detected — SSL enabled, prepared statement cache disabled (pgbouncer compat)")

    if settings.is_development:
        engine = create_async_engine(
            database_url,
            echo=settings.DEBUG,
            poolclass=NullPool,
            connect_args=connect_args,
        )
        logger.info("DB engine: NullPool (development)")
    else:
        engine = create_async_engine(
            database_url,
            echo=False,
            poolclass=AsyncAdaptedQueuePool,
            pool_size=10,
            max_overflow=5,
            pool_timeout=30,
            pool_pre_ping=True,   # safe with QueuePool
            connect_args=connect_args,
        )
        logger.info("DB engine: AsyncAdaptedQueuePool (production, size=10+5)")

    return engine


engine = create_database_engine()

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async DB session. Rolls back on exception."""
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_database_connection() -> bool:
    """Ping the database. Returns True if reachable."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"DB health check failed: {e}")
        return False


async def get_database_info() -> dict:
    """Return connection info for /health endpoint."""
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar() or "unknown"

        pool = engine.pool
        pool_status: dict = {}
        for attr in ("size", "checkedin", "checkedout", "overflow"):
            fn = getattr(pool, attr, None)
            if callable(fn):
                try:
                    pool_status[attr] = fn()
                except Exception:
                    pass

        return {
            "connected": True,
            "supabase": _is_supabase,
            "ssl": _is_supabase,
            "version": version.split(",")[0],
            "pool": pool_status,
            "driver": database_url.split("://")[0],
        }
    except Exception as e:
        logger.error(f"Failed to get DB info: {e}")
        return {"connected": False, "error": str(e)}


async def init_db():
    """Create all tables that don't already exist (SQLAlchemy ORM metadata)."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created/verified")
    except Exception as e:
        logger.error(f"❌ DB init failed: {e}")
        raise


async def close_db():
    """Dispose connection pool on shutdown."""
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
