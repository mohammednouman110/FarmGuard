"""
Configuration settings using Pydantic Settings
Loads from .env file with proper validation
"""

from pydantic_settings import BaseSettings
from pydantic import Field, PostgresDsn
from typing import Optional, List
import os

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = Field(default="AgriGuard AI", description="API name")
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: PostgresDsn = Field(
        default="postgresql://postgres:nou22100@localhost:5432/agriguard",
        description="PostgreSQL connection URL"
    )
    
    # Security
    SECRET_KEY: str = Field(
        default="your-super-secret-key-change-in-production!",
        description="Secret key for JWT tokens"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="CORS allowed origins"
    )
    
    # File Uploads
    UPLOAD_DIR: str = Field(default="uploads", description="Upload directory")
    MAX_FILE_SIZE: int = 10485760  # 10MB
    
    # ML Model
    MODEL_PATH: str = Field(default="models/plant_disease_xgb.pkl")
    
    # Environment
    ENVIRONMENT: str = Field(default="development", pattern="^(development|production|staging)$")
    DEBUG: bool = Field(default=True)
    
    # Farmer Helpline
    KISAN_HELPLINE: str = "1800-180-1551"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

# Global settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
