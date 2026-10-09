from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import init_db
from app.routers import (
    ai,
    health,
    incidents,
    teams,
    campus,
    routing,
    helpdesk,
    assignments,
    dashboard,
    notifications,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("enginex")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("Initializing EngineX database tables...")
    init_db()
    logger.info("EngineX application startup complete.")
    yield
    logger.info("EngineX application shutdown.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "EngineX Backend — Smart Campus Crisis Coordination Engine & Multi-Agent Helpdesk Resolution System. "
        "Provides APIs for crisis reporting, priority scoring, campus navigation/evacuation, "
        "response team coordination, helpdesk service requests, and dashboard analytics."
    ),
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on path {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Root Endpoint
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "EngineX Smart Campus Crisis Coordination API is operational!",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": f"{settings.API_V1_STR}/docs",
    }


# Include Routers under API_V1_STR prefix (/api/v1)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(teams.router, prefix=settings.API_V1_STR)
app.include_router(campus.router, prefix=settings.API_V1_STR)
app.include_router(routing.router, prefix=settings.API_V1_STR)
app.include_router(helpdesk.router, prefix=settings.API_V1_STR)
app.include_router(assignments.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)

