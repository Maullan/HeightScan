"""
WebSocket Connection Manager.

Maintains a registry of active WebSocket connections keyed by session_id.
Provides broadcast methods to push JSON messages to all listeners of a session.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from typing import Dict, List, Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections per session.

    A single session can have multiple browser tabs connected,
    so we store a list of WebSockets per session_id.
    """

    def __init__(self) -> None:
        # session_id → list of active WebSocket connections
        self._connections: Dict[str, List[WebSocket]] = defaultdict(list)
        self._lock: asyncio.Lock = asyncio.Lock()

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self._connections[session_id].append(websocket)
        logger.info(
            "WebSocket connected: session=%s total_conns=%d",
            session_id,
            len(self._connections[session_id]),
        )

    async def disconnect(self, session_id: str, websocket: WebSocket) -> None:
        """Remove a WebSocket from the registry."""
        async with self._lock:
            conns = self._connections.get(session_id, [])
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                self._connections.pop(session_id, None)
        logger.info("WebSocket disconnected: session=%s", session_id)

    async def broadcast(self, session_id: str, data: Dict[str, Any]) -> None:
        """Send a JSON message to all connections of a session."""
        message = json.dumps(data)
        async with self._lock:
            conns = list(self._connections.get(session_id, []))

        dead: List[WebSocket] = []
        for ws in conns:
            try:
                await ws.send_text(message)
            except Exception:
                logger.warning(
                    "Failed to send to WebSocket in session %s — marking dead",
                    session_id,
                )
                dead.append(ws)

        # Clean up dead connections
        if dead:
            async with self._lock:
                for ws in dead:
                    try:
                        self._connections[session_id].remove(ws)
                    except ValueError:
                        pass

    async def broadcast_status(
        self,
        session_id: str,
        status: str,
        height_cm: float | None = None,
        error_msg: str | None = None,
    ) -> None:
        """Convenience method to broadcast a standard status update."""
        payload: Dict[str, Any] = {
            "type": "status_update",
            "session_id": session_id,
            "status": status,
        }
        if height_cm is not None:
            payload["height_cm"] = height_cm
        if error_msg is not None:
            payload["error_msg"] = error_msg
        await self.broadcast(session_id, payload)

    def active_sessions(self) -> List[str]:
        """Return list of session IDs that have active connections."""
        return list(self._connections.keys())


# Application-wide singleton
connection_manager = ConnectionManager()
