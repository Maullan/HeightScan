"""Session domain model."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional


class SessionStatus(str, Enum):
    """Lifecycle states of a measurement session."""

    WAITING = "waiting"
    MEASURING = "measuring"
    DONE = "done"
    ERROR = "error"


class Session:
    """
    In-memory representation of a single measurement session.

    Attributes
    ----------
    session_id:   Unique UUID string.
    status:       Current lifecycle state.
    height_cm:    Measured height (populated after DONE).
    distance_cm:  Raw sensor distance (populated after DONE).
    error_msg:    Human-readable error if status is ERROR.
    created_at:   UTC timestamp of creation (used for TTL eviction).
    """

    __slots__ = (
        "session_id",
        "status",
        "height_cm",
        "distance_cm",
        "error_msg",
        "created_at",
    )

    def __init__(self, session_id: str) -> None:
        self.session_id: str = session_id
        self.status: SessionStatus = SessionStatus.WAITING
        self.height_cm: Optional[float] = None
        self.distance_cm: Optional[float] = None
        self.error_msg: Optional[str] = None
        self.created_at: datetime = datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "status": self.status,
            "height_cm": self.height_cm,
            "distance_cm": self.distance_cm,
            "error_msg": self.error_msg,
            "created_at": self.created_at.isoformat(),
        }
