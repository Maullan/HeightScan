"""Pydantic request/response schemas for session endpoints."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.core.config import settings


class SessionStartResponse(BaseModel):
    """Response returned when a new session is created."""

    session_id: str
    status: str
    message: str = "Session created. Waiting for measurement."


class SensorResultRequest(BaseModel):
    """
    Payload sent by the ESP32 after a successful measurement.

    Fields
    ------
    height_cm:    Calculated height in centimetres.
    distance_cm:  Raw sensor reading in centimetres.
    """

    height_cm: float = Field(..., gt=0, description="Measured height in cm")
    distance_cm: float = Field(..., gt=0, description="Raw distance reading in cm")

    @field_validator("height_cm")
    @classmethod
    def validate_height(cls, v: float) -> float:
        if not (settings.min_height_cm <= v <= settings.max_height_cm):
            raise ValueError(
                f"height_cm must be between {settings.min_height_cm} and "
                f"{settings.max_height_cm}. Got {v}."
            )
        return round(v, 1)

    @field_validator("distance_cm")
    @classmethod
    def validate_distance(cls, v: float) -> float:
        if v <= 0 or v > settings.reference_height_cm:
            raise ValueError(
                f"distance_cm must be between 0 and {settings.reference_height_cm}. Got {v}."
            )
        return round(v, 1)


class SensorResultResponse(BaseModel):
    """Response returned to the ESP32 after storing the result."""

    success: bool
    session_id: str
    message: str


class SessionStatusResponse(BaseModel):
    """Full session state exposed to the frontend."""

    session_id: str
    status: str
    height_cm: Optional[float] = None
    distance_cm: Optional[float] = None
    error_msg: Optional[str] = None


class HealthResponse(BaseModel):
    """Health-check response."""

    status: str = "ok"
    app_name: str
    version: str
    timestamp: str
