"""
EngineX Root Module Entrypoint.
Delegates application instance to app.main:app for uvicorn compatibility.
"""

from app.main import app

__all__ = ["app"]
