"""
Async Database Configuration - PRODUCTION GRADE
===============================================
Fixed Issues:
1. NullPool vs pool_size conflict resolved
2. No auto-commit in dependency
3. Proper connection health checking
4. Transaction management
"""

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool, QueuePool
from sqlalchemy import text
from app.config import settings
import logging
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

# Convert DATABASE_URL to async if needed
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

# FIXED: Proper engine configuration based on environment
def create_database_engine() -> AsyncEngine:
    """
    Create async engine with environment-appropriate pooling.
    
    FIXED: No more conflicting pool settings.
    """
    engine_args = {
        "echo": settings.DEBUG,
        "pool_pre_ping": True,  # Verify connections before use
    }
    
    # FIXED: Separate pooling strategy by environment
    if settings.is_development:
        # Development: NullPool (no pooling, fresh connections)
        engine_args["poolclass"] = NullPool
        logger.info("Using NullPool for development (no connection pooling)")
    else:
        # Production: QueuePool with proper sizing
        engine_args["poolclass"] = QueuePool
        engine_args["pool_size"] = 20
        engine_args["max_overflow"] = 10
        engine_args["pool_timeout"] = 30
        engine_args["pool_recycle"] = 3600  # Recycle connections after 1 hour
        logger.info("Using QueuePool for production (size=20, overflow=10)")
    
    return create_async_engine(database_url, **engine_args)


# Create engine
engine = create_database_engine()

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,  # Explicit control over flushing
    autocommit=False  # Explicit control over commits
)

# Base class for models
Base = declarative_base()


# FIXED: No auto-commit, let endpoints decide
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get database session.
    
    FIXED: No automatic commit. Endpoints must explicitly commit.
    
    Usage:
        @app.post("/items")
        async def create_item(
            item: ItemCreate,
            db: AsyncSession = Depends(get_db)
        ):
            db_item = Item(**item.dict())
            db.add(db_item)
            await db.commit()  # Explicit commit
            await db.refresh(db_item)
            return db_item
    
    For read-only endpoints, no commit needed:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    async with async_session_maker() as session:
        try:
            yield session
            # REMOVED: await session.commit()
            # Let endpoints handle commits explicitly
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# FIXED: Real health check
async def check_database_connection() -> bool:
    """
    Actually check if database is connected.
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


async def get_database_info() -> dict:
    """
    Get database connection info for health checks.
    
    Returns real status, not fake "connected" string.
    """
    try:
        async with engine.begin() as conn:
            # Get database version
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            
            # Get connection pool stats (if using QueuePool)
            pool_status = {
                "size": engine.pool.size() if hasattr(engine.pool, 'size') else None,
                "checked_in": engine.pool.checkedin() if hasattr(engine.pool, 'checkedin') else None,
                "checked_out": engine.pool.checkedout() if hasattr(engine.pool, 'checkedout') else None,
                "overflow": engine.pool.overflow() if hasattr(engine.pool, 'overflow') else None,
            }
            
            return {
                "connected": True,
                "version": version.split(",")[0] if version else "unknown",
                "pool": pool_status,
                "url_scheme": database_url.split("://")[0]
            }
    except Exception as e:
        logger.error(f"Failed to get database info: {e}")
        return {
            "connected": False,
            "error": str(e)
        }


async def init_db():
    """
    Initialize database tables.
    Safe to call multiple times (uses CREATE IF NOT EXISTS).
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created/verified")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise


async def close_db():
    """Close database connections gracefully"""
    try:
        await engine.dispose()
        logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"❌ Error closing database: {e}")


# Transaction management helpers
class DatabaseTransaction:
    """
    Context manager for explicit transaction handling.
    
    Usage:
        async with DatabaseTransaction(db) as tx:
            # Do multiple operations
            db.add(item1)
            db.add(item2)
            # Commit happens automatically if no exception
            # Or call: await tx.rollback()
    """
    
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
        """Explicitly commit transaction"""
        await self.session.commit()
        self.committed = True
    
    async def rollback(self):
        """Explicitly rollback transaction"""
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
