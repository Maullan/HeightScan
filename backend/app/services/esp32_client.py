"""
ESP32 HTTP client.

Sends a trigger request to the ESP32 device to initiate a measurement.
Uses httpx for async HTTP calls with configurable timeout.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class ESP32Client:
    """Async HTTP client for communicating with the ESP32 device."""

    def __init__(self) -> None:
        self._base_url = settings.esp32_url.rstrip("/")
        self._timeout = settings.esp32_trigger_timeout

    async def trigger_measurement(self, session_id: str) -> bool:
        """
        Send a trigger command to the ESP32.

        Parameters
        ----------
        session_id: The backend session ID — passed to ESP32 so it can
                    include it in the result POST.

        Returns
        -------
        True  — ESP32 acknowledged the trigger.
        False — ESP32 unreachable or returned an error.
        """
        url = f"{self._base_url}/trigger"
        payload = {"session_id": session_id}
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                logger.info(
                    "ESP32 trigger sent for session %s — HTTP %s",
                    session_id,
                    response.status_code,
                )
                return True
        except httpx.ConnectError:
            logger.warning("ESP32 unreachable at %s", url)
            return False
        except httpx.TimeoutException:
            logger.warning("ESP32 trigger timed out (%.1fs)", self._timeout)
            return False
        except httpx.HTTPStatusError as exc:
            logger.error("ESP32 returned HTTP %s: %s", exc.response.status_code, exc)
            return False
        except Exception:
            logger.exception("Unexpected error triggering ESP32")
            return False

    async def health_check(self) -> Optional[dict]:
        """
        Optional: ping ESP32 /health endpoint.

        Returns parsed JSON on success or None on failure.
        """
        url = f"{self._base_url}/health"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except Exception:
            return None


# Application-wide singleton
esp32_client = ESP32Client()
