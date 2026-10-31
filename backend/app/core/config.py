"""
Configuration settings for the application
Loads from environment variables. Safe for local and production (Render, etc.).
"""
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List, Union


class Settings(BaseSettings):
    """Application settings"""

    # Database (set by Render Postgres or any DATABASE_URL in production)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/mathchampions"

    # Redis (optional in production; set REDIS_URL or leave default if not used)
    REDIS_URL: str = "redis://localhost:6379"

    # JWT Settings
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days for kids app

    # Admin
    ADMIN_SEED_TOKEN: str = "change-me"

    # CORS: comma-separated in env, e.g. https://yourapp.vercel.app,https://yourapp.com
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # App Settings
    PROJECT_NAME: str = "MathChampions Ghana"
    VERSION: str = "1.0.0"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
