from pydantic_settings import BaseSettings, SettingsConfigDict
import warnings


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    # App
    PROJECT_NAME: str = "Análise Facial API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/facial_analysis"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # MediaPipe
    MIN_DETECTION_CONFIDENCE: float = 0.5
    MIN_TRACKING_CONFIDENCE: float = 0.5


settings = Settings()

# Warn if using default secret key in production
_insecure_keys = {"your-secret-key-change-in-production", "dev-secret-key-change-in-production"}
if settings.SECRET_KEY in _insecure_keys and not settings.DEBUG:
    warnings.warn(
        "SECRET_KEY is set to an insecure default value. "
        "Generate a strong secret key for production.",
        stacklevel=2,
    )