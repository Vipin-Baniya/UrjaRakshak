"""
Async Database Configuration — UrjaRakshak Production Database Layer
====================================================================

Optimized for:
• FastAPI
• SQLAlchemy 2.x
• asyncpg
• Supabase (PgBouncer compatible)
• Render deployment

Fixes:
✓ Supabase prepared statement bug
✓ Proper connection pooling
✓ Explicit transaction handling
✓ Production health checks
✓ No hidden commits
"""

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool, QueuePool
from sqlalchemy import text
from typing import AsyncGenerator
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# ------------------------------------------------------------
# DATABASE URL FIX
# ------------------------------------------------------------

database_url = settings.DATABASE_URL

# Convert postgres → asyncpg
if database_url.startswith("postgresql://"):
    database_url = database_url.replace(
        "postgresql://",
        "postgresql+asyncpg://"
    )

# ------------------------------------------------------------
# ENGINE FACTORY
# ------------------------------------------------------------

def create_database_engine() -> AsyncEngine:
    """
    Create async SQLAlchemy engine.

    Handles:
    • Supabase PgBouncer compatibility
    • Environment based pooling
    """

    engine_args = {
        "echo": settings.DEBUG,
        "pool_pre_ping": True,

        # ⭐ CRITICAL FIX FOR SUPABASE
        "connect_args": {
            "statement_cache_size": 0
        }
    }

    # Development environment
    if settings.is_development:

        engine_args["poolclass"] = NullPool

        logger.info(
            "Database Engine: DEVELOPMENT MODE (NullPool)"
        )

    # Production environment
    else:

        engine_args["poolclass"] = QueuePool
        engine_args["pool_size"] = 20
        engine_args["max_overflow"] = 10
        engine_args["pool_timeout"] = 30
        engine_args["pool_recycle"] = 1800

        logger.info(
            "Database Engine: PRODUCTION MODE (QueuePool size=20)"
        )

    return create_async_engine(database_url, **engine_args)


# ------------------------------------------------------------
# ENGINE INSTANCE
# ------------------------------------------------------------

engine: AsyncEngine = create_database_engine()

# ------------------------------------------------------------
# SESSION FACTORY
# ------------------------------------------------------------

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

# ------------------------------------------------------------
# BASE MODEL
# ------------------------------------------------------------

Base = declarative_base()

# ------------------------------------------------------------
# SESSION DEPENDENCY
# ------------------------------------------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for database session.

    No auto commit.
    Endpoints control transactions.
    """

    async with async_session_maker() as session:

        try:
            yield session

        except Exception:
            await session.rollback()
            raise

        finally:
            await session.close()

# ------------------------------------------------------------
# DATABASE HEALTH CHECK
# ------------------------------------------------------------

async def check_database_connection() -> bool:
    """
    Verify database connectivity.
    """

    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True

    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

# ------------------------------------------------------------
# DATABASE INFO
# ------------------------------------------------------------

async def get_database_info() -> dict:
    """
    Return database diagnostics.
    """

    try:

        async with engine.begin() as conn:

            result = await conn.execute(
                text("SELECT version()")
            )

            version = result.scalar()

            pool_status = {
                "size": engine.pool.size()
                if hasattr(engine.pool, "size") else None,

                "checked_in": engine.pool.checkedin()
                if hasattr(engine.pool, "checkedin") else None,

                "checked_out": engine.pool.checkedout()
                if hasattr(engine.pool, "checkedout") else None,

                "overflow": engine.pool.overflow()
                if hasattr(engine.pool, "overflow") else None,
            }

            return {
                "connected": True,
                "version": version.split(",")[0]
                if version else "unknown",
                "pool": pool_status,
                "driver": database_url.split("://")[0],
            }

    except Exception as e:

        logger.error(f"Database info failed: {e}")

        return {
            "connected": False,
            "error": str(e)
        }

# ------------------------------------------------------------
# INITIALIZE DATABASE
# ------------------------------------------------------------

async def init_db():
    """
    Create tables if they don't exist.
    """

    try:

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database schema verified")

    except Exception as e:

        logger.error(f"Database initialization failed: {e}")
        raise

# ------------------------------------------------------------
# SHUTDOWN DATABASE
# ------------------------------------------------------------

async def close_db():
    """
    Gracefully close database connections.
    """

    try:

        await engine.dispose()

        logger.info("Database connections closed")

    except Exception as e:

        logger.error(f"Error closing database: {e}")

# ------------------------------------------------------------
# TRANSACTION MANAGER
# ------------------------------------------------------------

class DatabaseTransaction:
    """
    Explicit transaction manager.
    """

    def __init__(self, session: AsyncSession):

        self.session = session
        self.committed = False

    async def __aenter__(self):

        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):

        if exc_type is not None:

            await self.session.rollback()

            logger.warning(
                f"Transaction rollback due to: {exc_val}"
            )

        elif not self.committed:

            await self.session.commit()

            self.committed = True

    async def commit(self):

        await self.session.commit()

        self.committed = True

    async def rollback(self):

        await self.session.rollback()

        self.committed = True

# ------------------------------------------------------------
# EXPORTS
# ------------------------------------------------------------

__all__ = [
    "engine",
    "async_session_maker",
    "Base",
    "get_db",
    "init_db",
    "close_db",
    "check_database_connection",
    "get_database_info",
    "DatabaseTransaction"
]
