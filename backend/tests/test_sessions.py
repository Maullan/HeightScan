"""Unit tests for session REST API endpoints."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    """GET /api/health should return 200 with status 'ok'."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_start_session_missing_api_key(client: AsyncClient) -> None:
    """POST /api/sessions/start without API key should return 403."""
    response = await client.post("/api/sessions/start")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_start_session_success(
    client: AsyncClient, api_key_headers: dict
) -> None:
    """POST /api/sessions/start should create a session and return session_id."""
    with patch(
        "app.services.esp32_client.ESP32Client.trigger_measurement",
        new=AsyncMock(return_value=True),
    ):
        response = await client.post(
            "/api/sessions/start", headers=api_key_headers
        )
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data
    assert data["status"] in ("waiting", "measuring")


@pytest.mark.asyncio
async def test_start_session_esp32_offline(
    client: AsyncClient, api_key_headers: dict
) -> None:
    """When ESP32 is offline, session should still be created (status=waiting)."""
    with patch(
        "app.services.esp32_client.ESP32Client.trigger_measurement",
        new=AsyncMock(return_value=False),
    ):
        response = await client.post(
            "/api/sessions/start", headers=api_key_headers
        )
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data


@pytest.mark.asyncio
async def test_receive_result_valid(
    client: AsyncClient, api_key_headers: dict
) -> None:
    """POST /api/sessions/{id}/result with valid data should return success."""
    # Create session first
    with patch(
        "app.services.esp32_client.ESP32Client.trigger_measurement",
        new=AsyncMock(return_value=False),
    ):
        start_resp = await client.post(
            "/api/sessions/start", headers=api_key_headers
        )
    session_id = start_resp.json()["session_id"]

    result_payload = {"height_cm": 170.5, "distance_cm": 79.5}
    response = await client.post(
        f"/api/sessions/{session_id}/result",
        json=result_payload,
        headers=api_key_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["session_id"] == session_id


@pytest.mark.asyncio
async def test_receive_result_invalid_height_too_short(
    client: AsyncClient, api_key_headers: dict
) -> None:
    """Height below 50 cm should be rejected with 422."""
    with patch(
        "app.services.esp32_client.ESP32Client.trigger_measurement",
        new=AsyncMock(return_value=False),
    ):
        start_resp = await client.post(
            "/api/sessions/start", headers=api_key_headers
        )
    session_id = start_resp.json()["session_id"]

    result_payload = {"height_cm": 30.0, "distance_cm": 220.0}
    response = await client.post(
        f"/api/sessions/{session_id}/result",
        json=result_payload,
        headers=api_key_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_receive_result_invalid_height_too_tall(
    client: AsyncClient, api_key_headers: dict
) -> None:
    """Height above 250 cm should be rejected with 422."""
    with patch(
        "app.services.esp32_client.ESP32Client.trigger_measurement",
        new=AsyncMock(return_value=False),
    ):
        start_resp = await client.post(
            "/api/sessions/start", headers=api_key_headers
        )
    session_id = start_resp.json()["session_id"]

    result_payload = {"height_cm": 280.0, "distance_cm": -30.0}
    response = await client.post(
        f"/api/sessions/{session_id}/result",
        json=result_payload,
        headers=api_key_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_receive_result_session_not_found(
    client: AsyncClient, api_key_headers: dict
) -> None:
    """Posting result to a non-existent session should return 404."""
    result_payload = {"height_cm": 170.0, "distance_cm": 80.0}
    response = await client.post(
        "/api/sessions/non-existent-id/result",
        json=result_payload,
        headers=api_key_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_session_status(
    client: AsyncClient, api_key_headers: dict
) -> None:
    """GET /api/sessions/{id} should return session details."""
    with patch(
        "app.services.esp32_client.ESP32Client.trigger_measurement",
        new=AsyncMock(return_value=False),
    ):
        start_resp = await client.post(
            "/api/sessions/start", headers=api_key_headers
        )
    session_id = start_resp.json()["session_id"]

    response = await client.get(
        f"/api/sessions/{session_id}", headers=api_key_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == session_id


@pytest.mark.asyncio
async def test_double_result_rejected(
    client: AsyncClient, api_key_headers: dict
) -> None:
    """Posting result twice to same session should return 409 on second attempt."""
    with patch(
        "app.services.esp32_client.ESP32Client.trigger_measurement",
        new=AsyncMock(return_value=False),
    ):
        start_resp = await client.post(
            "/api/sessions/start", headers=api_key_headers
        )
    session_id = start_resp.json()["session_id"]

    payload = {"height_cm": 170.0, "distance_cm": 80.0}
    await client.post(
        f"/api/sessions/{session_id}/result",
        json=payload,
        headers=api_key_headers,
    )
    second = await client.post(
        f"/api/sessions/{session_id}/result",
        json=payload,
        headers=api_key_headers,
    )
    assert second.status_code == 409
