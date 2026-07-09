from fastapi.testclient import TestClient

from locations_service.main import app


client = TestClient(app)


TEST_LOCATIONS = [
    {
        "id": "site-1",
        "name": "Wertstoffinsel Test",
        "address": "Teststr. 1, München",
        "lat": 48.138,
        "lng": 11.576,
        "materials": ["glass", "paper"],
        "type": "wertstoffinsel",
        "opening_hours": None,
    }
]


def test_locations_without_routing_returns_null_route(monkeypatch) -> None:
    async def fake_get_locations() -> list[dict]:
        return TEST_LOCATIONS

    async def fail_if_routes_requested(*args, **kwargs) -> list[dict]:
        raise AssertionError("Routes should not be requested unless routing=true")

    monkeypatch.setattr("locations_service.main.get_locations", fake_get_locations)
    monkeypatch.setattr("locations_service.main.add_routes_to_locations", fail_if_routes_requested)

    response = client.get("/locations", params={"lat": 48.137, "lng": 11.575, "radius": 1000})

    assert response.status_code == 200
    location = response.json()["locations"][0]
    assert location["route"] is None


def test_locations_with_routing_returns_route(monkeypatch) -> None:
    route = {
        "type": "LineString",
        "coordinates": [[11.575, 48.137], [11.576, 48.138]],
    }

    async def fake_get_locations() -> list[dict]:
        return TEST_LOCATIONS

    async def fake_add_routes_to_locations(
        locations: list[dict],
        user_lat: float,
        user_lng: float,
        profile: str,
    ) -> list[dict]:
        assert user_lat == 48.137
        assert user_lng == 11.575
        assert profile == "foot-walking"
        return [{**location, "route": route} for location in locations]

    monkeypatch.setattr("locations_service.main.get_locations", fake_get_locations)
    monkeypatch.setattr("locations_service.main.add_routes_to_locations", fake_add_routes_to_locations)

    response = client.get(
        "/locations",
        params={"lat": 48.137, "lng": 11.575, "radius": 1000, "routing": "true"},
    )

    assert response.status_code == 200
    location = response.json()["locations"][0]
    assert location["route"] == route
