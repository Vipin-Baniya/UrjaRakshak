"""
Configuration Management - PRODUCTION GRADE
==========================================
Clean Pydantic v2 Compatible Version
"""

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, ValidationError
from typing import List, Optional
from functools import lru_cache
import sys


class Settings(BaseSettings):
    """Application settings with strict validation"""

    # ==============================
    # Application
    # ==============================
    APP_NAME: str = "UrjaRakshak"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")

    # ==============================
    # Server
    # ==============================
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")

    # ==============================
    # Database (REQUIRED)
    # ==============================
    DATABASE_URL: str = Field(..., env="DATABASE_URL")

    # ==============================
    # Redis (Optional)
    # ==============================
    REDIS_URL: Optional[str] = Field(None, env="REDIS_URL")

    # ==============================
    # Security (REQUIRED)
    # ==============================
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ==============================
    # CORS (Simple string parsing)
    # ==============================
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000",
        env="ALLOWED_ORIGINS"
    )

    CORS_ALLOW_ORIGIN_REGEX: Optional[str] = Field(
        None,
        env="CORS_ALLOW_ORIGIN_REGEX"
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Return parsed list of allowed origins"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    # ==============================
    # AI Services (Optional)
    # ==============================
    ANTHROPIC_API_KEY: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")
    OPENAI_API_KEY: Optional[str] = Field(None, env="OPENAI_API_KEY")
    HUGGINGFACE_TOKEN: Optional[str] = Field(None, env="HUGGINGFACE_TOKEN")
    AI_MODEL: str = Field(default="claude-sonnet-4", env="AI_MODEL")

    # ==============================
    # Ethics & Privacy
    # ==============================
    ENABLE_STRICT_ETHICS: bool = Field(default=True, env="ENABLE_STRICT_ETHICS")
    ENABLE_AUDIT_LOGGING: bool = Field(default=True, env="ENABLE_AUDIT_LOGGING")
    DATA_RETENTION_DAYS: int = Field(default=90, env="DATA_RETENTION_DAYS")

    # ==============================
    # Physics Engine
    # ==============================
    PHYSICS_MIN_CONFIDENCE: float = 0.5
    PHYSICS_TEMPERATURE_CELSIUS: float = 25.0
    MEASUREMENT_UNCERTAINTY_PERCENT: float = 1.0

    # ==============================
    # Features
    # ==============================
    ENABLE_WEBSOCKETS: bool = True
    ENABLE_AI_ANALYSIS: bool = False
    ENABLE_REAL_TIME_UPDATES: bool = True

    # ==============================
    # External Services (Optional)
    # ==============================
    CLOUDINARY_URL: Optional[str] = Field(None, env="CLOUDINARY_URL")
    SENDGRID_API_KEY: Optional[str] = Field(None, env="SENDGRID_API_KEY")

    # ==============================
    # Monitoring (Optional)
    # ==============================
    SENTRY_DSN: Optional[str] = Field(None, env="SENTRY_DSN")
    BETTER_STACK_TOKEN: Optional[str] = Field(None, env="BETTER_STACK_TOKEN")

    # ==============================
    # Validators
    # ==============================

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of {allowed}")
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v.startswith(("postgresql://", "postgresql+asyncpg://")):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string")
        return v

    # ==============================
    # Environment helpers
    # ==============================

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def has_ai_configured(self) -> bool:
        return bool(
            self.ANTHROPIC_API_KEY or
            self.OPENAI_API_KEY or
            self.HUGGINGFACE_TOKEN
        )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
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
        sys.exit(1)


settings = get_settings()


def validate_production_settings():
    if settings.is_production:
        if settings.DEBUG:
            raise ValueError("DEBUG must be False in production")

        if "localhost" in settings.ALLOWED_ORIGINS:
            raise ValueError("localhost in ALLOWED_ORIGINS in production")

        if not settings.ENABLE_STRICT_ETHICS:
            raise ValueError("ENABLE_STRICT_ETHICS must be True in production")

        if not settings.ENABLE_AUDIT_LOGGING:
            raise ValueError("ENABLE_AUDIT_LOGGING must be True in production")


if settings.is_production:
    validate_production_settings()


__all__ = ["settings", "Settings", "get_settings"]
