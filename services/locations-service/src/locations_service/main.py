from fastapi import HTTPException, status

from trashapp_shared.fastapi_app import create_app
from locations_service.schemas import LocationsResponse

app = create_app("locations-service")


@app.get("/locations", response_model=LocationsResponse)
async def get_locations(
    material: str,
    lat: float,
    lng: float,
    radius: int = 3000,
    routing: bool = False,
) -> LocationsResponse:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
