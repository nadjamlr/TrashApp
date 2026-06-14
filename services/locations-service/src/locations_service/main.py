from trashapp_shared.fastapi_app import create_app
from locations_service.open_data import get_locations
from locations_service.distance import filter_and_rank
from locations_service.schemas import LocationResult, LocationsResponse

app = create_app("locations-service")


@app.on_event("startup")
async def startup() -> None:
    await get_locations()



@app.get("/locations", response_model=LocationsResponse)
async def locations(
    material: str,
    lat: float,
    lng: float,
    radius: int = 3000,
    routing: bool = False,
) -> LocationsResponse:
    all_locations = await get_locations()
    filtered = [
        loc for loc in all_locations
        if any(material.lower() in m.lower() for m in loc.get("materials", []))
    ]
    ranked = filter_and_rank(filtered, lat, lng, radius)
    return LocationsResponse(locations=[LocationResult(**loc) for loc in ranked])
