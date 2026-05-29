from pydantic import BaseModel, Field


class LocationResult(BaseModel):
    id: str
    name: str
    address: str
    lat: float
    lng: float
    distance_m: int = Field(description="Distance from the user in metres")
    materials: list[str] = Field(description="Accepted material types at this site")
    opening_hours: str = Field(description="Opening hours as free text from Open Data Munich")
    route: dict | None = Field(default=None, description="GeoJSON LineString, present only when routing=true")


class LocationsResponse(BaseModel):
    locations: list[LocationResult]
