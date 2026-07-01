"""Supabase token authentication dependency.

Verifies the Bearer token by calling the Supabase Auth server directly.
This is the approach recommended by Supabase for HS256 projects, and the
only correct approach for projects using asymmetric keys (ES256 / RS256).

Docs: https://supabase.com/docs/guides/auth/jwts#verifying-with-a-shared-secret-signing-key
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import Header, HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# Supabase Auth server endpoint for verifying a token and fetching user info
_SUPABASE_USER_URL = "{base}/auth/v1/user"


async def get_current_user(
    authorization: str | None = Header(None),
) -> dict[str, Any]:
    """
    FastAPI dependency that validates a Supabase-issued access token.

    Sends a request to the Supabase Auth server with the Bearer token.
    If Supabase returns HTTP 200, the token is valid and we return the user dict.
    Otherwise we raise HTTP 401.

    This approach works regardless of whether the project uses:
    - Shared secret (HS256)
    - Asymmetric keys (ES256 / RS256)

    Usage in endpoint:
        current_user: dict = Depends(get_current_user)
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("[Auth] Missing or malformed Authorization header")
        raise credentials_error

    token = authorization.removeprefix("Bearer ").strip()

    if not settings.supabase_url:
        logger.error("[Auth] SUPABASE_URL is not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server authentication is not configured.",
        )

    # Verify token by calling Supabase Auth server
    url = _SUPABASE_USER_URL.format(base=settings.supabase_url.rstrip("/"))

    # We need the anon key to make requests to the Supabase Auth API.
    # The anon key is stored in config.
    anon_key = settings.supabase_anon_key

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": anon_key,
                },
            )

        if response.status_code == 200:
            user_data: dict[str, Any] = response.json()
            logger.debug("[Auth] Token valid for user: %s", user_data.get("id"))
            return user_data
        else:
            logger.warning(
                "[Auth] Supabase rejected token — HTTP %s: %s",
                response.status_code,
                response.text[:200],
            )
            raise credentials_error

    except httpx.TimeoutException:
        logger.error("[Auth] Supabase Auth server timeout")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service timeout. Please try again.",
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("[Auth] Unexpected error verifying token")
        raise credentials_error
