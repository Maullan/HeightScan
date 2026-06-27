"""
FastAPI application entry point.

Startup:
  - Initialise session cleanup task
  - Configure CORS, rate limiting, routers

Shutdown:
  - Cancel cleanup task
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.health import router as health_router
from app.api.sessions import router as sessions_router
from app.core.config import settings
from app.models.session import SessionStatus
from app.services.session_manager import session_manager
from app.websocket.manager import connection_manager

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])


# ---------------------------------------------------------------------------
# Application lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup / shutdown logic."""
    logger.info("Starting %s v%s", settings.app_name, settings.app_version)
    session_manager.start_cleanup()
    yield
    logger.info("Shutting down — stopping cleanup task")
    session_manager.stop_cleanup()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "IoT Height Measurement System — REST + WebSocket API.\n\n"
        "All endpoints except /api/health require the `X-API-Key` header."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

# CORS — allow all origins for local/LAN development
# For production, restrict to specific domains in .env CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(health_router)
app.include_router(sessions_router)


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str) -> None:
    """
    WebSocket connection for real-time session status updates.

    The frontend connects here after creating a session.
    The backend pushes status messages (waiting → measuring → done).
    """
    # Verify session exists before accepting
    session = await session_manager.get_session(session_id)
    if session is None:
        await websocket.close(code=4004, reason="Session not found")
        return

    await connection_manager.connect(session_id, websocket)

    # If the session is already done (reconnection scenario), push current state
    if session.status == SessionStatus.DONE:
        await connection_manager.broadcast_status(
            session_id=session_id,
            status=SessionStatus.DONE,
            height_cm=session.height_cm,
        )

    try:
        while True:
            # Keep the connection alive — we only push from server, no client messages expected
            data = await websocket.receive_text()
            logger.debug("Received WS message from client (session=%s): %s", session_id, data)
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected: session=%s", session_id)
    finally:
        await connection_manager.disconnect(session_id, websocket)


# ---------------------------------------------------------------------------
# Root redirect
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
async def root() -> dict:
    return {"message": f"{settings.app_name} is running. See /docs for API."}
