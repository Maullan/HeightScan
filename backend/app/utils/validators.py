"""Height / distance validation utilities."""

from __future__ import annotations

from app.core.config import settings


def is_valid_height(height_cm: float) -> bool:
    """Return True if height is within the acceptable human range."""
    return settings.min_height_cm <= height_cm <= settings.max_height_cm


def is_valid_distance(distance_cm: float) -> bool:
    """Return True if the raw sensor distance is physically plausible."""
    return 0 < distance_cm <= settings.reference_height_cm


def distance_to_height(distance_cm: float) -> float:
    """
    Convert raw sensor distance to person height.

    Height = ReferenceHeight − Distance
    """
    height = settings.reference_height_cm - distance_cm
    return round(height, 1)
