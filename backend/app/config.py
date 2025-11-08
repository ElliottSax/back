from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings and configuration."""

    # Application
    APP_NAME: str = "Financial Backtesting Platform"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/backtesting_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # API Keys
    ALPHA_VANTAGE_API_KEY: str = ""
    POLYGON_API_KEY: str = ""
    IEX_CLOUD_API_KEY: str = ""

    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Data Settings
    DATA_CACHE_TTL: int = 3600
    MAX_BACKTEST_DURATION_DAYS: int = 3650
    DEFAULT_INITIAL_CAPITAL: float = 10000.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


settings = Settings()
