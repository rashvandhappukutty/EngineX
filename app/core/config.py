import os
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "EngineX — Smart Campus Crisis Coordination Engine"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # SQLite Database Configuration
    DATABASE_URL: str = "sqlite:///./enginex.db"

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # AI Integration Settings
    AI_SERVICE_URL: str = Field(default="http://localhost:8001/ai")
    AI_ENABLED: bool = Field(default=False)
    AI_TIMEOUT_SECONDS: float = Field(default=3.0)

    # Prototype Disclaimer
    SAFETY_DISCLAIMER: str = (
        "PROTOTYPE RECOMMENDATION ONLY: Computed routes and priorities are based on "
        "recorded graph data and hazards. Real-world physical verification is required before action."
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]


settings = Settings()
