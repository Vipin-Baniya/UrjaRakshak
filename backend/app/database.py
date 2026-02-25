"""
Async Database Configuration - PRODUCTION GRADE
===============================================
Fixed Issues:
1. Supabase pgBouncer compatibility
2. No prepared statement conflicts
3. Proper connection health checking
4. Transaction management preserved
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

# Convert DATABASE_URL to async if needed
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace(
        "postgresql://",
        "postgresql+asyncpg://"
    )


# FIXED: Proper engine configuration (Supabase compatible)
def create_database_engine() -> AsyncEngine:
    """
    Create async engine with Supabase Transaction Pooler compatibility.

    IMPORTANT:
    - Supabase already pools connections (pgBouncer)
    - Must use NullPool (no SQLAlchemy pooling)
    - Must disable statement cache
    """

    engine_args = {
        "echo": settings.DEBUG,
        "pool_pre_ping": True,
        "poolclass": NullPool,  # CRITICAL for pgBouncer
        "connect_args": {
            "statement_cache_size": 0  # CRITICAL for pgBouncer
        }
    }

    logger.info("Using Supabase-compatible NullPool engine")

    return create_async_engine(database_url, **engine_args)


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


# No auto-commit, let endpoints decide
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Real health check
async def check_database_connection() -> bool:
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


async def get_database_info() -> dict:
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
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created/verified")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise


async def close_db():
    try:
        await engine.dispose()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"❌ Error closing database: {e}")


# Transaction management helpers (UNCHANGED)
class DatabaseTransaction:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.committed = False

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            await self.session.rollback()
            logger.warning(f"Transaction rolled back due to: {exc_val}")
        elif not self.committed:
            await self.session.commit()
            self.committed = True

    async def commit(self):
        await self.session.commit()
        self.committed = True

    async def rollback(self):
        await self.session.rollback()
        self.committed = True


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
