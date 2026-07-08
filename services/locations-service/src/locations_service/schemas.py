from pydantic import BaseModel, Field


class OpeningHours(BaseModel):
    monday: str
    tuesday: str
    wednesday: str
    thursday: str
    friday: str
    saturday: str
    sunday: str


class LocationResult(BaseModel):
    id: str
    name: str
    address: str
    lat: float
    lng: float
    distance_m: int = Field(description="Distance from the user in metres")
    materials: list[str] = Field(description="Accepted material types at this site")
    type: str = Field(description="Station type, e.g. wertstoffhof or wertstoffinsel")
    opening_hours: OpeningHours | None = Field(default=None, description="Opening hours per weekday")
    route: dict | None = Field(default=None, description="GeoJSON LineString, present only when routing=true")


class LocationsResponse(BaseModel):
    locations: list[LocationResult]
