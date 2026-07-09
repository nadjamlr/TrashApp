from typing import Literal

import httpx
from fastapi import HTTPException

from trashapp_shared.settings import settings


RouteProfile = Literal["foot-walking", "cycling-regular"]

ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/{profile}"
SUPPORTED_PROFILES = {"foot-walking", "cycling-regular"}


async def fetch_route(
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
    profile: str = "foot-walking",
) -> dict:
    if profile not in SUPPORTED_PROFILES:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported routing profile",
                "supported_profiles": sorted(SUPPORTED_PROFILES),
            },
        )

    if not settings.ors_api_key:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "OpenRouteService API key is not configured",
                "env_var": "ORS_API_KEY",
            },
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                ORS_DIRECTIONS_URL.format(profile=profile),
                headers={"Authorization": settings.ors_api_key},
                params={
                    "start": f"{start_lng},{start_lat}",
                    "end": f"{end_lng},{end_lat}",
                },
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        status_code = 401 if exc.response.status_code in {401, 403} else 502
        raise HTTPException(
            status_code=status_code,
            detail={
                "error": "OpenRouteService routing request failed",
                "status_code": exc.response.status_code,
            },
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "OpenRouteService routing request failed",
                "detail": str(exc),
            },
        ) from exc

    payload = response.json()
    features = payload.get("features")
    if not isinstance(features, list) or not features:
        raise HTTPException(
            status_code=502,
            detail={"error": "OpenRouteService routing response did not include a route"},
        )

    geometry = features[0].get("geometry")
    if not isinstance(geometry, dict) or geometry.get("type") != "LineString":
        raise HTTPException(
            status_code=502,
            detail={"error": "OpenRouteService routing response did not include a GeoJSON LineString"},
        )

    return geometry


async def add_routes_to_locations(
    locations: list[dict],
    user_lat: float,
    user_lng: float,
    profile: str = "foot-walking",
) -> list[dict]:
    routed_locations = []
    for location in locations:
        route = await fetch_route(
            start_lat=user_lat,
            start_lng=user_lng,
            end_lat=location["lat"],
            end_lng=location["lng"],
            profile=profile,
        )
        routed_locations.append({**location, "route": route})

    return routed_locations
