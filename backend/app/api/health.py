"""Health check endpoint."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.session import HealthResponse, HealthResponseIoT
from app.services.esp32_client import ESP32Client

router = APIRouter(prefix="/api", tags=["health"])

esp32_client = ESP32Client()

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
)
async def health_check() -> HealthResponse:
    """Return application health status."""
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        version=settings.app_version,
        timestamp=datetime.utcnow().isoformat(),
    )


@router.get(
    "/health-iot",
    response_model=HealthResponseIoT,
    summary="Health check",
)
async def health_iot_check() -> HealthResponseIoT:
    """Return application health status."""

    res = await esp32_client.health_check()

    return HealthResponseIoT(
        response=res
    )

