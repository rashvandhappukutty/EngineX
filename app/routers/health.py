from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health Check")
def health_check():
    return {
        "status": "healthy",
        "service": "backend",
        "version": settings.VERSION,
        "project": settings.PROJECT_NAME,
    }
