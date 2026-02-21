"""
Configuration Management - PRODUCTION GRADE
==========================================
Fixed Issues:
1. CORS wildcard support properly configured
2. SECRET_KEY required (no dangerous defaults)
3. Proper validation and error handling
"""

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, ValidationError
from typing import List, Optional
from functools import lru_cache
import os
import sys


class Settings(BaseSettings):
    """Application settings with strict validation"""
    
    # Application
    APP_NAME: str = "UrjaRakshak"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    
    # Database (Supabase or PostgreSQL)
    DATABASE_URL: str = Field(..., env="DATABASE_URL")  # REQUIRED
    
    # Redis (Upstash or standard)
    REDIS_URL: Optional[str] = Field(None, env="REDIS_URL")
    
    # Security - FIXED: No dangerous default
    SECRET_KEY: str = Field(..., env="SECRET_KEY")  # REQUIRED, no default
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - FIXED: Proper handling of wildcards
    ALLOWED_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        env="ALLOWED_ORIGINS"
    )
    # For wildcard support (e.g., *.vercel.app)
    CORS_ALLOW_ORIGIN_REGEX: Optional[str] = Field(
        None,
        env="CORS_ALLOW_ORIGIN_REGEX"
    )
    
    # AI Services (all optional)
    ANTHROPIC_API_KEY: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")
    OPENAI_API_KEY: Optional[str] = Field(None, env="OPENAI_API_KEY")
    HUGGINGFACE_TOKEN: Optional[str] = Field(None, env="HUGGINGFACE_TOKEN")
    AI_MODEL: str = Field(default="claude-sonnet-4", env="AI_MODEL")
    
    # Ethics & Privacy - STRICT DEFAULTS
    ENABLE_STRICT_ETHICS: bool = Field(default=True, env="ENABLE_STRICT_ETHICS")
    ENABLE_AUDIT_LOGGING: bool = Field(default=True, env="ENABLE_AUDIT_LOGGING")
    DATA_RETENTION_DAYS: int = Field(default=90, env="DATA_RETENTION_DAYS")
    
    # Physics Engine - Engineering parameters
    PHYSICS_MIN_CONFIDENCE: float = 0.5
    PHYSICS_TEMPERATURE_CELSIUS: float = 25.0
    MEASUREMENT_UNCERTAINTY_PERCENT: float = 1.0
    
    # Features - Conservative defaults
    ENABLE_WEBSOCKETS: bool = True
    ENABLE_AI_ANALYSIS: bool = False  # Off by default until configured
    ENABLE_REAL_TIME_UPDATES: bool = True
    
    # External Services (optional)
    CLOUDINARY_URL: Optional[str] = Field(None, env="CLOUDINARY_URL")
    SENDGRID_API_KEY: Optional[str] = Field(None, env="SENDGRID_API_KEY")
    
    # Monitoring (optional)
    SENTRY_DSN: Optional[str] = Field(None, env="SENTRY_DSN")
    BETTER_STACK_TOKEN: Optional[str] = Field(None, env="BETTER_STACK_TOKEN")
    
    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment value"""
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of {allowed}")
        return v
    
    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate SECRET_KEY strength"""
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return v
    
    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate database URL format"""
        if not v.startswith(("postgresql://", "postgresql+asyncpg://")):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string")
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.ENVIRONMENT == "development"
    
    @property
    def has_ai_configured(self) -> bool:
        """Check if any AI service is configured"""
        return bool(
            self.ANTHROPIC_API_KEY or 
            self.OPENAI_API_KEY or 
            self.HUGGINGFACE_TOKEN
        )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        # Parse list from comma-separated string
        json_loads = lambda v: [x.strip() for x in v.split(",")] if isinstance(v, str) else v


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Will raise ValidationError if required env vars are missing.
    """
    try:
        return Settings()
    except ValidationError as e:
        print("❌ Configuration Error:", file=sys.stderr)
        for error in e.errors():
            field = error["loc"][0]
            msg = error["msg"]
            print(f"  - {field}: {msg}", file=sys.stderr)
        print("\n💡 Required environment variables:", file=sys.stderr)
        print("  - DATABASE_URL: PostgreSQL connection string", file=sys.stderr)
        print("  - SECRET_KEY: 32+ character secret key", file=sys.stderr)
        print("\n📝 Example .env file:", file=sys.stderr)
        print('DATABASE_URL="postgresql://user:pass@localhost:5432/urjarakshak"', file=sys.stderr)
        print('SECRET_KEY="your-32-character-secret-key-here"', file=sys.stderr)
        sys.exit(1)


# Create settings instance - will fail fast if misconfigured
settings = get_settings()


# Validate critical settings on import
def validate_production_settings():
    """Additional production-specific validations"""
    if settings.is_production:
        if settings.DEBUG:
            raise ValueError("DEBUG must be False in production")
        
        if "localhost" in str(settings.ALLOWED_ORIGINS):
            raise ValueError("localhost in ALLOWED_ORIGINS in production")
        
        if not settings.ENABLE_STRICT_ETHICS:
            raise ValueError("ENABLE_STRICT_ETHICS must be True in production")
        
        if not settings.ENABLE_AUDIT_LOGGING:
            raise ValueError("ENABLE_AUDIT_LOGGING must be True in production")


# Run production validation
if settings.is_production:
    validate_production_settings()


__all__ = ["settings", "Settings", "get_settings"]
