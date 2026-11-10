"""
Configuration settings for the application
Loads from environment variables. Safe for local and production (Render, etc.).
"""
from pydantic_settings import BaseSettings
from typing import List
import os
import json


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
    # Comma-separated emails allowed into the /admin performance page.
    # Empty by default, so nobody is an admin until this is set.
    SUPER_ADMIN_EMAILS: str = ""

    # CORS: comma-separated in env, e.g. https://yourapp.vercel.app,https://yourapp.com
    # Keep this as a string so pydantic-settings does not try to JSON-decode
    # Render's comma-separated environment value before our parser sees it.
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # App Settings
    PROJECT_NAME: str = "MathChampions Ghana"
    VERSION: str = "1.0.0"

    @property
    def super_admin_emails(self) -> List[str]:
        return [e.strip().lower() for e in self.SUPER_ADMIN_EMAILS.split(",") if e.strip()]

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated origins (and tolerate JSON arrays) for FastAPI."""
        value = self.CORS_ORIGINS.strip()
        if value.startswith("["):
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(origin).strip() for origin in parsed if str(origin).strip()]
        return [origin.strip() for origin in value.split(",") if origin.strip()]

    class Config:
        # Keep backend/.env for existing local settings, and also load the
        # repository-level file produced by `neon env pull` when running the
        # API locally. Deployed environments should provide DATABASE_URL
        # through their environment (which takes precedence over both files).
        env_file = (".env", "../.env.local")
        case_sensitive = True
        # Neon also pulls branch metadata and an unpooled URL into the same
        # env file; this service consumes only DATABASE_URL.
        extra = "ignore"


settings = Settings()
# Prisma's generated Python client reads datasource values from the process
# environment. Bridge values loaded from dotenv files into that environment.
os.environ.setdefault("DATABASE_URL", settings.DATABASE_URL)
