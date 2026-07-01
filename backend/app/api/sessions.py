"""Session REST API endpoints."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_api_key
from app.core.supabase_auth import get_current_user
from app.models.session import SessionStatus
from app.schemas.session import (
    SensorResultRequest,
    SensorResultResponse,
    SessionStartResponse,
    SessionStatusResponse,
)
from app.services.esp32_client import esp32_client
from app.services.session_manager import session_manager
from app.websocket.manager import connection_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post(
    "/start",
    response_model=SessionStartResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new measurement session",
)
async def start_session(
    _api_key: str = Depends(verify_api_key),
    _user: dict[str, Any] = Depends(get_current_user),
) -> SessionStartResponse:
    """
    Create a new measurement session, then trigger the ESP32 to start measuring.

    Returns the session_id the frontend should use to subscribe via WebSocket.
    """
    session = await session_manager.create_session()

    # Fire-and-forget trigger to ESP32 (non-blocking)
    triggered = await esp32_client.trigger_measurement(session.session_id)

    if triggered:
        # Move to MEASURING state immediately
        await session_manager.update_status(session.session_id, SessionStatus.MEASURING)
        await connection_manager.broadcast_status(
            session.session_id, SessionStatus.MEASURING
        )
        logger.info("Session %s: ESP32 triggered successfully", session.session_id)
    else:
        # ESP32 offline — keep status WAITING; frontend will show error
        logger.warning(
            "Session %s: ESP32 not reachable — staying in WAITING state",
            session.session_id,
        )

    return SessionStartResponse(
        session_id=session.session_id,
        status=session.status,
        message=(
            "Measurement started. Stand below the sensor."
            if triggered
            else "ESP32 is offline. Please ensure the device is powered on."
        ),
    )


@router.post(
    "/{session_id}/result",
    response_model=SensorResultResponse,
    summary="Receive measurement result from ESP32",
)
async def receive_result(
    session_id: str,
    payload: SensorResultRequest,
    _api_key: str = Depends(verify_api_key),
) -> SensorResultResponse:
    """
    Endpoint called by the ESP32 after completing a measurement.

    Validates the result, stores it, and broadcasts it via WebSocket.
    """
    session = await session_manager.get_session(session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found or has expired.",
        )

    if session.status == SessionStatus.DONE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Session already has a result.",
        )

    # Persist result and update status
    updated = await session_manager.update_status(
        session_id=session_id,
        status=SessionStatus.DONE,
        height_cm=payload.height_cm,
        distance_cm=payload.distance_cm,
    )

    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update session.",
        )

    # Broadcast to all connected WebSocket clients
    await connection_manager.broadcast_status(
        session_id=session_id,
        status=SessionStatus.DONE,
        height_cm=payload.height_cm,
    )

    logger.info(
        "Session %s DONE — height=%.1f cm, distance=%.1f cm",
        session_id,
        payload.height_cm,
        payload.distance_cm,
    )

    return SensorResultResponse(
        success=True,
        session_id=session_id,
        message="Result received and broadcast successfully.",
    )


@router.get(
    "/{session_id}",
    response_model=SessionStatusResponse,
    summary="Get current session status",
)
async def get_session_status(
    session_id: str,
    _api_key: str = Depends(verify_api_key),
    _user: dict[str, Any] = Depends(get_current_user),
) -> SessionStatusResponse:
    """Retrieve the current state of a session (used for reconnection recovery)."""
    session = await session_manager.get_session(session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )
    return SessionStatusResponse(
        session_id=session.session_id,
        status=session.status,
        height_cm=session.height_cm,
        distance_cm=session.distance_cm,
        error_msg=session.error_msg,
    )
