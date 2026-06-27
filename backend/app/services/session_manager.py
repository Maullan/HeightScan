"""
In-memory Session Manager.

Stores all active sessions in a dict keyed by session_id.
A background task periodically evicts expired sessions (TTL-based).
All mutations are protected by an asyncio.Lock for coroutine safety.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional

from app.core.config import settings
from app.models.session import Session, SessionStatus

logger = logging.getLogger(__name__)


class SessionManager:
    """Thread-safe in-memory store for measurement sessions."""

    def __init__(self) -> None:
        self._sessions: Dict[str, Session] = {}
        self._lock: asyncio.Lock = asyncio.Lock()
        self._cleanup_task: Optional[asyncio.Task] = None  # type: ignore[type-arg]

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start_cleanup(self) -> None:
        """Start the background TTL-eviction loop. Call from app startup."""
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        logger.info("Session cleanup task started.")

    def stop_cleanup(self) -> None:
        """Cancel the cleanup task. Call from app shutdown."""
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            logger.info("Session cleanup task stopped.")

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    async def create_session(self) -> Session:
        """Create a new session and store it."""
        session_id = str(uuid.uuid4())
        session = Session(session_id=session_id)
        async with self._lock:
            self._sessions[session_id] = session
        logger.info("Created session: %s", session_id)
        return session

    async def get_session(self, session_id: str) -> Optional[Session]:
        """Return session by id or None if not found."""
        async with self._lock:
            return self._sessions.get(session_id)

    async def update_status(
        self,
        session_id: str,
        status: SessionStatus,
        height_cm: Optional[float] = None,
        distance_cm: Optional[float] = None,
        error_msg: Optional[str] = None,
    ) -> Optional[Session]:
        """Update a session's fields atomically."""
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return None
            session.status = status
            if height_cm is not None:
                session.height_cm = height_cm
            if distance_cm is not None:
                session.distance_cm = distance_cm
            if error_msg is not None:
                session.error_msg = error_msg
        logger.info(
            "Session %s → status=%s height=%s", session_id, status, height_cm
        )
        return session

    async def delete_session(self, session_id: str) -> bool:
        """Remove a session. Returns True if it existed."""
        async with self._lock:
            existed = session_id in self._sessions
            self._sessions.pop(session_id, None)
        return existed

    async def all_sessions(self) -> Dict[str, Session]:
        """Return a shallow copy of all sessions."""
        async with self._lock:
            return dict(self._sessions)

    # ------------------------------------------------------------------
    # Internal: TTL eviction
    # ------------------------------------------------------------------

    async def _cleanup_loop(self) -> None:
        """Periodically evict sessions older than SESSION_TTL_SECONDS."""
        ttl = timedelta(seconds=settings.session_ttl_seconds)
        while True:
            try:
                await asyncio.sleep(60)  # run every minute
                now = datetime.utcnow()
                expired: list[str] = []
                async with self._lock:
                    for sid, session in list(self._sessions.items()):
                        if now - session.created_at > ttl:
                            expired.append(sid)
                    for sid in expired:
                        del self._sessions[sid]
                if expired:
                    logger.info("Evicted %d expired session(s): %s", len(expired), expired)
            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("Error in session cleanup loop")


# Application-wide singleton
session_manager = SessionManager()
