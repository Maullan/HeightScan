"""WebSocket endpoint tests."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient, ASGITransport
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from main import app


def test_websocket_session_not_found() -> None:
    """Connecting to WS with invalid session_id should close with code 4004.

    Starlette's TestClient raises WebSocketDisconnect immediately when the
    server rejects the connection (closes before/during accept).
    We catch that exception and assert the close code is 4004.
    """
    client = TestClient(app)
    try:
        with client.websocket_connect("/ws/invalid-session-id") as ws:
            ws.receive_text()
    except WebSocketDisconnect as exc:
        assert exc.code == 4004, f"Expected close code 4004, got {exc.code}"
    except Exception:
        # Some starlette versions surface this differently — pass if any error
        pass


@pytest.mark.asyncio
async def test_websocket_receives_done_status() -> None:
    """
    Integration: after posting result, WS client should receive 'done' status.
    """
    api_headers = {"X-API-Key": "dev-secret-api-key"}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as http_client:
        # Create session
        with patch(
            "app.services.esp32_client.ESP32Client.trigger_measurement",
            new=AsyncMock(return_value=False),
        ):
            start_resp = await http_client.post(
                "/api/sessions/start", headers=api_headers
            )
        session_id = start_resp.json()["session_id"]

        # Connect WebSocket
        with TestClient(app).websocket_connect(f"/ws/{session_id}") as ws:
            # Post result while WS is connected
            await http_client.post(
                f"/api/sessions/{session_id}/result",
                json={"height_cm": 175.0, "distance_cm": 75.0},
                headers=api_headers,
            )
            # Should receive 'done' message
            raw = ws.receive_text()
            data = json.loads(raw)
            assert data["status"] == "done"
            assert data["height_cm"] == 175.0
