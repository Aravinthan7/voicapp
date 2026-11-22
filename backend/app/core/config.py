from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "VoiceApp"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = "voiceapp_development_insecure_secret_key_change_in_prod_123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./voiceapp.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_IN_MEMORY_STATE_FALLBACK: bool = True
    
    # Speech translation defaults
    PRIMARY_LANGUAGE: str = "ml-IN"
    SECONDARY_LANGUAGE: str = "ta-IN"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
