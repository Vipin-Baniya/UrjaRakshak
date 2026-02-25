"""
Async Database Configuration - SUPABASE PRODUCTION SAFE
=======================================================
Compatible with:
- Supabase Transaction Pooler (pgBouncer)
- asyncpg
- Render deployment

Fixes:
- No double pooling
- No prepared statement errors
- No connection exhaustion
- Stable startup
"""

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from app.config import settings
import logging
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

# Ensure async driver
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace(
        "postgresql://",
        "postgresql+asyncpg://"
    )


def create_database_engine() -> AsyncEngine:
    """
    Create async engine for Supabase Transaction Pooler.

    IMPORTANT:
    - Must use NullPool (pgBouncer already pools)
    - Must disable statement cache
    """

    engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,
        pool_pre_ping=True,

        # CRITICAL: pgBouncer requires no SQLAlchemy pooling
        poolclass=NullPool,

        # CRITICAL: Disable prepared statements (pgBouncer fix)
        connect_args={
            "statement_cache_size": 0
        }
    )

    logger.info("Using Supabase-compatible NullPool engine")

    return engine


# Create engine
engine = create_database_engine()

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get database session.
    No automatic commit — endpoints must commit explicitly.
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_database_connection() -> bool:
    """Health check for database connectivity."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


async def get_database_info() -> dict:
    """Get database version and status."""
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()

        return {
            "connected": True,
            "version": version.split(",")[0] if version else "unknown",
            "url_scheme": database_url.split("://")[0]
        }

    except Exception as e:
        logger.error(f"Failed to get database info: {e}")
        return {
            "connected": False,
            "error": str(e)
        }


async def init_db():
    """Initialize database tables safely."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("✅ Database tables created/verified")

    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise


async def close_db():
    """Gracefully close database connections."""
    try:
        await engine.dispose()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"❌ Error closing database: {e}")


__all__ = [
    "engine",
    "async_session_maker",
    "Base",
    "get_db",
    "init_db",
    "close_db",
    "check_database_connection",
    "get_database_info"
]
