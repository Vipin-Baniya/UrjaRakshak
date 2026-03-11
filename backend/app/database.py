"""
UrjaRakshak Database Layer
Supabase + FastAPI + SQLAlchemy + asyncpg Compatible
"""

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from typing import AsyncGenerator
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# -------------------------------------------------------
# DATABASE URL FIX
# -------------------------------------------------------

database_url = settings.DATABASE_URL

if database_url.startswith("postgresql://"):
    database_url = database_url.replace(
        "postgresql://",
        "postgresql+asyncpg://"
    )

# -------------------------------------------------------
# ENGINE CONFIGURATION
# -------------------------------------------------------

def create_database_engine() -> AsyncEngine:
    """
    Create async engine compatible with Supabase PgBouncer.

    Important:
    Supabase already uses PgBouncer connection pooling.
    Therefore SQLAlchemy pooling must be disabled.
    """

    logger.info("Initializing Supabase-compatible database engine")

    engine = create_async_engine(
        database_url,

        echo=settings.DEBUG,

        # Disable SQLAlchemy pooling
        poolclass=NullPool,

        # Prevent stale connections
        pool_pre_ping=True,

        # ⭐ CRITICAL: Disable prepared statement cache
        connect_args={
            "statement_cache_size": 0
        },
    )

    return engine


# -------------------------------------------------------
# ENGINE INSTANCE
# -------------------------------------------------------

engine: AsyncEngine = create_database_engine()

# -------------------------------------------------------
# SESSION FACTORY
# -------------------------------------------------------

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# -------------------------------------------------------
# BASE MODEL
# -------------------------------------------------------

Base = declarative_base()

# -------------------------------------------------------
# DATABASE DEPENDENCY
# -------------------------------------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:

    async with async_session_maker() as session:

        try:
            yield session

        except Exception:
            await session.rollback()
            raise

        finally:
            await session.close()

# -------------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------------

async def check_database_connection() -> bool:

    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))

        return True

    except Exception as e:

        logger.error(f"Database health check failed: {e}")

        return False

# -------------------------------------------------------
# DATABASE INFO
# -------------------------------------------------------

async def get_database_info() -> dict:

    try:

        async with engine.begin() as conn:

            result = await conn.execute(text("SELECT version()"))

            version = result.scalar()

            return {
                "connected": True,
                "version": version.split(",")[0] if version else "unknown",
                "driver": database_url.split("://")[0],
                "pooling": "Supabase PgBouncer"
            }

    except Exception as e:

        logger.error(f"Database info failed: {e}")

        return {
            "connected": False,
            "error": str(e)
        }

# -------------------------------------------------------
# INIT DATABASE
# -------------------------------------------------------

async def init_db():

    try:

        async with engine.begin() as conn:

            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database schema verified")

    except Exception as e:

        logger.error(f"Database initialization failed: {e}")
        raise

# -------------------------------------------------------
# CLOSE DATABASE
# -------------------------------------------------------

async def close_db():

    try:

        await engine.dispose()

        logger.info("Database connections closed")

    except Exception as e:

        logger.error(f"Error closing database: {e}")


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
