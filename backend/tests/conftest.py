"""Pytest configuration and shared fixtures."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture
async def client() -> AsyncClient:
    """Async test client for the FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def api_key_headers() -> dict:
    """Return headers with a valid API key for authenticated requests."""
    return {"X-API-Key": "dev-secret-api-key"}
