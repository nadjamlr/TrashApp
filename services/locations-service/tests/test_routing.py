import asyncio

import httpx
import pytest
from fastapi import HTTPException

from locations_service.routing import fetch_route


ROUTE_GEOMETRY = {
    "type": "LineString",
    "coordinates": [[11.575, 48.137], [11.58, 48.14]],
}


class FakeResponse:
    def __init__(self, status_code: int = 200, payload: dict | None = None) -> None:
        self.status_code = status_code
        self._payload = payload or {"features": [{"geometry": ROUTE_GEOMETRY}]}

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            request = httpx.Request("GET", "https://api.openrouteservice.org")
            response = httpx.Response(self.status_code, request=request)
            raise httpx.HTTPStatusError("ORS error", request=request, response=response)

    def json(self) -> dict:
        return self._payload


class FakeAsyncClient:
    calls = []

    def __init__(self, timeout: float) -> None:
        self.timeout = timeout

    async def __aenter__(self) -> "FakeAsyncClient":
        return self

    async def __aexit__(self, exc_type, exc, traceback) -> None:
        return None

    async def get(self, url: str, headers: dict, params: dict) -> FakeResponse:
        self.calls.append({"url": url, "headers": headers, "params": params})
        return FakeResponse()


def test_fetch_route_returns_geojson_linestring(monkeypatch) -> None:
    FakeAsyncClient.calls = []
    monkeypatch.setattr("locations_service.routing.settings.ors_api_key", "ors-test-key")
    monkeypatch.setattr("locations_service.routing.httpx.AsyncClient", FakeAsyncClient)

    route = asyncio.run(
        fetch_route(
            start_lat=48.137,
            start_lng=11.575,
            end_lat=48.14,
            end_lng=11.58,
            profile="cycling-regular",
        )
    )

    assert route == ROUTE_GEOMETRY
    assert FakeAsyncClient.calls == [
        {
            "url": "https://api.openrouteservice.org/v2/directions/cycling-regular",
            "headers": {"Authorization": "ors-test-key"},
            "params": {"start": "11.575,48.137", "end": "11.58,48.14"},
        }
    ]


def test_fetch_route_requires_api_key(monkeypatch) -> None:
    monkeypatch.setattr("locations_service.routing.settings.ors_api_key", "")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(fetch_route(48.137, 11.575, 48.14, 11.58))

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail["env_var"] == "ORS_API_KEY"


def test_fetch_route_rejects_unsupported_profile(monkeypatch) -> None:
    monkeypatch.setattr("locations_service.routing.settings.ors_api_key", "ors-test-key")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(fetch_route(48.137, 11.575, 48.14, 11.58, profile="driving-car"))

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["supported_profiles"] == ["cycling-regular", "foot-walking"]
